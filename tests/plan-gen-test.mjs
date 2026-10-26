/* 일정(10/22) 이후 날짜: 오늘의 목표 과제가 다음 스터디 과목을 따른다 */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { freezeDate } from './fixed-date.mjs';
const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const errors = [];
try {
  for (const [ymd, law, k] of [['2026-10-26','인사관리시행규칙','준비'],['2026-10-29','인사관리시행규칙','시험 당일'],['2026-11-09','감사운영규정','준비']]){
    const p = await browser.newPage(); await p.evaluateOnNewDocument(freezeDate(ymd)); p.on('pageerror',e => errors.push(e.message));
    await p.setViewport({width:1180,height:960});
    await p.goto(process.env.TEST_URL || 'http://127.0.0.1:8766/index.html',{waitUntil:'networkidle0'});
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await p.reload({waitUntil:'networkidle0'});
    await p.evaluate(() => showTab('today'));
    const r = await p.evaluate(() => ({h:$('#p-today h2').textContent, goals:$$('#p-today .goal-t').map(e => e.textContent), om:($('[data-om-launch]')||{}).textContent}));
    assert.ok(r.h.includes(law) && r.h.includes(k), ymd + ' 제목: ' + r.h);
    assert.ok(r.goals.length >= 2 && r.goals.every(g => !/운영규정 6~7장|17~19번/.test(g)), ymd + ' 과제: ' + r.goals.join('|'));
    await p.close(); console.log('PASS', ymd, r.h, r.goals.length);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
