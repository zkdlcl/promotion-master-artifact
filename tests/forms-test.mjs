import puppeteer from "puppeteer-core";

/* 인사관리 시행규칙: 별표 '의N'·인사서식 링크, 범위 양끝 링크, 서식 표(칸 병합) 표시 */
const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const errors = [];
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await browser.newPage();
await page.setViewport({ width: 1180, height: 820 });
page.on("response", (r) => { if (r.status() === 404 && !/favicon/.test(r.url())) errors.push("404 " + r.url()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/404/.test(m.text())) errors.push("console: " + m.text()); });
await page.goto(URL, { waitUntil: "load" });
await sleep(500);
await page.evaluate(() => { R.law = "인사관리시행규칙"; R.topic = "0"; showTab("read"); });
await page.waitForFunction(() => lawReady("인사관리시행규칙") && document.querySelectorAll("#r-body .art").length > 20, { timeout: 8000 });
await sleep(600);

const refs = (no) => page.evaluate((no) => [...document.querySelectorAll(`#r-body .art[id="a-인사관리시행규칙:${no}"] .xr`)].map((e) => e.textContent + "→" + e.dataset.x), no);
const r24 = await refs("24의4");
ok("제24조의4 '별표 제5호 내지 제5호의6' 양끝 링크", r24.some((s) => s.endsWith("b|인사관리시행규칙:5")) && r24.some((s) => s.startsWith("제5호의6→") && s.endsWith(":5의6")), JSON.stringify(r24));
ok("'별표 제5호의 6' 띄어쓰기 링크", r24.some((s) => /^별표 제5호의 6→.*:5의6$/.test(s)), JSON.stringify(r24));
const r3 = await refs("3의2");
ok("제3조의2 '별표 제25호' 글자 유지, 인사서식 제25호로 연결", r3.some((s) => s === "별표 제25호→b|인사관리시행규칙:서25"), JSON.stringify(r3));
const r23 = await refs("23");
ok("제23조 '인사서식 제16호' 링크", r23.some((s) => s === "인사서식 제16호→b|인사관리시행규칙:서16"), JSON.stringify(r23));

const toc = await page.evaluate(() => ({ forms: [...document.querySelectorAll("#r-body .chap")].filter((c) => c.textContent.startsWith("[인사서식")).length, ids: [...document.querySelectorAll('#r-body .chap[id^="byeol-"]')].length, tocForm: document.querySelectorAll('#r-toc .toc-a[data-tj^="byeol-인사관리시행규칙-서"]').length }));
ok("인사서식 37개 제목·id·목차", toc.forms === 37 && toc.ids >= 48 && toc.tocForm === 37, JSON.stringify(toc));

for (const [no, pat] of [["서25", /인사서식 제25호/], ["서7의2", /인사서식 제7호의2/], ["5의6", /별표 제5호의6/], ["서10", /인사서식 제10호/]]) {
  await page.evaluate((no) => openPeek("b|인사관리시행규칙:" + no, false), no);
  await sleep(500);
  const s = await page.evaluate(() => ({ ti: document.getElementById("pk-ti").textContent, tables: document.querySelectorAll("#pk-body table").length, span: document.querySelectorAll("#pk-body td[colspan], #pk-body td[rowspan]").length, empty: !!document.querySelector("#pk-body .mute") && /찾지 못/.test(document.getElementById("pk-body").textContent) }));
  ok(`${no} 패널 열림`, pat.test(s.ti) && s.tables > 0 && !s.empty, JSON.stringify(s));
  if (no === "서10") ok("서식 표에 칸 병합 유지", s.span > 10, String(s.span));
  await page.screenshot({ path: `tests/forms-${no}.png` });
  await page.evaluate(() => closePeek());
}

ok("브라우저 오류 없음", errors.length === 0, errors.slice(0, 3).join(" | "));
console.log(res.join("\n"));
await browser.close();
