import puppeteer from "puppeteer-core";

const FILE = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"], defaultViewport: { width: 420, height: 900 } });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text()); });
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(FILE, { waitUntil: "load" });
await sleep(600);

/* ── 회독 탭 ── */
await page.evaluate(() => { R.law = "운영규정"; R.topic = "0"; showTab("read"); });
await sleep(500);
const r1 = await page.evaluate(() => ({
  selHidden: ["r-topic", "r-mode", "r-jump"].every((id) => document.getElementById(id).hidden && getComputedStyle(document.getElementById(id)).display === "none"),
  rows: document.querySelectorAll("#r-chips .cs-row").length,
  topics: [...document.querySelectorAll("#r-chips [data-topic]")].map((b) => b.textContent),
  chapters: [...document.querySelectorAll("#r-chips [data-jump]")].map((b) => b.textContent),
  modes: [...document.querySelectorAll("#r-chips [data-mode]")].map((b) => b.textContent),
  law: R.law,
}));
ok("선택 상자 숨김 + 칩 3줄", r1.selHidden && r1.rows === 3, JSON.stringify({ law: r1.law, rows: r1.rows }));
ok("주제 칩 생성", r1.topics.length >= 5, r1.topics.slice(0, 4).join(" / "));
ok("장 칩 생성", r1.chapters.length >= 2, r1.chapters.slice(0, 3).join(" / "));
ok("가리기 칩 4개", r1.modes.length === 4, r1.modes.join(" / "));
await page.screenshot({ path: "ux-read.png" });

// 법령 바꾸면 칩이 새로 만들어지는지
for (const law of ["정관", "운영규정", "조직법"]) {
  await page.click(`#r-law [data-law="${law}"]`); await sleep(350);
  const n = await page.evaluate(() => ({ t: document.querySelectorAll("#r-chips [data-topic]").length, c: document.querySelectorAll("#r-chips [data-jump]").length, arts: document.querySelectorAll("#r-body .art").length }));
  ok(`${law}: 칩·조문 표시`, n.t > 1 && n.arts > 0, JSON.stringify(n));
}
// 주제 칩 클릭 → 필터
const before = await page.evaluate(() => document.querySelectorAll("#r-body .art").length);
await page.evaluate(() => document.querySelectorAll("#r-chips [data-topic]")[1].click()); await sleep(350);
const after = await page.evaluate(() => ({ n: document.querySelectorAll("#r-body .art").length, topic: R.topic, pressed: document.querySelectorAll('#r-chips [data-topic][aria-pressed="true"]').length }));
ok("주제 칩 → 조문 범위 변경", after.n > 0 && after.n < before && after.pressed === 1, `${before}→${after.n}, topic=${after.topic}`);
await page.evaluate(() => document.querySelectorAll("#r-chips [data-topic]")[0].click()); await sleep(300);
// 가리기 칩
await page.evaluate(() => document.querySelector('#r-chips [data-mode="1"]').click()); await sleep(350);
ok("가리기 칩 → 모드 적용", await page.evaluate(() => R.mode === "1" && document.body.dataset.rd === "1" && document.querySelector('#r-chips [data-mode="1"]').getAttribute("aria-pressed") === "true"));
await page.evaluate(() => document.querySelector('#r-chips [data-mode="0"]').click()); await sleep(300);
// 장 칩 → 스크롤 이동
const y0 = await page.evaluate(() => scrollY);
await page.evaluate(() => { const c = [...document.querySelectorAll("#r-chips [data-jump]")]; c[c.length - 1].click(); }); await sleep(900);
ok("장 칩 → 해당 장으로 스크롤", (await page.evaluate(() => scrollY)) > y0 + 200, `${y0}→${await page.evaluate(() => scrollY)}`);
// 번호판
await page.evaluate(() => document.querySelector("#r-chips [data-sheet]").click()); await sleep(300);
const sheet = await page.evaluate(() => ({ btns: document.querySelectorAll(".ov [data-aj]").length, heads: document.querySelectorAll(".ov .cs-gh").length }));
ok("조문 번호판 열림", sheet.btns > 10 && sheet.heads >= 1, JSON.stringify(sheet));
await page.screenshot({ path: "ux-sheet.png" });
await page.evaluate(() => { document.querySelectorAll(".ov [data-aj]")[5].click(); }); await sleep(900);
ok("번호판 선택 → 닫힘 + 이동", await page.evaluate(() => !document.querySelector(".ov") && scrollY > 100));
await page.screenshot({ path: "ux-read2.png" });

