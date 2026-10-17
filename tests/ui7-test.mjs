import puppeteer from "puppeteer-core";

/* ui7 디자인 층: 칩·테마·아이콘·가로 스크롤 */
const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TABS = ["today", "read", "bt", "quiz", "exam", "rev", "find", "table", "lab", "ask"];

const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1180, height: 820 });
await page.goto(URL, { waitUntil: "load" }); await sleep(600);

// 탭: 선 아이콘, 이모지 없음
const tb = await page.$$eval(".tab", (els) => els.map((e) => ({ t: e.textContent.trim(), svg: !!e.querySelector(".ic svg") })));
ok("탭마다 선 아이콘, 글자에 이모지 없음", tb.every((x) => x.svg && !/\p{Extended_Pictographic}/u.test(x.t)), JSON.stringify(tb.map((x) => x.t)));
ok("머리줄 브랜드 표시", await page.$eval(".hd h1", (h) => !!h.querySelector(".brand") && /승진고시 마스터/.test(h.textContent)));

// 복습 카드: 드롭다운이 칩으로, 칩을 누르면 원래 select 값이 바뀜
await page.evaluate(() => showTab("quiz")); await sleep(400);
const q = await page.evaluate(() => {
  const s = document.getElementById("q-limit"), box = s && s._csel;
  return { hidden: s && getComputedStyle(s).display === "none", chips: box ? box.children.length : 0, opts: s ? s.options.length : 0, val: s && s.value };
});
ok("장수 드롭다운 → 칩", q.hidden && q.chips === q.opts && q.chips > 1, JSON.stringify(q));
const after = await page.evaluate(() => {
  const s = document.getElementById("q-limit"); const b = [...s._csel.children].find((x) => x.getAttribute("aria-pressed") !== "true");
  b.click(); return { val: s.value, pressed: b.getAttribute("aria-pressed"), label: b.textContent };
});
ok("칩을 누르면 원래 값이 바뀌고 선택 표시", after.pressed === "true" && after.val !== q.val, JSON.stringify(after));
const grp = await page.evaluate(() => { const s = document.getElementById("q-group"); return { chips: s._csel ? s._csel.children.length : 0, pressed: s._csel && [...s._csel.children].findIndex((b) => b.getAttribute("aria-pressed") === "true") === s.selectedIndex }; });
ok("범위(묶음)도 칩, 선택 위치 일치", grp.chips >= 10 && grp.pressed, JSON.stringify(grp));
const nSel = await page.evaluate(() => [...document.querySelectorAll("#p-quiz select")].filter((s) => getComputedStyle(s).display !== "none").length);
ok("복습 카드 화면에 보이는 드롭다운 없음", nSel === 0, String(nSel));

// 테마: 버튼 아이콘과 전환
const t0 = await page.evaluate(() => ({ th: document.documentElement.dataset.theme || "", ic: document.getElementById("theme").dataset.ic }));
await page.click("#theme"); await sleep(700);
const t1 = await page.evaluate(() => ({ th: document.documentElement.dataset.theme, ic: document.getElementById("theme").dataset.ic, bg: getComputedStyle(document.body).backgroundColor, s: S.theme }));
ok("테마 전환: data-theme·기록·아이콘이 함께 바뀜", t1.th && t1.th === t1.s && t1.ic !== t0.ic && t1.ic === (t1.th === "dark" ? "sun" : "moon"), JSON.stringify({ t0, t1 }));
await page.click("#theme"); await sleep(700);

// 폰: 모든 탭 가로 스크롤 없음, 본문 밖 이모지 없음
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const over = [], emo = [];
for (const t of TABS) {
  await page.evaluate((t) => showTab(t), t); await sleep(t === "read" || t === "bt" ? 1200 : 400);
  const r = await page.evaluate(() => {
    const pane = document.querySelector("section.pane.on");
    const skip = ".art,.q,.ans,.xq,.xex,.fr2-q,.fr2-b,.bt-art,.rv-col,.rv-hl,.pk-body,textarea,select,option,pre";
    const w = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT); const left = [];
    while (w.nextNode()) { const n = w.currentNode; if (!n.parentElement.closest(skip) && /[🎯📖🕳🧠🗂🆕🔍📊🔬🧪💬📝📕📚🗓📅✅❌]/u.test(n.nodeValue)) left.push(n.nodeValue.trim().slice(0, 20)); }
    return { wide: document.documentElement.scrollWidth > innerWidth + 1, left };
  });
  if (r.wide) over.push(t);
  if (r.left.length) emo.push(t + ":" + r.left.slice(0, 2).join("/"));
}
ok("폰: 모든 탭 가로 스크롤 없음", over.length === 0, over.join(","));
ok("폰: 화면 글자에 이모지 안 남음(본문·문제 제외)", emo.length === 0, emo.join(" | "));
ok("페이지 오류 없음", errors.length === 0, errors.join(" | "));

console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
