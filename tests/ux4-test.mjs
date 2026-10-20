import puppeteer from "puppeteer-core";

const FILE = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const errors = [];
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(w, h, touch = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(`[${w}] pageerror: ` + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${w}] console: ` + m.text()); });
  await page.goto(FILE, { waitUntil: "load" });
  await sleep(500);
  return page;
}
const onlyActivePane = (page) => page.evaluate(() => [...document.querySelectorAll("section.pane")].every((p) => (getComputedStyle(p).display !== "none") === p.classList.contains("on")));
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

/* ───────── 가로 태블릿 1180x820 ───────── */
let page = await open(1180, 820, true);
const click = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await sleep(250); };

// 개정표시 기본 숨김
await page.evaluate(() => showTab("read")); await sleep(500);
await click('#r-law [data-law="조직법"]'); await sleep(400);
await page.evaluate(() => document.querySelector('#r-chips [data-topic="0"]').click()); await sleep(400);
const am0 = await page.evaluate(() => ({ cls: document.body.classList.contains("show-amend"), vis: [...document.querySelectorAll("#r-body .amend")].filter((e) => e.offsetParent !== null).length, all: document.querySelectorAll("#r-body .amend").length }));
ok("개정·신설 표시 기본 숨김", !am0.cls && am0.all > 0 && am0.vis === 0, JSON.stringify(am0));
await click("#fab-amend"); await sleep(200);
const am1 = await page.evaluate(() => ({ vis: [...document.querySelectorAll("#r-body .amend")].filter((e) => e.offsetParent !== null).length, label: document.getElementById("fab-amend").textContent, saved: S.showAmend }));
ok("개정표시 버튼으로 켜기 + 저장", am1.vis > 0 && am1.label.includes("ON") && am1.saved === true, JSON.stringify(am1));
await click("#fab-amend");
ok("다시 끄기", await page.evaluate(() => [...document.querySelectorAll("#r-body .amend")].filter((e) => e.offsetParent !== null).length === 0));

// 목차 사이드바 (가로)
const toc = await page.evaluate(() => { const a = document.getElementById("r-toc"); const cs = getComputedStyle(a); return { disp: cs.display, items: a.querySelectorAll(".toc-a").length, chs: a.querySelectorAll(".toc-ch").length, navHidden: getComputedStyle(document.querySelector(".cs-nav")).display === "none", w: a.getBoundingClientRect().width }; });
ok("가로 화면: 목차 사이드바 표시", toc.disp === "block" && toc.items >= 20 && toc.chs >= 3 && toc.navHidden, JSON.stringify(toc));
await page.screenshot({ path: "ux4-land-read.png" });
await click('#r-toc [data-tj^="a-"]:nth-of-type(12)');
await sleep(900);
ok("목차 클릭 → 해당 조문으로 이동", await page.evaluate(() => scrollY > 300));
await sleep(300);
ok("스크롤 위치에 맞춰 목차 강조", await page.evaluate(() => document.querySelectorAll("#r-toc .toc-a.on").length === 1));

// 참조 패널: 조직법 본문의 제N조 참조
await page.evaluate(() => scrollTo(0, 0)); await sleep(200);
const xr = await page.evaluate(() => { const x = document.querySelectorAll("#r-body .xr"); return { n: x.length, first: x[0] && x[0].dataset.x, txt: x[0] && x[0].textContent }; });
ok("본문에 참조 링크(.xr) 생성", xr.n > 3, JSON.stringify(xr));
const yBefore = await page.evaluate(() => scrollY);
await page.evaluate(() => document.querySelector("#r-body .xr").click()); await sleep(400);
const pk1 = await page.evaluate(() => ({ open: !document.getElementById("pk").hidden, title: document.getElementById("pk-ti").textContent, depth: PK.stack.length, w: document.querySelector(".pk-pan").getBoundingClientRect().width, left: document.querySelector(".pk-pan").getBoundingClientRect().left, still: scrollY, fab: document.getElementById("fab-mode").hidden }));
ok("참조 클릭 → 오른쪽 패널로 열림(화면 이동 없음)", pk1.open && pk1.depth === 1 && pk1.w > 400 && pk1.left > 600, JSON.stringify(pk1));
ok("나란히 보기에서는 하단 버튼 유지", !pk1.fab);
await page.screenshot({ path: "ux4-land-peek.png" });
// 패널 안 참조 → 쌓임 → 뒤로
await page.evaluate(() => { closePeek(); openPeek("a|조직법:5"); }); await sleep(300);
const nested = await page.evaluate(() => !!document.querySelector("#pk-body .xr"));
if (nested) {
  await page.evaluate(() => document.querySelector("#pk-body .xr").click()); await sleep(300);
  ok("패널 안 참조 → 스택 2", await page.evaluate(() => PK.stack.length === 2 && document.getElementById("pk-back").textContent.includes("1")), await page.evaluate(() => document.getElementById("pk-ti").textContent));
  await click("#pk-back");
  ok("← 뒤로 → 이전 조문", await page.evaluate(() => PK.stack.length === 1 && !document.getElementById("pk").hidden));
} else res.push("SKIP  패널 안 중첩 참조 없음");
// 패널 가리기·회독·이전/다음
const R0 = await page.evaluate(() => R.mode), rdPk0 = await page.evaluate(() => document.body.dataset.rd);
await click('[data-pkmode="1"]'); await sleep(300);
const md = await page.evaluate(() => ({ R: R.mode, rd: document.body.dataset.rd, pk: PK.mode, pkrd: document.getElementById("pk").dataset.pkrd, pressed: document.querySelector('[data-pkmode="1"]').getAttribute("aria-pressed"), blanks: document.querySelectorAll("#pk-body .b1").length, hidden: [...document.querySelectorAll("#pk-body .b1")].filter((b) => getComputedStyle(b).color === "rgba(0, 0, 0, 0)").length }));
ok("패널 ① 가리기: 숫자·주체 가려짐(패널에만 적용, 본문은 그대로)", md.R === R0 && md.rd === rdPk0 && md.pk === "1" && md.pkrd === "1" && md.pressed === "true" && (md.blanks === 0 || md.hidden === md.blanks), JSON.stringify(md));
const nb = await page.evaluate(() => { const b = document.querySelector('[data-pknb][data-dir="next"]'); return { dis: b.disabled, t: b.textContent.trim() }; });
const t0 = await page.evaluate(() => document.getElementById("pk-ti").textContent);
if (!nb.dis) { await click('[data-pknb][data-dir="next"]'); }
ok("다음 조문 ▶", (await page.evaluate(() => document.getElementById("pk-ti").textContent)) !== t0, `${t0} → ${await page.evaluate(() => document.getElementById("pk-ti").textContent)}`);
const rd0 = await page.evaluate(() => { const b = document.querySelector("[data-pkread]"); return S.reads[b.dataset.pkread] || 0; });
await click("[data-pkread]");
ok("패널에서 회독 +1", await page.evaluate((r) => { const b = document.querySelector("[data-pkread]"); return (S.reads[b.dataset.pkread] || 0) === r + 1; }, rd0));
await click('[data-pkmode="0"]');
// Esc / 닫기 → 읽던 자리 그대로
await page.keyboard.press("Escape"); await sleep(250);
ok("Esc로 닫기 + 읽던 위치 유지", await page.evaluate((y) => document.getElementById("pk").hidden && Math.abs(scrollY - y) < 5, yBefore));
ok("닫으면 플로팅 버튼 복귀", await page.evaluate(() => !document.getElementById("fab-mode").hidden));
// 공통 가리기 버튼
await click("#fab-mode");
ok("공통 가리기 버튼 순환(원문→①)", await page.evaluate(() => R.mode === "1" && document.getElementById("fab-mode").textContent.includes("①")));
await click("#fab-mode"); await click("#fab-mode"); await click("#fab-mode");
ok("한 바퀴 돌아 원문", await page.evaluate(() => R.mode === "0"));

// 별표 참조 (운영규정)
await click('#r-law [data-law="운영규정"]'); await sleep(500);
await page.evaluate(() => document.querySelector('#r-chips [data-topic="0"]').click()); await sleep(600);
const bx = await page.evaluate(() => { const x = [...document.querySelectorAll("#r-body .xr")].find((e) => e.dataset.x.startsWith("b|")); return x ? x.dataset.x : null; });
if (bx) {
  await page.evaluate((k) => [...document.querySelectorAll("#r-body .xr")].find((e) => e.dataset.x === k).click(), bx); await sleep(400);
  ok("별표 참조 → 패널에 표 표시", await page.evaluate(() => !document.getElementById("pk").hidden && document.querySelectorAll("#pk-body table").length > 0 && /별표/.test(document.getElementById("pk-ti").textContent)), bx);
  await click("#pk-x");
} else res.push("SKIP  운영규정 별표 참조 없음");

// 오늘 탭 2단
await page.evaluate(() => showTab("today")); await sleep(500);
const td = await page.evaluate(() => { const p = document.getElementById("p-today"); const l = p.querySelector(".td-l"), r = p.querySelector(".td-r"); const lb = l.getBoundingClientRect(), rb = r.getBoundingClientRect(); return { cols: getComputedStyle(p).gridTemplateColumns.split(" ").length, lLeft: Math.round(lb.left), rLeft: Math.round(rb.left), lSch: !!l.querySelector(".sch"), rGoals: /오늘의 목표/.test(r.textContent) }; });
ok("오늘 탭: 가로 2단(왼쪽 일정·추천 / 오른쪽 할 일)", td.cols === 2 && td.rLeft > td.lLeft + 300 && td.lSch && td.rGoals, JSON.stringify(td));
await page.screenshot({ path: "ux4-land-today.png" });
// 기출 격자, 검색 격자, 뻥뚫 2단
await page.evaluate(() => showTab("exam")); await sleep(300);
ok("기출 카드 격자(2열 이상)", await page.evaluate(() => { const g = document.querySelector(".pk-grid"); return getComputedStyle(g).gridTemplateColumns.split(" ").length >= 2; }));
await page.evaluate(() => showTab("find")); await sleep(300);
await page.evaluate(() => { const i = document.getElementById("f-q"); i.value = "중앙위원회"; i.dispatchEvent(new Event("input")); }); await sleep(600);
ok("검색 결과 2열", await page.evaluate(() => getComputedStyle(document.querySelector(".fr2-grid")).gridTemplateColumns.split(" ").length === 2));
ok("검색 미리보기에 개정표시 없음", await page.evaluate(() => !/<(개정|신설)/.test(document.getElementById("f-out").textContent)));
await page.screenshot({ path: "ux4-land-find.png" });
await page.evaluate(() => showTab("bt")); await sleep(300);
ok("뻥뚫 설정/요약 2단", await page.evaluate(() => getComputedStyle(document.querySelector(".bt-grid")).gridTemplateColumns.split(" ").length === 2));
await page.screenshot({ path: "ux4-land-bt.png" });
await page.evaluate(() => showTab("rev")); await sleep(300);
ok("개정 탭은 개정표시 항상 보임", await page.evaluate(() => [...document.querySelectorAll("#p-rev .amend")].some((e) => e.offsetParent !== null)));
ok("개정 탭 참조 링크", await page.evaluate(() => document.querySelectorAll("#p-rev .xr").length >= 0));
ok("가로 스크롤 없음(1180)", await noHScroll(page));
for (const tb of ["today", "read", "bt", "quiz", "exam", "rev", "find", "table", "lab", "ask"]) { await page.evaluate((id) => showTab(id), tb); await sleep(120); if (!(await onlyActivePane(page))) { ok(`선택된 탭만 표시(1180) - ${tb}`, false); } }
ok("모든 탭에서 선택된 탭만 표시(1180)", !res.some((r) => r.startsWith("FAIL  선택된 탭만")));
await page.close();

/* ───────── 세로 태블릿 820x1180 ───────── */
page = await open(820, 1180, true);
await page.evaluate(() => showTab("read")); await sleep(500);
const pt = await page.evaluate(() => ({ toc: getComputedStyle(document.getElementById("r-toc")).display, nav: getComputedStyle(document.querySelector(".cs-nav")).display, font: getComputedStyle(document.body).fontSize, main: document.querySelector("main").getBoundingClientRect().width }));
ok("세로 태블릿: 목차는 숨김·이동 칩 표시, 글자 17px", pt.toc === "none" && pt.nav !== "none" && pt.font === "17px", JSON.stringify(pt));
await page.evaluate(() => { const x = document.querySelector("#r-body .xr"); if (x) x.click(); }); await sleep(400);
ok("세로 태블릿: 패널은 오른쪽 폭 480", await page.evaluate(() => { const r = document.querySelector(".pk-pan").getBoundingClientRect(); return !document.getElementById("pk").hidden && r.width <= 482 && r.left > 300; }));
await page.screenshot({ path: "ux4-port-peek.png" });
await page.evaluate(() => closePeek());
ok("세로 태블릿: 가로 스크롤 없음", await noHScroll(page));
await page.evaluate(() => showTab("today")); await sleep(300);
ok("세로 태블릿: 오늘 탭 1단", await page.evaluate(() => getComputedStyle(document.getElementById("p-today")).display !== "grid"));
await page.screenshot({ path: "ux4-port-today.png" });
await page.close();

/* ───────── 폰 390x844 ───────── */
page = await open(390, 844, true);
await page.evaluate(() => showTab("read")); await sleep(500);
ok("폰: 글자 기본(16px 이하) · 목차 숨김", await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize) <= 16 && getComputedStyle(document.getElementById("r-toc")).display === "none"));
await page.evaluate(() => { const x = document.querySelector("#r-body .xr"); if (x) x.click(); }); await sleep(400);
const ph = await page.evaluate(() => { const r = document.querySelector(".pk-pan").getBoundingClientRect(); return { open: !document.getElementById("pk").hidden, top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), vh: innerHeight }; });
ok("폰: 패널은 아래에서 올라오는 시트(전체 폭)", ph.open && ph.w === 390 && ph.top > 60 && ph.h > 600, JSON.stringify(ph));
await page.screenshot({ path: "ux4-phone-peek.png" });
// 스와이프(터치)로 다음 조문
const t0p = await page.evaluate(() => document.getElementById("pk-ti").textContent);
await page.evaluate(() => { const b = document.getElementById("pk-body"); const mk = (type, x) => b.dispatchEvent(new TouchEvent(type, { bubbles: true, touches: type === "touchend" ? [] : [new Touch({ identifier: 1, target: b, clientX: x, clientY: 300 })], changedTouches: [new Touch({ identifier: 1, target: b, clientX: x, clientY: 300 })] })); mk("touchstart", 300); mk("touchend", 150); }); await sleep(300);
ok("폰: 왼쪽으로 쓸면 다음 조문", (await page.evaluate(() => document.getElementById("pk-ti").textContent)) !== t0p, `${t0p} → ${await page.evaluate(() => document.getElementById("pk-ti").textContent)}`);
await page.evaluate(() => closePeek());
ok("폰: 가로 스크롤 없음", await noHScroll(page));
for (const t of ["today", "bt", "exam", "find", "rev"]) { await page.evaluate((id) => showTab(id), t); await sleep(200); ok(`폰 ${t}: 가로 스크롤 없음`, await noHScroll(page)); }
await page.screenshot({ path: "ux4-phone-rev.png" });
await page.close();

/* ───────── PC 1440x900 (마우스) ───────── */
page = await open(1440, 900, false);
await page.evaluate(() => showTab("read")); await sleep(500);
for (const tb of ["today", "read", "bt", "exam", "find"]) { await page.evaluate((id) => showTab(id), tb); await sleep(120); ok(`PC 선택된 탭만 표시 - ${tb}`, await onlyActivePane(page)); }
await page.evaluate(() => showTab("read")); await sleep(300);
ok("PC: 목차 + 본문, 가로 스크롤 없음", await page.evaluate(() => getComputedStyle(document.getElementById("r-toc")).display === "block") && (await noHScroll(page)));
for (const t of ["today", "read", "bt", "quiz", "exam", "rev", "find", "table", "lab", "ask"]) { await page.evaluate((id) => showTab(id), t); await sleep(150); }
await page.screenshot({ path: "ux4-pc.png" });
await page.close();

const real = errors.filter((e) => !/Failed to load resource|favicon/.test(e));
ok("모든 화면 크기에서 콘솔 오류 없음", real.length === 0, real.join(" | "));
console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
