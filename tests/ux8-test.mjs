import puppeteer from "puppeteer-core";

/* ux8 (docs/개선요청-2026-10-18.md): 탭 상태 유지, 뻥뚫 Enter/Tab/틀린 칸만, 뻥뚫→회독, 다회독 진도, 오늘 목표, 헤더 검색, 카드 머리·조문 링크, 빈칸 경계 */
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

// ── 빈칸 경계
const bl = await ev(() => {
  const h = D.articles.filter((a) => a.law === "운영규정").map((a) => a.html).join("");
  return { glued: (h.match(/[가-힣]<span class="b b\d">/g) || []).length, jisa: h.includes('<span class="b b1">지사부회장</span>'), myun: h.includes('<span class="b b2">면허</span>가') };
});
ok("빈칸 경계: 낱말 중간 빈칸 없음(위원 과반수 1곳 예외)", bl.glued <= 1, bl.glued);
ok("빈칸 경계: [지사부회장], [면허]가", bl.jisa && bl.myun);

// ── 헤더 검색
ok("탭 목록에 검색 없음", await ev(() => getComputedStyle(document.querySelector('.tab[data-id="find"]')).display === "none"));
await page.click(".gs"); await page.keyboard.type("서면의결"); await sleep(500);
ok("헤더 검색 → 결과", await ev(() => document.getElementById("p-find").classList.contains("on") && document.querySelectorAll("#f-out .fr, #f-out .fr2").length > 0));
await page.screenshot({ path: "ux8-search.png" });

// ── 뻥뚫: 차수 박스 + select
await ev(() => showTab("bt")); await sleep(400);
ok("차수 박스 8개", (await ev(() => document.querySelectorAll(".bt-u").length)) === 8);
await ev(() => document.querySelector('[data-btu="2"]').click()); await sleep(300);
const sel = await ev(() => { const s = document.getElementById("bt-sel"); return s && { n: s.options.length, v: s.value, chip: !!s.dataset.csel && !s.classList.contains("csel-src") }; });
ok("2차 → 운영규정 1~5장 select (칩 변환 안 됨)", sel && sel.v === "g2" && sel.n === 7 && sel.chip, JSON.stringify(sel));
await page.select("#bt-sel", "12"); await sleep(300);
ok("select 로 세부 범위", await ev(() => BT.topic === "12" && BT.law === "운영규정"));
await page.screenshot({ path: "ux8-bt-home.png" });
await ev(() => { BT.lv = 1; BT.max = 0; BT.md = "type"; BT.cnt = 2; BT.ord = "num"; drawBtHome(); document.getElementById("bt-start").click(); }); await sleep(300);
ok("화면 키보드 숨김 기본 (inputmode=none)", await ev(() => [...document.querySelectorAll(".bt-in")].every((i) => i.inputMode === "none")));
// Tab → 첫 빈칸
await ev(() => document.activeElement && document.activeElement.blur());
await page.keyboard.press("Tab");
ok("Tab → 첫 빈칸", await ev(() => document.activeElement === document.querySelector(".bt-in")));
// 첫 칸만 맞히고 입력 중 탭 이동
await page.keyboard.type(await ev(() => document.querySelector(".bt-in").dataset.ans));
const nIn = await ev(() => document.querySelectorAll(".bt-in").length);
await ev(() => showTab("quiz")); await sleep(200); await ev(() => showTab("bt")); await sleep(200);
ok("탭 갔다 와도 입력 유지", await ev(() => document.querySelector(".bt-in").value === document.querySelector(".bt-in").dataset.ans && document.querySelectorAll(".bt-in").length));
const id0 = await ev(() => artId(BT.queue[0])), r0 = await ev((id) => S.reads[id] || 0, id0);
// 마지막 칸에서 Enter → 채점
await ev(() => { const ins = document.querySelectorAll(".bt-in"); ins[ins.length - 1].focus(); });
await page.keyboard.press("Enter"); await sleep(200);
const ck = await ev(() => ({ checked: BT.checked, sel: String(getSelection()), focus: document.activeElement && document.activeElement.id }));
ok("Enter 채점, 선택 영역 없음, 다음 버튼 포커스", ck.checked && ck.sel === "" && ck.focus === "bt-next", JSON.stringify(ck));
ok("뻥뚫 채점 → 회독 +1", (await ev((id) => S.reads[id] || 0, id0)) === r0 + 1);
await page.screenshot({ path: "ux8-bt-checked.png" });
await page.keyboard.press("Enter"); await sleep(200);
ok("Enter → 다음 조문", await ev(() => BT.i === 1));
// 두 번째 조문은 전부 틀림 → 결과 → 틀린 칸만 다시
await ev(() => btCheck()); await sleep(100);
await ev(() => document.getElementById("bt-next").click()); await sleep(200);
const miss0 = await ev(() => BT.res.filter((r) => r.ok < r.tot).reduce((s, r) => s + r.miss.length, 0));
await ev(() => document.getElementById("bt-retry").click()); await sleep(200);
let seen = 0;
for (let i = 0; i < 4 && (await ev(() => BT.sess && !BT.done && BT.i < BT.queue.length)); i++) {
  seen += await ev(() => document.querySelectorAll(".bt-in").length);
  await ev(() => { btCheck(); document.getElementById("bt-next").click(); }); await sleep(150);
}
ok("틀린 조문만 다시 = 틀린 칸만", seen === miss0 && miss0 > 0, `${seen} / ${miss0} (첫 조문 빈칸 ${nIn}개 중 1개 맞힘)`);
ok("같은 날 다시 풀어도 회독 +1 한 번", (await ev((id) => S.reads[id] || 0, id0)) === r0 + 1);

