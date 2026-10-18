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
const click = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await sleep(250); };

await page.goto(FILE, { waitUntil: "load" });
await sleep(600);

/* ── 기출·오답 ── */
await page.evaluate(() => showTab("exam")); await sleep(300);
const x1 = await page.evaluate(() => ({
  selects: document.querySelectorAll("#p-exam select").length,
  cards: document.querySelectorAll("#p-exam .pk").length,
  starts: document.querySelectorAll("#p-exam [data-xstart]").length,
  notes: document.querySelectorAll("#p-exam > p.small.mute").length,
  titles: [...document.querySelectorAll("#p-exam .pk b")].map((b) => b.textContent),
  firstDisabled: document.querySelector('[data-xstart="wrong"]').disabled,
}));
ok("선택 상자 없음 + 묶음 카드(문제 묶음 전체 표시)", x1.selects === 0 && x1.cards >= 100, String(x1.cards));
ok("안내 문구 유지", x1.notes >= 2, String(x1.notes));
ok("오답노트 카드 존재(스터디 2주차 내 답이 반영돼 있음)", !x1.firstDisabled);
await page.screenshot({ path: "ux2-exam.png" });
await click('[data-xmode="rand"]');
ok("방식 칩", await page.evaluate(() => X.mode === "rand" && document.querySelector('[data-xmode="rand"]').getAttribute("aria-pressed") === "true"));
await click('[data-xkind="mc"]');
const cnt = await page.evaluate(() => document.querySelector('[data-xstart="2026"]').textContent);
ok("유형 칩 → 해당 묶음 풀 수 변경", await page.evaluate(() => { X.grp = "2026"; const a = xCount("2026"); return X.kind === "mc" && a < 39 && a > 15; }), cnt);
await click('[data-xmode="order"]'); await click('[data-xkind=""]');
await click('[data-xstart="2026"]');
ok("풀기 → 세션 시작", await page.evaluate(() => X.sess && X.queue.length === 39 && document.querySelector("#p-exam .xq")));
// 첫 문제 채점 흐름(기존 기능 회귀)
const q = await page.evaluate(() => X.queue[0]);
await page.evaluate((qq) => { const c = qq.kind === "sa" ? null : (qq.kind === "ox" ? qq.a : (qq.q ? qq.a.match(/[①②③④⑤]/g)[0] : "")); if (c) document.querySelector(`[data-xc="${c}"]`)?.click(); }, q);
await sleep(300);
ok("채점 동작(기존 기능)", await page.evaluate(() => !!document.querySelector("#p-exam .xres, #p-exam #x-multi, #p-exam .xex")));
await click("#x-end"); await click("#x-home");
ok("끝내기 → 처음으로(새 화면)", await page.evaluate(() => document.querySelectorAll("#p-exam .pk").length >= 100));

/* ── 뻥뚫 ── */
await page.evaluate(() => showTab("bt")); await sleep(300);
const b1 = await page.evaluate(() => ({
  rows: document.querySelectorAll("#p-bt .cs-row").length,
  topics: (document.getElementById("bt-sel") || {options: []}).options.length,
  start: document.getElementById("bt-start").textContent,
  tabs: [...document.querySelectorAll(".tab")].map((t) => t.textContent.trim()),
}));
ok("뻥뚫 탭 + 설정 8줄(범위 select·화면 키보드 포함)", b1.rows === 8 && b1.topics >= 5 && b1.tabs.includes("뻥뚫"), JSON.stringify({ rows: b1.rows, topics: b1.topics }));
ok("시작 버튼 문구", /시작 \(\d+개 조문\)/.test(b1.start), b1.start);
await page.screenshot({ path: "ux2-bt-home.png" });

// 난이도별 후보 수
const lvCount = {};
for (const lv of [1, 2, 3]) { await click(`[data-lv="${lv}"]`); lvCount[lv] = await page.evaluate(() => btCands().length); }
ok("난이도별 출제 가능 조문 수 (쉬움 ≤ 보통 ≤ 어려움)", lvCount[1] <= lvCount[2] && lvCount[2] <= lvCount[3] && lvCount[1] > 0, JSON.stringify(lvCount));

