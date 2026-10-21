import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const url=process.env.TEST_URL || 'http://127.0.0.1:8766/index.html';
try {
  const page=await browser.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:820,height:1180});
  await page.goto(url,{waitUntil:'networkidle0'});
  const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>OPStudy.launch('국제인도법'));
  await page.waitForSelector('.om-nav');
  // 뒤쪽 묶음을 눌러도 칩 줄이 처음으로 돌아가지 않고 선택 칩이 보여야 한다
  const n=await page.evaluate(()=>OPStudy.chapters.length);
  for(const v of [Math.floor(n/2),n-1,3]){
    await page.$eval(`.om-nav [data-om-view="${v}"]`,e=>e.click());
    const r=await page.evaluate(()=>{const nav=document.querySelector('.om-nav'),on=nav.querySelector('[aria-pressed=true]'),a=nav.getBoundingClientRect(),b=on.getBoundingClientRect();return {left:nav.scrollLeft,visible:b.left>=a.left-1&&b.right<=a.right+1};});
    assert.ok(r.visible,`묶음 ${v} 선택 칩이 보임`); if(v>3) assert.ok(r.left>0,'칩 줄이 처음으로 되돌아가지 않음');
  }
  await page.screenshot({path:'tests/map-focus.png'});
  // 오늘 범위: 운영규정 g3
  await page.evaluate(()=>OPStudy.launch('운영규정','g3'));
  await page.waitForSelector('.om-rng');
  assert.equal(await page.$$eval('.om-rng',e=>e.length),2,'6·7장');
  assert.ok(await page.$eval('.om-today',e=>e.getAttribute('aria-pressed')==='true'));
  await page.screenshot({path:'tests/map-range.png'});
  await page.$eval('[data-om-close]',e=>e.click());
  await page.evaluate(()=>{R.law='운영규정';R.topic='g3';showTab('read');drawRead();});
  assert.ok(await page.$('[data-om-range]'),'읽기 탭 범위 구조도 버튼');
  await page.$eval('[data-om-range]',e=>e.click());
  await page.waitForSelector('.om-rng');
  assert.equal(await page.evaluate(()=>JSON.stringify(S)),before,'학습 기록 보존');
  assert.deepEqual(errors,[]);
  console.log('PASS map focus');
} finally { await browser.close(); }
