import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";

// 새 카드 수는 make_cards.py 결과에 따라 바뀌므로 파일에서 읽는다 (기존 손 카드는 366장 고정)
const CN = JSON.parse(readFileSync(new globalThis.URL("../site/cards_new.json", import.meta.url), "utf8")).cards;
const OLD = 366, NEW = CN.length, G4 = CN.filter((c) => c.t === 21).length;

const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const errors = [];
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await browser.newPage();
await page.setViewport({ width: 1180, height: 820 });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await page.goto(URL, { waitUntil: "load" });
await sleep(500);
const click = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await sleep(250); };

/* ── 데이터 ── */
const dt = await page.evaluate(() => ({ cards: D.cards.length, newc: D.cards.filter((c) => c.t >= 21).length, topics: Object.keys(D.topics).length, ids: new Set(D.cards.map((c) => c.id)).size, units: D.cardUnits }));
ok(`카드 ${OLD + NEW}장(기존 ${OLD} + 새 ${NEW}), id 중복 없음`, dt.cards === OLD + NEW && dt.newc === NEW && dt.ids === OLD + NEW, JSON.stringify({ cards: dt.cards, newc: dt.newc }));
const qual = await page.evaluate(() => D.cards.filter((c) => c.t >= 21).filter((c) => (c.q.match(/\(\s\?\s\)/g) || []).length !== 1 || /~/.test(c.q.replace(/[\d급년호월일세상만]~\s*\d/g, "")) || /�/.test(c.q)).map((c) => c.id));
ok("새 카드 모두 빈칸 1개, ~ 표기·깨진 글자 없음", qual.length === 0, qual.slice(0, 5).join(","));

/* ── 묶음 목록 ── */
await page.evaluate(() => showTab("quiz")); await sleep(400);
const home = await page.evaluate(() => ({
  opts: [...document.querySelectorAll("#q-group option")].map((o) => o.textContent.replace(/\s+/g, " ").trim()),
  sel: document.getElementById("q-group").value, next: SCHED.find((s) => s.n && !s.prep && s.d >= todayKey()).n,
}));
ok("묶음: 전체 + 1~8차 단위(+조직법/정관 하위)", home.opts.length === 1 + 5 + 5, home.opts.join(" | "));
ok("차수 표기(1차…8차)", ["1차 · 조직법·정관", "2차 · 운영규정 1~5장", "3차 · 운영규정 6~7장", "4차 · 인사관리시행규칙", "5차 · 보수운영규정", "6차 · 재무·여비·감사", "7차 · 국제인도법", "8차 · 국제적십자규약"].every((t) => home.opts.some((o) => o.includes(t))));
ok("처음 열면 다음 스터디 시험의 묶음", home.sel === "g" + home.next, `선택 ${home.sel}, 다음 시험 ${home.next}차`);
ok("2회독 이후 단위는 따로 만들지 않음(묶음에 '2회독' 없음)", !home.opts.some((o) => /회독/.test(o)));

/* ── 4차 묶음 ── */
await page.evaluate(() => { const s = document.getElementById("q-group"); s.value = "g4"; s.dispatchEvent(new Event("change", { bubbles: true })); }); await sleep(400);
const g4 = await page.evaluate(() => ({ g: Q.group, chips: [...document.querySelectorAll("#p-quiz [data-tp]")].map((b) => b.textContent.replace(/\s+/g, " ").trim()), opt: document.querySelector('#q-group option[value="g4"]').textContent }));
ok(`4차 묶음 ${G4}장 + 주제 칩`, g4.g === "g4" && new RegExp(`${G4}장`).test(g4.opt) && g4.chips.length === 1 && /^4차 인사관리시행규칙/.test(g4.chips[0]), JSON.stringify(g4));
await page.evaluate(() => { const m = document.getElementById("q-mode"); m.value = "all"; m.dispatchEvent(new Event("change", { bubbles: true })); const l = document.getElementById("q-limit"); l.value = "0"; l.dispatchEvent(new Event("change", { bubbles: true })); }); await sleep(200);
await page.evaluate(() => document.getElementById("q-start") ? document.getElementById("q-start").click() : [...document.querySelectorAll("#p-quiz button")].find((b) => /시작/.test(b.textContent)).click()); await sleep(500);
const q1 = await page.evaluate(() => ({ sess: !!Q.sess, n: Q.queue.length, topics: [...new Set(Q.queue.map((c) => c.t))], q: Q.queue[0].q, a: Q.queue[0].a, alt: Q.queue[0].alt, hasIn: !!document.getElementById("q-in") }));
ok(`4차 카드 ${G4}장 세션 시작`, q1.sess && q1.n === G4 && q1.topics.length === 1 && q1.topics[0] === 21, JSON.stringify({ n: q1.n }));
ok("카드 문제 형식(【규정 조문】 문장 + 빈칸)", /^【인사관리시행규칙 제/.test(q1.q) && /\(\s\?\s\)/.test(q1.q), q1.q.slice(0, 70));