// 직접 쓰기 – 보통, 빈칸 5개
await click('[data-lv="2"]'); await click('[data-max="5"]'); await click('[data-md="type"]'); await click('[data-cnt="5"]'); await click('[data-ord="num"]');
await click("#bt-start");
const s1 = await page.evaluate(() => ({ sess: BT.sess, n: BT.queue.length, inputs: document.querySelectorAll("#bt-art .bt-in").length, art: BT.queue[0].no, law: BT.queue[0].law }));
ok("세션 시작: 빈칸 입력칸 ≤ 5", s1.sess && s1.n === 5 && s1.inputs > 0 && s1.inputs <= 5, JSON.stringify(s1));
await page.screenshot({ path: "ux2-bt-type.png" });
// 초성 힌트
await click("#bt-hint");
ok("초성 힌트", await page.evaluate(() => [...document.querySelectorAll("#bt-art .bt-in")].every((i) => i.placeholder.length > 0)));
// 일부 정답, 일부 오답
await page.evaluate(() => { const ins = [...document.querySelectorAll("#bt-art .bt-in")]; ins.forEach((i, k) => { i.value = k === 0 ? "틀린답" : " " + i.dataset.ans.split("").join(" ") + " "; }); });
await click("#bt-check");
const c1 = await page.evaluate(() => ({ ok: document.querySelectorAll(".bt-in.ok").length, no: document.querySelectorAll(".bt-in.no").length, fix: document.querySelectorAll(".bt-fix").length, total: document.querySelectorAll(".bt-in").length, rec: JSON.stringify(S.bt) }));
ok("채점: 공백 무시, 오답엔 정답 표시", c1.no === 1 && c1.fix === 1 && c1.ok === c1.total - 1, JSON.stringify({ ok: c1.ok, no: c1.no, total: c1.total }));
ok("기록 저장(S.bt)", c1.rec.includes('"n":1'), c1.rec.slice(0, 80));
await page.screenshot({ path: "ux2-bt-checked.png" });
await click("#bt-next");
// 두 번째: 전부 정답
await page.evaluate(() => { document.querySelectorAll("#bt-art .bt-in").forEach((i) => (i.value = i.dataset.ans)); });
await click("#bt-check");
ok("전부 정답 메시지", await page.evaluate(() => document.getElementById("bt-res").textContent.includes("모두 맞혔")));
// Enter 로 다음 칸 이동 + 마지막 칸에서 채점
await click("#bt-next");
const ent = await page.evaluate(async () => {
  const ins = [...document.querySelectorAll("#bt-art .bt-in")]; ins[0].focus();
  ins[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  return { moved: document.activeElement === ins[1] || ins.length === 1, n: ins.length };
});
ok("Enter → 다음 칸", ent.moved, JSON.stringify(ent));
await click("#bt-end");
ok("끝내기 → 결과 화면", await page.evaluate(() => document.querySelector("#p-bt h2").textContent.includes("결과")));
const hasRetry = await page.evaluate(() => !!document.getElementById("bt-retry"));
ok("틀린 조문만 다시 버튼", hasRetry);
await click("#bt-retry");
ok("재도전 큐 = 틀린 조문", await page.evaluate(() => BT.sess && BT.queue.length >= 1 && BT.queue.length <= 3), String(await page.evaluate(() => BT.queue.length)));
await click("#bt-end"); await click("#bt-home");

// 어려움 + 눌러서 확인
await click('[data-lv="3"]'); await click('[data-md="tap"]'); await click('[data-max="10"]'); await click('[data-cnt="5"]'); await click('[data-ord="weak"]');
await click("#bt-start");
const t1 = await page.evaluate(() => ({ taps: document.querySelectorAll("#bt-art .bt-tap").length, lv: BT.lv, first: BT.queue[0].no, hasOk: !!document.getElementById("bt-ok") }));
ok("어려움·눌러서 확인: 빈칸 ≤ 10", t1.taps > 0 && t1.taps <= 10 && t1.hasOk, JSON.stringify(t1));
await page.screenshot({ path: "ux2-bt-tap.png" });
await click("#bt-art .bt-tap");
ok("빈칸 눌러서 확인", await page.evaluate(() => document.querySelector("#bt-art .bt-tap").classList.contains("rev")));
await click("#bt-ok");
ok("스스로 채점 → 다음 버튼", await page.evaluate(() => !!document.getElementById("bt-next") && Object.keys(S.bt).length >= 2));
await click("#bt-end"); await click("#bt-home");
// 설정 유지
ok("설정 저장(S.btp)", await page.evaluate(() => S.btp && S.btp.lv === 3 && S.btp.md === "tap"), await page.evaluate(() => JSON.stringify(S.btp)));
// 법령 전환
await click('[data-btu="2"]');
ok("2차 → 운영규정 범위 select(그룹 포함)", await page.evaluate(() => document.getElementById("bt-sel").options.length >= 7 && BT.law === "운영규정" && btCands().length > 0), String(await page.evaluate(() => btCands().length)));

/* ── 오늘 ── */
await page.evaluate(() => showTab("today")); await sleep(400);
const td = await page.evaluate(() => ({
  chips: [...document.querySelectorAll("#p-today [data-day]")].length,
  details: !!document.querySelector("#p-today details.card"),
  late: document.querySelector("#p-today .card .row b.grow")?.textContent,
  rec: document.querySelectorAll("#p-today .rec").length,
  pastRows: document.querySelectorAll("#p-today details .exrow").length,
}));
ok("오늘 탭: 지난 일정 접기 + 밀린 일 + 추천", td.details && /밀린 일/.test(td.late || "") && td.pastRows > 5, JSON.stringify(td));
ok("추천 카드(약점 기록 기반)", td.rec >= 1, String(td.rec));
await page.screenshot({ path: "ux2-today.png" });
// 밀린 일 체크 → 개수 감소
const before = await page.evaluate(() => +document.querySelector("#p-today .row b.grow").textContent.match(/\d+/)[0]);
await page.evaluate(() => document.querySelector("#p-today .card input[data-chk]").click()); await sleep(300);
const after = await page.evaluate(() => +document.querySelector("#p-today .row b.grow").textContent.match(/\d+/)[0]);
ok("밀린 일 체크 → 감소", after === before - 1, `${before}→${after}`);
// 하루 건너뛰기
await page.evaluate(() => { document.querySelector("#p-today details").open = true; });
const b4 = after;
await page.evaluate(() => document.querySelector("#p-today [data-skip]").click()); await sleep(300);
const a4 = await page.evaluate(() => +document.querySelector("#p-today .row b.grow")?.textContent.match(/\d+/)?.[0] || 0);
ok("하루 건너뛰기 → 밀린 일 감소", a4 < b4, `${b4}→${a4}`);
await page.evaluate(() => document.querySelector("[data-skipall]").click()); await sleep(300);
ok("모두 건너뛰기 → 밀린 일 카드 사라짐", await page.evaluate(() => !/밀린 일/.test(document.getElementById("p-today").textContent.split("지난 일정")[0] || "")));
// 지난 날 보기 → 일일 목표 표시
await page.evaluate(() => { document.querySelector("#p-today details").open = true; document.querySelector("#p-today details [data-day]").click(); }); await sleep(300);
ok("지난 날 보기", await page.evaluate(() => /오늘의 목표 과제/.test(document.getElementById("p-today").textContent) && dayIdx === 0));
// 추천 → 이동
await page.evaluate(() => { dayIdx = null; renderers.today(); });
await sleep(200);

/* ── 회귀 ── */
for (const t of ["today", "read", "bt", "quiz", "exam", "rev", "find", "cho", "table", "lab", "ask"]) { await page.evaluate((id) => showTab(id), t); await sleep(150); }
const real = errors.filter((e) => !/Failed to load resource|favicon/.test(e));
ok("전 탭 렌더 · 콘솔 오류 없음", real.length === 0, real.join(" | "));
console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
