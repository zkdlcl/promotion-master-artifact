import puppeteer from "puppeteer-core";

/* 뻥뚫 🔴: 빈칸 자리 '매번 바꾸기' / '고정', 한 조문 안에서는 다시 그려도 같은 자리, 틀린 칸만 다시는 같은 자리 */
const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1180, height: 820 });
await page.goto(URL, { waitUntil: "load" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "load" }); await sleep(600);
const ev = (f, ...a) => page.evaluate(f, ...a);

await ev(() => showTab("bt")); await sleep(400);
ok("빈칸 자리 칩 있음(기본 매번 바꾸기)", await ev(() => !!document.querySelector('[data-shuf="1"][aria-pressed="true"]')));
const sig = () => ev(() => [...document.querySelectorAll("#bt-art [data-ans]")].map((x) => x.dataset.ans).join("|"));
const run = async (shuf) => {
  await ev((s) => { BT.lv = 3; BT.max = 0; BT.md = "tap"; BT.cnt = 1; BT.ord = "num"; BT.shuf = s; BT.law = "운영규정"; BT.topic = "0"; drawBtHome(); document.getElementById("bt-start").click(); }, shuf); await sleep(300);
  const a = await sig(); await ev(() => drawBt()); const b = await sig();
  return [a, b];
};
const seen = new Set(); let same = true;
for (let i = 0; i < 4; i++){ const [a, b] = await run(1); same = same && a === b; seen.add(a); }
ok("한 조문 안에서는 다시 그려도 같은 자리", same);
ok("바꾸기: 세션마다 다른 빈칸 (4회 중 2종 이상)", seen.size >= 2, seen.size);
const fixed = new Set(); for (let i = 0; i < 3; i++){ const [a] = await run(0); fixed.add(a); }
ok("고정: 늘 같은 빈칸", fixed.size === 1, fixed.size);
await page.screenshot({ path: "bt-shuffle.png" });
ok("JS 오류 없음", errors.length === 0, errors.join(";"));
console.log(res.join("\n")); await browser.close();