// 숫자 카드: 짧게 '숫자'만 써도 맞게 처리
await page.evaluate(() => { Q.study = false; });
const numIdx = await page.evaluate(() => Q.queue.findIndex((c) => c.alt && c.alt.some((x) => /^\d+$/.test(x))));
await page.evaluate((i) => { Q.i = i; drawCard(); }, numIdx);
const target = await page.evaluate(() => ({ a: Q.queue[Q.i].a, alt: Q.queue[Q.i].alt, short: Q.queue[Q.i].alt.find((x) => /^\d+$/.test(x)) }));
await page.evaluate((v) => { document.getElementById("q-in").value = v; }, target.short);
await page.evaluate(() => reveal()); await sleep(300);
ok("답을 숫자만 써도 정답 처리(alt)", await page.evaluate(() => Q.typed === true), JSON.stringify(target));
// 글자 카드: 정확히 쓰면 정답, 틀리면 오답
const txtIdx = await page.evaluate(() => Q.queue.findIndex((c, i) => i > 0 && !/\d/.test(c.a) && c.a.length <= 8));
await page.evaluate((i) => { Q.i = i; drawCard(); }, txtIdx);
await page.evaluate(() => { document.getElementById("q-in").value = "전혀다른답"; reveal(); }); await sleep(300);
ok("틀린 답은 오답 처리", await page.evaluate(() => Q.typed === false));
await page.evaluate(() => { Q.sess = null; renderers.quiz(); });

/* ── 회독한 조문의 카드만(범위) ── */
// 카드가 있는 조문은 make_cards.py 결과에 따라 바뀌므로, 4차 첫 카드의 조문을 읽은 것으로 둔다
const ART = CN.find((c) => c.t === 21).art;
await page.evaluate((k) => { Q.group = "g4"; S.reads = S.reads || {}; S.reads[k] = 1; }, ART);
const sc = await page.evaluate((k) => { const all = D.cards.filter((c) => inGroup(c, GR("g4"))); const scoped = all.filter(inScope); const c13 = all.filter((c) => cardArts(c).includes(k)); return { all: all.length, scoped: scoped.length, c13: c13.length, arts: cardArts(all[0]) }; }, ART);
ok(`회독한 조문(${ART}) 기준으로 카드 범위 계산`, sc.c13 >= 1 && sc.scoped >= sc.c13 && sc.arts.length >= 1 && /^인사관리시행규칙:\d+/.test(sc.arts[0]), JSON.stringify(sc));

/* ── 국제인도법 카드: 읽기 기록과 맞는 키 ── */
const ihl = await page.evaluate(() => { const c = D.cards.filter((x) => x.t === 26); const before = c.filter(inScope).length; S.reads = S.reads || {}; const k = c[0].art; S.reads[k] = 1; const after = c.filter(inScope).length; delete S.reads[k]; return { n: c.length, before, after, key: k }; });
ok("국제인도법 카드: 읽기 전엔 '공부한 범위'에 안 들어감, 읽으면 들어감", ihl.before === 0 && ihl.after >= 1, JSON.stringify(ihl));

/* ── 이름표 정리 ── */
await page.evaluate(() => { R.law = "운영규정"; R.topic = "0"; showTab("read"); }); await sleep(800);
await page.evaluate(() => { const el = document.getElementById("a-운영규정:55의2"); el && el.scrollIntoView(); }); await sleep(300);
const bd = await page.evaluate(() => { const el = document.getElementById("a-운영규정:55의2"); const b = [...el.querySelectorAll(".art-h .badge")]; return b.map((x) => ({ t: x.textContent, title: x.title })); });
ok("조문 머리글 표시: '2주차·운N' 대신 주제 이름", bd.length >= 1 && bd.every((x) => !/주차|운\d/.test(x.t)) && /직위해제|휴직|정년/.test(bd[0].t), JSON.stringify(bd));
ok("툴팁은 '3차 · 운영규정 …' 형태", /^\d차 · /.test(bd[0].title), bd[0].title);
ok("옛 '표시 안내' 문구 숨김", await page.evaluate(() => [...document.querySelectorAll(".toolbar > span.mute.small")].filter((e) => e.id !== "r-prog").every((e) => getComputedStyle(e).display === "none")));
const lawBadge = await page.evaluate(async () => { R.law = "조직법"; R.topic = "0"; drawRead(); await new Promise((r) => setTimeout(r, 300)); return [...document.querySelectorAll("#r-body .art-h .badge")].slice(0, 3).map((b) => b.textContent + "/" + b.title); });
ok("조직법 머리글도 주제 이름(예: 10순위 → 주제명)", lawBadge.length && lawBadge.every((t) => !/순위$/.test(t.split("/")[0])), lawBadge.join(" | "));
// 범위 칩(읽기 탭 운영규정 그룹명)
const grpChips = await page.evaluate(() => { R.law = "운영규정"; R.topic = "0"; drawRead(); return [...document.querySelectorAll("#r-chips [data-topic]")].map((b) => b.textContent).slice(0, 5); });
ok("회독 범위 칩에도 차수 표기", grpChips.some((t) => /^2차 · 운영규정 1~5장 전체/.test(t)) && grpChips.some((t) => /2차 운영규정 총칙/.test(t)), grpChips.join(" | "));

/* ── 오늘 추천의 약한 주제 이름표 ── */
await page.evaluate(() => { S.cards = S.cards || {}; D.cards.filter((c) => c.t === 21).slice(0, 4).forEach((c) => { S.cards[c.id] = { box: 0, right: 0, wrong: 1, due: 0, last: false, first: false }; }); showTab("today"); }); await sleep(500);
const rec = await page.evaluate(() => [...document.querySelectorAll(".rec")].map((r) => r.textContent.replace(/\s+/g, " ").trim()).join(" || "));
ok("오늘 추천: 약한 주제에 새 주제 이름", /인사관리시행규칙/.test(rec), rec.slice(0, 160));
await page.evaluate(() => showTab("quiz")); await sleep(300);
ok("가로 스크롤 없음", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

const real = errors.filter((e) => !/Failed to load resource|favicon|404/.test(e));
ok("콘솔 오류 없음", real.length === 0, real.join(" | "));
console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
