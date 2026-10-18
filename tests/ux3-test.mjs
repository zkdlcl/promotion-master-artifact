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
const today = await page.evaluate(() => todayKey());

/* 탭 */
const tabs = await page.$$eval(".tab", (els) => els.map((e) => e.textContent.trim()));
ok("자음퀴즈 탭 제거", !tabs.some((t) => t.includes("자음")), tabs.join(" | "));
ok("탭 10개", tabs.length === 10);
await page.evaluate(() => showTab("cho")); await sleep(200);
ok("옛 #cho 주소로 와도 오늘 탭으로", await page.evaluate(() => document.getElementById("p-today").classList.contains("on")));

/* D-day 헤더 + 일정 데이터 */
const hd = await page.evaluate(() => ({ dday: document.getElementById("dday").textContent, n: SCHED.length, exams: SCHED.filter((s) => s.n && !s.prep).length, preps: SCHED.filter((s) => s.prep).length, edu: SCHED.filter((s) => s.edu).length, list: examList().length, last: SCHED[SCHED.length - 1].d }));
console.log("오늘:", today, "헤더:", hd.dday);
ok("일정 26행 = 25차 + 교육", hd.n === 26 && hd.edu === 1 && hd.last === "2027-04-08", JSON.stringify(hd));
ok("시험 22회 + 정비 3회", hd.exams === 22 && hd.preps === 3, `${hd.exams}/${hd.preps}`);
ok("D-day 헤더가 다음 시험", /^D-\d+ · \d+차/.test(hd.dday) || /D-DAY/.test(hd.dday), hd.dday);

/* 오늘 탭 일정 카드 */
await page.evaluate(() => showTab("today")); await sleep(400);
const sc = await page.evaluate(() => {
  const p = document.getElementById("p-today");
  return {
    first: p.querySelector(".td-l").firstElementChild.className, head: p.querySelector(".sch b")?.textContent, nxt: p.querySelector(".sch-n b")?.textContent,
    dd: p.querySelector(".sch-dd")?.textContent, oldCard: p.textContent.includes("📅 시험 일정"), choBtn: !!p.querySelector('[data-go="cho"]'),
    rows: p.querySelectorAll(".sch details .exrow").length, past: p.querySelectorAll(".sch details .exrow.past").length,
    hdrs: [...p.querySelectorAll(".sch-rh")].map((e) => e.textContent), prep: [...p.querySelectorAll("[data-prep]")].map((b) => b.textContent.trim()),
    miss: p.querySelector(".sch p.small")?.textContent || "",
  };
});
ok("일정 카드가 맨 위", sc.first.includes("sch") && sc.head.includes("다음 스터디 시험"), JSON.stringify({ nxt: sc.nxt, dd: sc.dd }));
ok("옛 시험 일정 카드·자음퀴즈 버튼 제거", !sc.oldCard && !sc.choBtn);
ok("전체 일정 26행 + 회독 5개 묶음", sc.rows === 26 && sc.hdrs.length === 5, sc.hdrs.join(" / "));
ok("지난 일정 흐리게", sc.past >= 2, String(sc.past));
ok("준비 버튼(회독·뻥뚫)", sc.prep.length >= 2, sc.prep.join(" | "));
await page.screenshot({ path: "ux3-today.png" });
await page.evaluate(() => { document.querySelector(".sch details").open = true; });
await page.screenshot({ path: "ux3-today-open.png" });

/* 준비 버튼 → 이동 */
await click('[data-prep="bt"]');
ok("뻥뚫 준비 버튼 → 뻥뚫 탭 + 범위 지정", await page.evaluate(() => document.getElementById("p-bt").classList.contains("on") && BT.law === "운영규정" && BT.topic === "g3"), await page.evaluate(() => `${BT.law}/${BT.topic}`));
ok("범위 select·차수 박스가 해당 범위 선택", await page.evaluate(() => document.getElementById("bt-sel").value === "g3" && document.querySelector('[data-btu="3"]').getAttribute("aria-pressed") === "true"));
await page.evaluate(() => showTab("today")); await sleep(300);
await click('[data-prep="read"]'); await sleep(500);
ok("회독 준비 버튼 → 회독 탭 + 범위", await page.evaluate(() => document.getElementById("p-read").classList.contains("on") && R.law === "운영규정" && R.topic === "g3" && document.querySelectorAll("#r-body .art").length > 0), await page.evaluate(() => `${R.law}/${R.topic}/${document.querySelectorAll("#r-body .art").length}조`));

/* 파서: 과목 → 규정 연결 */
const sp = await page.evaluate(() => SCHED.filter((s) => s.n).map((s) => ({ n: s.n, o: schedPrep(s).out.map((x) => x.l).join("+"), m: schedPrep(s).miss.join("+") })));
ok("1~4차 모두 앱 규정에 연결", sp[0].o === "조직법+정관" && sp[1].o === "운영규정 1~5장" && sp[2].o === "운영규정 6~7장" && sp[3].o === "인사관리시행규칙" && !sp[3].m, JSON.stringify([sp[0], sp[3], sp[9]]));
ok("10차: 운영규정+인사관리시행규칙 연결", sp[9].o.includes("운영규정") && sp[9].o.includes("인사관리시행규칙") && !sp[9].m, JSON.stringify(sp[9]));

/* 초성 옵션 */
await page.evaluate(() => showTab("bt")); await sleep(200);
await click('[data-btu="1"]'); await click('[data-md="type"]'); await click('[data-ch="1"]'); await click('[data-ord="num"]'); await click('[data-max="5"]'); await click('[data-cnt="5"]');
ok("초성 칩 + 8줄", await page.evaluate(() => document.querySelectorAll("#p-bt .cs-row").length === 8 && document.querySelector('[data-ch="1"]').getAttribute("aria-pressed") === "true" && S.btp.ch === 1));
await click("#bt-start");
ok("초성 처음부터 표시(placeholder)", await page.evaluate(() => { const i = [...document.querySelectorAll("#bt-art .bt-in")]; return i.length > 0 && i.every((x) => x.placeholder.length > 0); }));
await page.screenshot({ path: "ux3-bt-ch.png" });
await click("#bt-end"); await click("#bt-home");
await click('[data-ch="0"]');

/* 회귀 */
for (const t of ["today", "read", "bt", "quiz", "exam", "rev", "find", "table", "lab", "ask"]) { await page.evaluate((id) => showTab(id), t); await sleep(150); }
const real = errors.filter((e) => !/Failed to load resource|favicon/.test(e));
ok("전 탭 렌더 · 콘솔 오류 없음", real.length === 0, real.join(" | "));
console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
