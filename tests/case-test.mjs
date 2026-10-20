import puppeteer from "puppeteer-core";

/* 사례형·원문 빈칸 (kb/study/cases.py, case-bl.js): 묶음, 정답 개수, 빈칸 채점(동의어 오답)·원문 인용, 유형 필터, 숫자키 보호 */
const URL = process.env.TEST_URL || "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1180, height: 820 });
await page.goto(URL, { waitUntil: "load" }); await sleep(1500);

// 데이터: 사례 3 + 빈칸 15, 정답 개수가 다양, 빈칸은 원문 문장 그대로
const d = await page.evaluate(() => {
  const it = D.exam.filter((e) => e.grp === "case");
  const cs = it.filter((e) => e.kind === "mc");
  return { n: it.length, mc: cs.length, bl: it.filter((e) => e.kind === "bl").length, ans: cs.map((e) => e.a), five: cs.every((e) => /⑤/.test(e.q) && /가\./.test(e.q) && /마\./.test(e.q)),
    marks: it.filter((e) => e.kind === "bl").every((e) => /\[\[.+?\]\]/.test(e.q) && e.ref && e.clause) };
});
ok("사례 N + 빈칸 5N", d.mc >= 3 && d.bl === d.mc * 5 && d.n === d.mc + d.bl, JSON.stringify(d));
ok("정답 개수 다양(처음 3개: 3·2·4개)", d.ans.slice(0, 3).join("") === "③②④" && new Set(d.ans).size >= 3, d.ans.join(""));
ok("사례는 가~마 + 5지선다, 빈칸은 표시·출처 보유", d.five && d.marks);

// 묶음 카드와 유형 칩
await page.evaluate(() => { [...document.querySelectorAll(".tab")].find((t) => /기출/.test(t.textContent)).click(); });
await sleep(500);
const home = await page.evaluate(() => ({ card: [...document.querySelectorAll(".pk")].some((c) => /사례형·빈칸/.test(c.textContent)), chip: [...document.querySelectorAll("[data-xkind]")].map((b) => b.textContent.trim()) }));
ok("묶음 카드 + '빈칸' 유형 칩", home.card && home.chip.includes("빈칸"), JSON.stringify(home));
const cnt = await page.evaluate(() => { const o = X.kind; X.grp = "case"; X.kind = "bl"; const bl = xQueue().length; X.kind = "mc"; const mc = xQueue().length; X.kind = o || ""; return { bl, mc }; });
ok("유형 필터: 빈칸·객관식 개수", cnt.bl === d.bl && cnt.mc === d.mc, JSON.stringify(cnt));

// 빈칸 문제 풀기: 첫 빈칸 문제로 시작
await page.evaluate(() => { X.grp = "case"; X.kind = "bl"; X.mode = "order"; X.queue = xQueue(); X.i = 0; X.picked = null; X.shown = false; X.res = []; X.sess = true; X.done = false; drawX(); });
await sleep(300);
const q1 = await page.evaluate(() => ({ inputs: document.querySelectorAll(".bl-in").length, ph: [...document.querySelectorAll(".bl-in")].map((i) => i.placeholder), id: X.queue[X.i].id }));
ok("빈칸 입력칸 + 한 글자당 □", q1.inputs === 4 && q1.ph[0] === "□□□□□" && q1.ph[2] === "□□□□ □□□□", JSON.stringify(q1));
// 숫자키로 채점되지 않음
await page.keyboard.press("Escape"); await page.evaluate(() => document.activeElement.blur());
await page.keyboard.press("1"); await sleep(200);
ok("숫자키 1 로 채점되지 않음", await page.evaluate(() => X.picked === null));
// 동의어(띄어쓰기만 무시): 1개월간→한달, 나머지 정답 → 오답, 원문 인용
await page.evaluate(() => { const v = ["80퍼센트", "한달", "1일부터 말일까지", "개근시"]; document.querySelectorAll(".bl-in").forEach((i, k) => { i.value = v[k]; i.dispatchEvent(new Event("input", { bubbles: true })); }); });
await page.click("#bl-check"); await sleep(300);
const w = await page.evaluate(() => ({ picked: X.picked, rec: S.ex[X.queue[X.i].id], cite: (document.querySelector(".bl-cite") || {}).textContent || "", diff: [...document.querySelectorAll(".bl-diff li")].map((l) => l.textContent), fix: [...document.querySelectorAll(".bl-fix")].map((l) => l.textContent) }));
ok("동의어(한달)는 오답", w.picked === "bl" && w.rec && w.rec.last === false && w.diff.length === 1 && /한달/.test(w.diff[0]) && /1개월간/.test(w.diff[0]), JSON.stringify(w.diff));
ok("틀리면 항·호·목 원문 인용", /제45조 제2호 가목/.test(w.cite) && /1개월간\(1일부터 말일까지\) 개근시 1일의 연차유급휴가를 부여한다/.test(w.cite), w.cite.slice(0, 90));
ok("정답 낱말 표시", w.fix.join("") === "1개월간", w.fix.join(","));
await page.click("#x-next"); await sleep(300);
// 띄어쓰기만 다르면 정답
await page.evaluate(() => { const v = ["해당 직렬", "동일한직종"]; document.querySelectorAll(".bl-in").forEach((i, k) => { i.value = v[k]; i.dispatchEvent(new Event("input", { bubbles: true })); }); });
await page.click("#bl-check"); await sleep(300);
ok("띄어쓰기만 다른 답은 정답", await page.evaluate(() => S.ex[X.queue[X.i].id].last === true && !document.querySelector(".bl-diff")));
const shot = await page.evaluate(() => document.querySelector(".bl-cite") ? 1 : 0);
ok("정답이어도 출처 표시", shot === 1);
await page.screenshot({ path: "tests/case-bl.png" }).catch(() => {});

// 사례형 풀이: 정답 ③ 선택 → 채점
await page.evaluate(() => { X.grp = "case"; X.kind = "mc"; X.queue = xQueue(); X.i = 0; X.picked = null; X.shown = false; X.res = []; X.sess = true; X.done = false; drawX(); });
await sleep(300);
await page.evaluate(() => document.querySelector('[data-xc="③"]').click()); await sleep(300);
const m1 = await page.evaluate(() => ({ r: S.ex["case-1"], ex: (document.querySelector(".xex") || {}).textContent || "" }));
ok("사례 1 정답 ③ → 정답 처리", m1.r && m1.r.last === true);
ok("해설에 판정·근거 인용·계산·함정", /정답 ③/.test(m1.ex) && /근거 운영규정 제45조/.test(m1.ex) && /계산:/.test(m1.ex) && /함정:/.test(m1.ex), m1.ex.slice(0, 80));

await browser.close();
console.log(res.join("\n"));
if (errors.length) console.log("브라우저 오류:", errors.join(" | ")); else console.log("브라우저 오류 없음");
