import puppeteer from "puppeteer-core";

const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const errors = [];
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(w, h, touch = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, hasTouch: touch, isMobile: touch && w < 800 });
  page.on("pageerror", (e) => errors.push(`[${w}] pageerror: ` + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${w}] console: ` + m.text()); });
  await page.goto(URL, { waitUntil: "load" });
  await sleep(500);
  return page;
}
const state = (page) => page.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), w: Math.round(b.width) }; };
  const pan = document.querySelector(".pk-pan");
  return {
    split: document.body.classList.contains("pk-split"), open: !!document.getElementById("pk") && !document.getElementById("pk").hidden,
    main: r(document.querySelector("main")), panel: pan && r(pan), toc: getComputedStyle(document.getElementById("r-toc")).display,
    nav: getComputedStyle(document.querySelector(".cs-nav")).display, scrim: document.getElementById("pk-scrim") ? getComputedStyle(document.getElementById("pk-scrim")).display : "none",
    sw: document.documentElement.scrollWidth, iw: innerWidth, fabMode: !document.getElementById("fab-mode").hidden,
    fabsRight: document.querySelector(".fabs") ? Math.round(document.querySelector(".fabs").getBoundingClientRect().right) : null, stack: PK.stack.length, ti: document.getElementById("pk-ti") && document.getElementById("pk-ti").textContent,
  };
});

/* ── 1180x820 가로 태블릿 ── */
let page = await open(1180, 820, true);
const click = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await sleep(250); };
await page.evaluate(() => { R.law = "인사관리시행규칙"; R.topic = "0"; showTab("read"); });
await page.waitForFunction(() => lawReady("인사관리시행규칙") && document.querySelectorAll("#r-body .art").length > 20, { timeout: 8000 });
await sleep(400);
const s0 = await state(page);
ok("열기 전: 목차 표시, 패널 없음", s0.toc === "block" && !s0.open && !s0.split, JSON.stringify({ toc: s0.toc, mainW: s0.main.w }));

// 화면 중간쯤 본문 참조를 눌러 위치 유지 확인
await page.evaluate(() => { const x = [...document.querySelectorAll("#r-body .xr")][6]; x.scrollIntoView({ block: "center" }); });
await sleep(300);
const before = await page.evaluate(() => { const x = [...document.querySelectorAll("#r-body .xr")][6]; const b = x.getBoundingClientRect(); return { top: Math.round(b.top), key: x.dataset.x }; });
await page.evaluate(() => [...document.querySelectorAll("#r-body .xr")][6].click());
await sleep(500);
const s1 = await state(page);
const after = await page.evaluate(() => { const x = PK.src; const b = x.getBoundingClientRect(); return { top: Math.round(b.top), right: Math.round(b.right), left: Math.round(b.left) }; });
ok("나란히 보기 켜짐(덮개 없음)", s1.split && s1.open && s1.scrim === "none", JSON.stringify({ scrim: s1.scrim }));
ok("본문 폭이 패널만큼 줄어듦", s1.main.w < s0.main.w - 380 && s1.main.r <= s1.panel.l + 2, `main ${s0.main.w}→${s1.main.w}, panel.left ${s1.panel.l}`);
ok("본문이 읽을 만한 폭(≥ 520px)", s1.main.w >= 520, String(s1.main.w));
ok("목차는 접히고 장 이동 칩이 나타남", s1.toc === "none" && s1.nav !== "none", `${s1.toc}/${s1.nav}`);
ok("누른 참조가 보이는 자리에 그대로 (본문 영역 안)", Math.abs(after.top - before.top) <= 3 && after.right <= s1.panel.l && after.left >= 0, `top ${before.top}→${after.top}`);
ok("가로 스크롤 없음", s1.sw <= s1.iw + 1, `${s1.sw}/${s1.iw}`);
ok("아래 버튼 유지 + 오른쪽 버튼은 패널 밖으로", s1.fabMode && (s1.fabsRight === null || s1.fabsRight <= s1.panel.l), `fabsRight ${s1.fabsRight} panel ${s1.panel.l}`);
await page.screenshot({ path: "split-1180.png" });

// 패널이 열린 채로 본문 스크롤·클릭
await page.evaluate(() => window.scrollBy(0, 900)); await sleep(300);
ok("본문 스크롤해도 패널 유지", await page.evaluate(() => scrollY > 500 && !document.getElementById("pk").hidden && document.querySelector(".pk-pan").getBoundingClientRect().top === 0));
// 본문의 다른 참조 → 패널 내용 교체(쌓이지 않음)
const t0 = s1.ti;
await page.evaluate(() => { const xs = [...document.querySelectorAll("#r-body .xr")]; const cur = PK.stack[0]; const o = xs.find((e) => e.dataset.x !== cur && e.getBoundingClientRect().top > 100 && e.getBoundingClientRect().top < 700) || xs.find((e) => e.dataset.x !== cur && e.getBoundingClientRect().top > 100); o.scrollIntoView({ block: "center" }); o.click(); });
await sleep(400);
const s2 = await state(page);
ok("본문에서 다른 참조 → 패널 내용 교체(스택 1)", s2.stack === 1 && s2.ti !== t0 && s2.split, `${t0} → ${s2.ti}`);
// 패널 안의 참조 → 쌓임, 뒤로
// 지금 연 조문에 참조가 없으면 참조가 있는 조문을 연다 (늘 같은 검사가 돌도록)
if (!(await page.evaluate(() => !!document.querySelector("#pk-body .xr")))) {
  await page.evaluate(() => { const a = D.articles.find((x) => x.type === "a" && x.law === "운영규정" && /제\d+조/.test(x.html.replace(/<[^>]+>/g, "").replace(/^[^]*?\)/, ""))); openPeek("a|" + artId(a)); }); await sleep(500);
}
const nested = await page.evaluate(() => !!document.querySelector("#pk-body .xr"));
ok("패널 안에 참조 링크가 있는 조문", nested);
if (nested) {
  await page.evaluate(() => document.querySelector("#pk-body .xr").click()); await sleep(400);
  const s3 = await state(page);
  ok("패널 안 참조 → 쌓임(스택 2)", s3.stack === 2, s3.ti);
  await click("#pk-back");
  ok("뒤로 → 스택 1", (await state(page)).stack === 1);
}
// 패널에서 '원문에서 보기'는 패널을 닫지 않고 본문만 이동
const y1 = await page.evaluate(() => scrollY);
await page.evaluate(() => document.querySelector("[data-pkgo]").click()); await sleep(1100);
const s4 = await state(page);
ok("원문에서 보기: 패널 유지 + 본문 이동", s4.open && s4.split && (await page.evaluate((y) => scrollY !== y, y1)), `scroll ${y1}→${await page.evaluate(() => scrollY)}`);
// 참조 패널의 가리기는 본문과 따로 (패널 안 버튼으로만 가림, 본문 가리기는 그대로)
const rdBefore = await page.evaluate(() => document.body.dataset.rd);
await page.evaluate(() => document.querySelector('[data-pkmode="1"]').click()); await sleep(400);
ok("가리기 ①: 패널에만 적용(본문은 그대로)", await page.evaluate((r) => PK.mode === "1" && document.getElementById("pk").dataset.pkrd === "1" && document.body.dataset.rd === r && document.querySelector('[data-pkmode="1"]').getAttribute("aria-pressed") === "true", rdBefore));
await page.evaluate(() => document.querySelector('[data-pkmode="0"]').click());
// 닫기 → 원래대로
await page.keyboard.press("Escape"); await sleep(400);
const s5 = await state(page);
ok("닫으면 목차·폭 원상복구", !s5.open && !s5.split && s5.toc === "block" && Math.abs(s5.main.w - s0.main.w) <= 2, `main ${s5.main.w} toc ${s5.toc}`);
// 탭 이동 시 패널 닫힘
await page.evaluate(() => [...document.querySelectorAll("#r-body .xr")][0].click()); await sleep(300);
await page.evaluate(() => showTab("find")); await sleep(300);
ok("다른 탭으로 가면 패널 닫힘", await page.evaluate(() => document.getElementById("pk").hidden && !document.body.classList.contains("pk-split")));
await page.close();

/* ── 1024x768 (태블릿 가로 최소폭) ── */
page = await open(1024, 768, true);
await page.evaluate(() => { R.law = "조직법"; R.topic = "0"; showTab("read"); }); await sleep(600);
await page.evaluate(() => document.querySelector("#r-body .xr").click()); await sleep(500);
const sm = await state(page);
ok("1024px: 나란히 보기, 본문 폭 ≥ 470px, 가로 스크롤 없음", sm.split && sm.main.w >= 470 && sm.sw <= sm.iw + 1, JSON.stringify({ main: sm.main.w, panel: sm.panel.w }));
await page.screenshot({ path: "split-1024.png" });
await page.close();

/* ── 820x1180 세로 태블릿: 덮는 방식 유지 ── */
page = await open(820, 1180, true);
await page.evaluate(() => { R.law = "조직법"; R.topic = "0"; showTab("read"); }); await sleep(600);
await page.evaluate(() => document.querySelector("#r-body .xr").click()); await sleep(500);
const sp = await state(page);
ok("세로 태블릿: 덮는 패널(나란히 아님), 덮개 표시, 하단 버튼 숨김", sp.open && !sp.split && sp.scrim !== "none" && !sp.fabMode, JSON.stringify({ split: sp.split, scrim: sp.scrim, fab: sp.fabMode }));
ok("세로 태블릿: 본문 폭 그대로", sp.main.w >= 700, String(sp.main.w));
await page.close();

/* ── 폰 ── */
page = await open(390, 844, true);
await page.evaluate(() => { R.law = "조직법"; R.topic = "0"; showTab("read"); }); await sleep(600);
await page.evaluate(() => document.querySelector("#r-body .xr").click()); await sleep(500);
const sf = await state(page);
ok("폰: 시트(덮는 방식)", sf.open && !sf.split && sf.sw <= sf.iw + 1);
await page.close();

/* ── 창 크기 변경(회전) 중 패널이 열려 있을 때 ── */
page = await open(1180, 820, true);
await page.evaluate(() => { R.law = "조직법"; R.topic = "0"; showTab("read"); }); await sleep(600);
await page.evaluate(() => document.querySelector("#r-body .xr").click()); await sleep(400);
await page.setViewport({ width: 820, height: 1180, hasTouch: true });
await sleep(500);
const rot = await state(page);
ok("가로→세로 회전: 나란히 보기 해제, 덮는 패널로 전환", rot.open && !rot.split && rot.sw <= rot.iw + 1, JSON.stringify({ split: rot.split }));
await page.setViewport({ width: 1180, height: 820, hasTouch: true });
await sleep(500);
const rot2 = await state(page);
ok("세로→가로 회전: 다시 나란히 보기", rot2.open && rot2.split);
await page.close();

const real = errors.filter((e) => !/Failed to load resource|favicon|404/.test(e));
ok("콘솔 오류 없음", real.length === 0, real.join(" | "));
console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