/* ── 검색 탭 ── */
await page.evaluate(() => showTab("find")); await sleep(300);
await page.evaluate(() => { const i = document.getElementById("f-q"); i.value = "중앙위원회"; i.dispatchEvent(new Event("input")); });
await sleep(600);
const f1 = await page.evaluate(() => ({
  chips: [...document.querySelectorAll("#f-sc button")].map((b) => b.textContent),
  cards: document.querySelectorAll("#p-find .fr2").length,
  marks: document.querySelectorAll("#p-find .fr2 mark").length,
  details: document.querySelectorAll("#p-find .fr2 details").length,
  more: !!document.querySelector("[data-fmore]"),
  head: document.querySelector("#f-out p")?.textContent,
}));
ok("구분 칩에 건수 표시", f1.chips.every((c) => /\(\d+\)/.test(c)), f1.chips.join(" | "));
ok("결과 카드 + 강조 + 접이식 해설", f1.cards === 30 && f1.marks > 5 && f1.details > 0, JSON.stringify({ cards: f1.cards, marks: f1.marks, details: f1.details, head: f1.head }));
ok("더 보기 버튼", f1.more);
await page.screenshot({ path: "ux-find.png" });
await page.evaluate(() => document.querySelector("[data-fmore]").click()); await sleep(300);
ok("더 보기 → 60건", (await page.$$eval("#p-find .fr2", (e) => e.length)) === 60);
// 범위 칩
await page.evaluate(() => document.querySelector('#f-sc [data-fsc="exam"]').click()); await sleep(400);
const f2 = await page.evaluate(() => ({ cards: [...document.querySelectorAll("#p-find .fr2 .badge")].every((b) => b.textContent === "문제"), n: document.querySelectorAll("#p-find .fr2").length, pressed: document.querySelector('#f-sc [aria-pressed="true"]').dataset.fsc }));
ok("범위 칩 '기출·문제'", f2.cards && f2.n > 0 && f2.pressed === "exam", JSON.stringify(f2));
// 해설 펼치기
await page.evaluate(() => document.querySelector("#p-find .fr2 details summary").click()); await sleep(200);
ok("해설 펼침", await page.evaluate(() => document.querySelector("#p-find .fr2 details").open && document.querySelector("#p-find .fr2-a").textContent.includes("정답")));
await page.screenshot({ path: "ux-find-exam.png" });
// 조문 보기로 이동
await page.evaluate(() => document.querySelector('#f-sc [data-fsc="조직법"]').click()); await sleep(400);
await page.evaluate(() => document.querySelector("[data-fgo]").click()); await sleep(900);
ok("검색 → 원문 보기 이동", await page.evaluate(() => document.getElementById("p-read").classList.contains("on")));
// 결과 없음/빈 검색
await page.evaluate(() => showTab("find")); await sleep(200);
await page.evaluate(() => { const i = document.getElementById("f-q"); i.value = ""; i.dispatchEvent(new Event("input")); }); await sleep(500);
ok("빈 검색 안내", await page.evaluate(() => document.getElementById("f-out").textContent.includes("검색어를 입력")));

/* ── 회귀: 전 탭 렌더 + 개정 탭 ── */
for (const t of ["today", "read", "quiz", "exam", "rev", "find", "cho", "table", "lab", "ask"]) { await page.evaluate((id) => showTab(id), t); await sleep(150); }
const real = errors.filter((e) => !/Failed to load resource|favicon/.test(e));
ok("전 탭 렌더 · 콘솔 오류 없음", real.length === 0, real.join(" | "));
await page.setViewport({ width: 1100, height: 900 });
await page.evaluate(() => showTab("read")); await sleep(400);
await page.screenshot({ path: "ux-read-wide.png" });

console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
