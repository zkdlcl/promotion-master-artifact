import puppeteer from "puppeteer-core";

/* 스터디 1·2주차 답지: 2주차 7인 49문항 추가, 1주차 56문항 해설 보강, 문제 글에 답이 보이던 문항 교체 */
const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1180, height: 820 });
await page.goto(URL, { waitUntil: "load" }); await sleep(800);

const d = await page.evaluate(() => {
  const g = (i) => D.exam.find((e) => e.id === i);
  const cnt = (grp, a) => D.exam.filter((e) => e.grp === grp && e.area === a).length;
  return {
    st2: ["김배성", "신희훈", "최강락", "구현지", "박준규", "신승현", "하영진"].map((a) => cnt("st2", a)),
    st1: ["김배성", "신희훈", "최강락", "구현지", "전권능", "박준규", "신승현", "하영진"].map((a) => cnt("st1", a)),
    jg: cnt("st2", "전권능"), a67: g("st2-신승현-7").a, a66: g("st2-신승현-6").a, multi: g("st2-최강락-6").a,
    q1: g("st1-신희훈-6").q, q2: g("st1-구현지-7").q, ex: g("st1-김배성-2").ex,
    bad: D.exam.filter((e) => e.grp === "st2" || e.grp === "st1").filter((e) => !e.a || !e.ex).map((e) => e.id),
  };
});
ok("2주차 7인 각 7문항", d.st2.every((n) => n === 7), d.st2.join());
ok("1주차 8인 각 7문항(중복 없음)", d.st1.every((n) => n === 7), d.st1.join());
ok("2주차 전권능은 기존 10문항 그대로", d.jg === 10);
ok("원문 기준 답: 신승현-6 ②, 신승현-7 ③", d.a66 === "②" && d.a67 === "③");
ok("복수 답 최강락-6", d.multi === "②④");
ok("문제 글에 답이 보이지 않음", !/\(144\)/.test(d.q1) && !/\(14\)|\(1\)/.test(d.q2));
ok("1주차 해설 보강", d.ex.includes("전국대의원총회"));
ok("답·해설 빈 문항 없음", d.bad.length === 0, d.bad.join());

for (const [nm, w, h, dark] of [["tablet", 1180, 820, false], ["portrait", 820, 1180, true], ["phone", 390, 844, false]]) {
  await page.setViewport({ width: w, height: h });
  await page.evaluate((dk) => { document.documentElement.dataset.theme = dk ? "dark" : "light"; }, dark);
  await page.evaluate(() => document.querySelector('[data-xstart="st2"]')?.click() ?? showTab("exam")); await sleep(300);
  await page.evaluate(() => { const b = document.querySelector('[data-xstart="st2"]'); if (b) b.click(); }); await sleep(300);
  await page.evaluate(() => { X.i = X.queue.findIndex((e) => e.id === "st2-신승현-7"); X.picked = null; X.shown = false; drawX(); }); await sleep(200);
  ok(`${nm} 가로 넘침 없음`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `st12-${nm}.png` });
}
ok("브라우저 오류 없음", errors.length === 0, errors.join(" | "));
console.log(res.join("\n"));
await browser.close();
