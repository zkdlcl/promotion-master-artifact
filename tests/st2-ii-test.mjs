import puppeteer from "puppeteer-core";

/* 스터디 2주차 전영민Ⅱ(10/22) 10문항: 공식 답지 정답이 앱에 들어 있다 */
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8765/index.html", { waitUntil: "load" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "load" }); await new Promise((r) => setTimeout(r, 600));
const r = await page.evaluate(() => { const x = D.exam.filter((e) => e.area === "전영민Ⅱ"); return { n: x.length, a: x.map((e) => e.a).join(","), grp: [...new Set(x.map((e) => e.grp))].join(), kinds: x.map((e) => e.kind[0]).join("") }; });
ok("전영민Ⅱ 10문항·묶음 st2", r.n === 10 && r.grp === "st2", JSON.stringify(r));
ok("공식 정답 ②③③②① X X X O O", r.a === "②,③,③,②,①,X,X,X,O,O" && r.kinds === "mmmmmoooooo".slice(0, 10), r.a);
ok("JS 오류 없음", errors.length === 0, errors.join(";"));
console.log(res.join("\n")); await browser.close();
