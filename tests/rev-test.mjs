import puppeteer from "puppeteer-core";

const FILE = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"], defaultViewport: { width: 420, height: 900 } });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(FILE, { waitUntil: "load" });
await sleep(800);
const tabs = await page.$$eval(".tab", (els) => els.map((e) => e.textContent.trim()));
// 탭 이모지는 ui7 에서 선 아이콘(svg)으로 바뀌므로 글자만 본다
ok("탭 목록에 개정 포함", tabs.includes("개정"), JSON.stringify(tabs));
ok("기존 탭 9개 유지", tabs.length === 10);

// 개정 탭 열기
await page.evaluate(() => showTab("rev"));
await sleep(300);
const info = await page.evaluate(() => ({
  all: amendItems().length,
  byLaw: amendItems().reduce((m, i) => ((m[i.law] = (m[i.law] || 0) + 1), m), {}),
  top: amendItems().slice(0, 5).map((i) => `${i.law} ${i.no} ${i.latest} ${i.kinds.join("/")}`),
  shown: document.querySelectorAll("#p-rev .rv-item").length,
  text: document.querySelector("#p-rev .row .small")?.textContent,
}));
ok("자동 추출 건수", info.all > 20, JSON.stringify(info.byLaw));
console.log("최신 5건:", info.top);
ok("최근 2년 목록 표시", info.shown > 0, `${info.shown}건 / ${info.text}`);
// 파서 단위 점검
const pm = await page.evaluate(() => [
  parseMarks("개정 2013. 3. 23., 2014. 11. 19., 2025. 10. 1."),
  parseMarks("신설 2018.3.29, 개정 2022.4.1"),
  parseMarks("개정 2016. 12. 2."),
]);
ok("복합 표기 파싱", pm[0].length === 3 && pm[0][2].date === "2025-10-01" && pm[1][0].kind === "신설" && pm[1][1].kind === "개정" && pm[1][1].date === "2022-04-01", JSON.stringify(pm[1]));
await page.screenshot({ path: "rev-recent.png" });

// 연도/법령 필터
await page.click('[data-year="all"]'); await sleep(200);
const allShown = await page.$$eval("#p-rev .rv-item", (e) => e.length);
ok("전체 연도 필터", allShown === info.all, String(allShown));
await page.click('[data-law="정관"]'); await sleep(200);
const lawShown = await page.$$eval("#p-rev .rv-item .law", (e) => e.every((x) => x.textContent === "정관") && e.length);
ok("법령 필터", lawShown > 0, String(lawShown));
// 확인 토글
await page.evaluate(() => document.querySelector("[data-seen]").click()); await sleep(200);
ok("확인 토글 + 저장", await page.evaluate(() => Object.keys(S.revSeen || {}).length === 1 && !!localStorage.getItem("orgmaster.v1").includes("revSeen")));

// 비교 탭: 잘못된 입력
await page.click('[data-sub="cmp"]'); await sleep(200);
const bad1 = await page.evaluate(() => revImport("그냥 문장"));
const bad2 = await page.evaluate(() => revImport('{"changes":[]}'));
const bad3 = await page.evaluate(() => revImport('{"changes":[{"no":"1"}]}'));
ok("잘못된 입력 거부", [bad1, bad2, bad3].every((x) => typeof x === "string"), JSON.stringify([bad1, bad2, bad3]));

// 정상 입력 (코드블록 포함) - 테스트용 가상 개정
const sample = "```json\n" + JSON.stringify({
  schema: "rev.v1", from: "2026", to: "2027",
  changes: [
    { law: "조직법", no: "13", title: "의결정족수 등", type: "개정", effective: "2027-01-01",
      before: "① 회장은 의장이 되며 그 사무를 총괄한다.\n② 재적위원 과반수의 출석으로 개의하고, 출석위원 과반수의 찬성으로 의결한다.",
      after: "① 회장은 의장이 되며 그 사무를 총괄한다.\n② 재적위원 3분의 1 이상의 출석으로 개의하고, 출석위원 과반수의 찬성으로 의결한다.", note: "테스트" },
    { law: "정관", no: "99", title: "신설 테스트", type: "신설", effective: "2027-01-01", before: "", after: "신설 조문 내용" },
    { law: "정관", no: "98", title: "삭제 테스트", type: "삭제", effective: "2027-01-01", before: "삭제될 내용", after: "" },
  ],
}) + "\n```";
const imp = await page.evaluate((t) => { const r = revImport(t); renderers.rev(); return r; }, sample);
ok("정상 등록", imp.n === 3, JSON.stringify(imp));
await sleep(200);
const cmp = await page.evaluate(() => ({
  items: document.querySelectorAll("#p-rev .rv-item").length,
  dels: [...document.querySelectorAll("#p-rev del.rv-del")].map((e) => e.textContent).slice(0, 4),
  adds: [...document.querySelectorAll("#p-rev .rv-add")].map((e) => e.textContent).slice(0, 5),
}));
ok("비교 카드 3건", cmp.items === 3, JSON.stringify(cmp));
ok("바뀐 낱말만 표시", cmp.dels.some((d) => d.includes("과반수")) && cmp.adds.some((a) => a.includes("3분의 1 이상")), "");
await page.screenshot({ path: "rev-cmp.png" });

// 가리기 모드
await page.click("#rv-hide"); await sleep(200);
const hiddenColor = await page.evaluate(() => getComputedStyle(document.querySelector(".rv-hide .rv-add")).color);
ok("가리기 모드 적용", hiddenColor.includes("0, 0, 0, 0") || hiddenColor === "rgba(0, 0, 0, 0)" || hiddenColor === "transparent", hiddenColor);
await page.click(".rv-hide .rv-add"); await sleep(100);
ok("눌러서 확인", await page.evaluate(() => document.querySelector(".rv-hide .rv-add").classList.contains("rev")));
await page.screenshot({ path: "rev-cmp-hide.png" });

// 재등록 = 덮어쓰기(중복 없음)
await page.evaluate((t) => revImport(t), sample);
ok("같은 조문 재등록 시 덮어쓰기", await page.evaluate(() => S.rev.changes.length === 3));

// 원문 이동
await page.evaluate(() => { RV.sub = "recent"; RV.law = "전체"; RV.year = "recent"; renderers.rev(); });
await page.click("[data-goart]"); await sleep(500);
ok("원문 탭으로 이동", await page.evaluate(() => document.getElementById("p-read").classList.contains("on")));

// 기존 탭 렌더 회귀
for (const t of ["today", "read", "quiz", "exam", "find", "cho", "table", "lab", "ask"]) {
  await page.evaluate((id) => showTab(id), t); await sleep(150);
}
ok("기존 탭 전부 렌더 (오류 없음)", errors.length === 0, errors.join(" | "));
await page.evaluate(() => showTab("rev"));
await page.setViewport({ width: 1100, height: 900 });
await sleep(200);
console.log(res.join("\n"));
console.log(errors.length ? "\n오류:\n" + [...new Set(errors)].join("\n") : "\n브라우저 오류 없음");
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
