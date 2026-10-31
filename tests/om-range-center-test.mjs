import puppeteer from "puppeteer-core";
/* 읽기 탭 '범위 구조도' 버튼: 아이콘+글자가 버튼 안에서 가운데 */
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [w, h] of [[1180, 820], [390, 800]]) {
  const page = await browser.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:8765/index.html", { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "load" }); await sleep(600);
  await page.evaluate(() => showTab("read")); await sleep(500);
  const r = await page.evaluate(() => { const b = document.querySelector("[data-om-range]"); if (!b) return null; const x = b.getBoundingClientRect(), i = b.querySelector('svg').getBoundingClientRect(), s = b.querySelector('span').getBoundingClientRect(); return { dl: Math.round(i.left - x.left), dr: Math.round(x.right - s.right), w: Math.round(x.width) }; });
  ok(`가운데 정렬 (${w}px)`, r && Math.abs(r.dl - r.dr) <= 2, JSON.stringify(r));
  await page.screenshot({ path: `om-range-center-${w}.png` }); await page.close();
}
ok("JS 오류 없음", errors.length === 0, errors.join(";"));
console.log(res.join("\n")); await browser.close();