// ── 회독: 2회독 진도
await ev(() => { R.law = "정관"; R.topic = "0"; candArts().forEach((a) => { S.reads[artId(a)] = 1; }); S.reads[artId(candArts()[3])] = 2; showTab("read"); }); await sleep(400);
const rd = await ev(() => ({ prog: document.getElementById("r-prog").textContent, fab: document.getElementById("fab-resume").textContent, rs: document.getElementById("r-resume").textContent }));
ok("2회독 진도 문구", /^2회독 진행 1\//.test(rd.prog), rd.prog.slice(0, 40));
ok("우하단 완료 표시 대신 2회독 이어 읽기", /2회독/.test(rd.fab) && !/완료/.test(rd.fab + rd.rs), rd.fab + " | " + rd.rs);

// ── 복습 카드: 머리표시·출처 링크·탭 상태 유지
await ev(() => { Q.queue = [D.cards.find((c) => c.q.startsWith("직권면직 시 동의"))]; Q.i = 0; Q.hist = []; Q.study = false; Q.sess = { t: Date.now(), tag: "", n: 0, ok: 0, retryOk: 0, retry: 0, ms: 0, study: 0 }; showTab("quiz"); drawCard(); }); await sleep(200);
const ctx = await ev(() => document.querySelector(".q-ctx") && document.querySelector(".q-ctx").textContent);
ok("카드 머리: 운영규정 제52조(직권면직)", ctx === "운영규정 제52조(직권면직)", ctx);
await ev(() => reveal()); await sleep(100);
ok("답 출처 조문 링크", await ev(() => !!document.querySelector('.ans .src .xr[data-x="a|운영규정:52"]')));
await ev(() => document.querySelector(".ans .src .xr").click()); await sleep(400);
ok("출처 누르면 원문 패널", await ev(() => pkOpen()));
await page.screenshot({ path: "ux8-card.png" });
await ev(() => document.querySelector("[data-pkgo]").click()); await sleep(400);
await ev(() => showTab("quiz")); await sleep(200);
ok("원문으로 갔다 돌아와도 정답 공개 상태 유지", await ev(() => Q.shown && !!document.querySelector("#q-out .ans")));
const leak = await ev(() => D.cards.filter((c) => { const h = cardCtx(c); return h && [c.a].concat(c.alt || []).map(norm).filter((k) => k.length >= 2).some((k) => norm(h).includes(k)); }).map((c) => c.q.slice(0, 20)));
ok("카드 머리에 답이 보이지 않음", leak.length === 0, leak.length + " " + leak.slice(0, 5).join(" / "));
await ev(() => { Q.sess = null; });

// ── 오늘: 글자 = 이동, 체크박스 = 체크
await ev(() => { dayIdx = 1; showTab("today"); renderers.today(); }); await sleep(300);
const k = await ev(() => document.querySelector("[data-goal]").dataset.goal);
await ev(() => document.querySelector("[data-goal]").click()); await sleep(400);
ok("목표 글자 누르면 이동, 체크 안 됨", await ev((k) => !document.getElementById("p-today").classList.contains("on") && !S.checks[k], k));
await ev(() => showTab("today")); await sleep(200);
await ev(() => document.querySelector(".goal-ck input").click()); await sleep(200);
ok("체크박스로 체크", await ev((k) => !!S.checks[k], k));
await page.screenshot({ path: "ux8-today.png" });

for (const [w, h, nm] of [[820, 1180, "port"], [390, 844, "phone"]]) {
  await page.setViewport({ width: w, height: h }); await ev(() => showTab("bt")); await sleep(300);
  await page.screenshot({ path: `ux8-${nm}-bt.png` });
  ok(`${nm}: 가로 스크롤 없음`, await ev(() => document.documentElement.scrollWidth <= innerWidth));
}
ok("페이지 오류 없음", errors.length === 0, errors.join(" | "));
console.log(res.join("\n"));
await browser.close();
