import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";

/* 기출 근거 DB 연결: 기출 풀이 후 근거 상자, 근거 조문 패널, 회독 배지 */
const KB = JSON.parse(readFileSync(new globalThis.URL("../kb/exam_kb.json", import.meta.url), "utf8"));
const URL = "http://localhost:8765/index.html";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const res = [], errors = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n} ${x}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1180, height: 820 });
await page.goto(URL, { waitUntil: "load" }); await sleep(600);

const n = await page.evaluate(() => ({ items: Object.keys(D.kb.items).length, arts: Object.keys(D.kb.arts).length }));
ok("앱 데이터에 근거 DB가 들어감", n.items === Object.keys(KB.items).length && n.arts === Object.keys(KB.arts).length, JSON.stringify(n));

// 기록이 있는 2018년 기출 문항 하나를 풀어 본다
const id = Object.keys(KB.items).find((k) => k.startsWith("past-01-") && KB.items[k].kind === "mc");
const grp = id.split("-").slice(0, 2).join("-"), no = +id.split("-")[2];
await page.evaluate(() => showTab("exam")); await sleep(300);
await page.evaluate((g) => document.querySelector(`[data-xstart="${g}"]`).click(), grp);
for (let i = 0; i < 30 && !(await page.evaluate(() => X.sess && X.queue.length)); i++) await sleep(200);
await page.evaluate((id) => { X.i = X.queue.findIndex((e) => e.id === id); X.picked = null; X.shown = false; drawX(); }, id); await sleep(200);
ok("풀기 전에는 근거 상자 없음", await page.evaluate(() => !document.querySelector(".kbx")));
await page.evaluate(() => document.querySelector(".xc").click()); await sleep(300);
const box = await page.evaluate(() => { const b = document.querySelector(".kbx"); return b && { chips: [...b.querySelectorAll("[data-kbart]")].map((x) => x.dataset.kbart), text: b.textContent.replace(/\s+/g, " ").slice(0, 120) }; });
ok(`정답 공개 뒤 근거 상자 (${id})`, box && box.chips.length === KB.items[id].arts.length, JSON.stringify(box));
await page.evaluate(() => document.querySelector("[data-kbart]").click()); await sleep(800);
const pk = await page.evaluate(() => ({ open: !document.getElementById("pk").hidden, ti: document.getElementById("pk-ti").textContent.replace(/\s+/g, " ").trim() }));
ok("근거 조문을 누르면 원문 패널", pk.open && pk.ti.length > 0, JSON.stringify(pk));
await page.evaluate(() => closePeek()); await page.screenshot({ path: "kb-exam.png" });

// 회독: 기출에 나온 조문 배지
const art = Object.keys(KB.arts).find((k) => k.startsWith("운영규정:") && !k.includes("별표"));
await page.evaluate(() => { X.sess = null; R.law = "운영규정"; R.topic = "0"; showTab("read"); }); await sleep(1200);
const badge = await page.evaluate((k) => { const el = document.getElementById("a-" + k); const b = el && el.querySelector(".kbb"); return b && b.textContent; }, art);
ok(`회독 조문에 기출 배지 (${art})`, badge === "기출 " + KB.arts[art].n, String(badge));
const noBadge = await page.evaluate(() => [...document.querySelectorAll('.art[id^="a-운영규정:"]')].filter((el) => !D.kb.arts[el.id.slice(2)] && el.querySelector(".kbb")).length);
ok("기출에 안 나온 조문엔 배지 없음", noBadge === 0, String(noBadge));
ok("페이지 오류 없음", errors.length === 0, errors.join(" | "));

console.log(res.join("\n"));
await browser.close();
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
