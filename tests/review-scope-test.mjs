import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try {
  const p=await browser.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.setViewport({width:1180,height:900});
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/index.html',{waitUntil:'networkidle0'});
  await p.evaluate(()=>showTab('quiz'));
  const snapshot=await p.evaluate(()=>JSON.stringify(S));
  const scopes=await p.$$eval('#q-group option',es=>es.map(e=>({v:e.value,t:e.textContent})));
  assert.equal(scopes.length,15);
  assert.ok(scopes.every(s=>!/└|\d차|\(\d+\//.test(s.t)));
  assert.ok(['g1a','g1b','g6a','g6b','g6c'].every(id=>scopes.some(s=>s.v===id)));
  const initial=await p.evaluate(()=>buildQueue().map(c=>c.id));
  assert.equal(initial.length,new Set(initial).size);
  await p.screenshot({path:'tests/review-scopes-desktop.png'});
  const count=await p.evaluate(()=>{
    const dates=SCHED.map(s=>s.d),result={};
    try {
      for(const n of [9,10,15,16,25]){
        SCHED.forEach(s=>s.d='2000-01-01');SCHED.find(s=>s.n===n).d='2099-01-01';
        Q.group=null;Q.scope=false;Q.mode='all';Q.limit=0;Q.topics.clear();
        drawQuizHome();result[n]={scope:Q.group,topics:[...new Set(buildQueue().map(c=>c.t))],count:buildQueue().length};
      }
      // 등록된 마지막 일정 이후, 5월에도 날짜에 묶이지 않은 과목 복습 유지.
      SCHED.forEach(s=>s.d='2000-01-01');Q.group=null;drawQuizHome();
      result.after={scope:Q.group,count:buildQueue().length,label:document.querySelector('.review-guide').textContent};
      Q.group='g6a';drawQuizHome();result.finance=buildQueue().length;
    } finally {SCHED.forEach((s,i)=>s.d=dates[i]);}
    return result;
  });
  assert.equal(count[9].count,145);
  assert.equal(count[10].count,276);
  assert.equal(count[15].count,201);
  assert.equal(count[16].count,317);
  assert.equal(count[25].count,101);
  assert.equal(count.after.scope,'all');assert.equal(count.after.count,619);assert.match(count.after.label,/자율 복습/);
  assert.ok(count.finance>0);
  assert.equal(await p.evaluate(()=>JSON.stringify(S)),snapshot);
  console.log('PASS 고정 과목 선택, 9~25차 결합 범위, 일정 종료 후 전체·과목별 복습, 기록 보존');
  await p.evaluate(()=>{
    Q.group='g1a';Q.scope=false;Q.mode='all';Q.limit=0;Q.study=false;drawQuizHome();
    document.getElementById('q-start').click();document.getElementById('q-in').value='입력 유지 확인';
  });
  const session=await p.evaluate(()=>Q.queue.map(c=>c.id));
  assert.equal(session.length,74);assert.equal(new Set(session).size,74);
  await p.$eval('[data-om-global]',e=>e.click());
  await p.waitForSelector('.om-nav');
  await p.$eval('[data-om-law="국제인도법"]',e=>e.click());
  await p.waitForFunction(()=>document.getElementById('om-title').textContent.startsWith('국제인도법')&&!document.querySelector('.om-loading'));
  await p.$eval('[data-om-close]',e=>e.click());
  assert.equal(await p.$eval('#q-in',e=>e.value),'입력 유지 확인');
  assert.deepEqual(await p.evaluate(()=>Q.queue.map(c=>c.id)),session);
  await p.evaluate(()=>{R.law='정관';R.topic='0';showTab('read');});
  assert.equal(await p.$('[data-om-read-map]'),null);
  await p.$eval('[data-om-global]',e=>e.click());
  await p.waitForSelector('.om-nav');
  await p.$eval('[data-om-close]',e=>e.click());
  assert.equal(await p.evaluate(()=>R.law),'정관');
  console.log('PASS 모든 탭의 구조도 메뉴·회독 중복 버튼 없음·카드 입력과 세션 유지');
  await p.evaluate(()=>{Q.sess=null;Q.group='next';showTab('quiz');});
  await p.setViewport({width:390,height:844});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.screenshot({path:'tests/review-scopes-mobile.png',fullPage:true});
  await p.evaluate(()=>document.documentElement.dataset.theme='dark');
  await new Promise(r=>setTimeout(r,250));
  await p.screenshot({path:'tests/review-scopes-dark.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS 모바일·다크 UI, JS 오류 없음');
} finally {await browser.close();}
