import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";
/* DB 동기화 모드: 서버 기록(백업)을 받은 뒤에만 정정하고 서버에 저장. 기기에는 낡은 기록이 있어도 서버 기록 기준 */
const raw = JSON.parse(readFileSync(new globalThis.URL("../backup/progress.json", import.meta.url), "utf8"));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage(); const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.evaluateOnNewDocument((remote) => {
  localStorage.setItem("orgmaster.v1", JSON.stringify({ upd: 1, ex: {}, reads: {}, cards: {}, seeds: {} }));   // 낡은 기기 기록
  window.__sets = [];
  window.claude = { use: async () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => remote }), set: async (b) => { window.__sets.push(b); }, onSnapshot: () => {} }) }) };
}, raw);
await page.goto("http://localhost:8765/index.html", { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 3000));
const o = await page.evaluate(() => { const last = window.__sets.at(-1); const s = last && JSON.parse(last.json); return { n: window.__sets.length, reads: s && Object.keys(s.reads).length, fix: s && s.seeds.st2fix, h8: s && s.ex["st2-황해민-8"], h1: s && s.ex["st2-황해민-1"] }; });
const P = JSON.parse(raw.json);
console.log(JSON.stringify(o));
console.log((o.n >= 1 && o.reads === Object.keys(P.reads).length && o.fix === 1 && o.h8.last === false && JSON.stringify(o.h1) === JSON.stringify(P.ex["st2-황해민-1"]) ? "PASS" : "FAIL") + "  서버 기록 위에서 정정 후 저장, 회독 수 유지 " + Object.keys(P.reads).length);
console.log((errors.length ? "FAIL" : "PASS") + "  페이지 오류 없음 " + errors.join("|"));
await browser.close();
