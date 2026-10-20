
/* ═════════ 기출·오답: 묶음 카드 + "풀기", 방식·유형은 칩 ═════════ */
const _drawXHome = drawXHome;
const xCount = grp => { const sv = X.grp; X.grp = grp; const n = xQueue().length; X.grp = sv; return n; };
function xStart(grp){
  X.grp = grp; X.queue = xQueue();
  if (!X.queue.length){ toast('이 조건에 맞는 문제가 없습니다.'); return; }
  X.i = 0; X.picked = null; X.shown = false; X.res = []; X.sess = true; X.done = false; drawX(); window.scrollTo(0, 0);
}
drawXHome = function(){
  _drawXHome();                                           /* 원래 화면을 한 번 그려 안내 문구를 가져온다 */
  const notes = $$('#p-exam > p.small.mute').map(n => n.outerHTML).join('');
  const all = D.exam, done = all.filter(e => exRec(e.id)).length, wr = all.filter(exWrong).length;
  const chip = (a, v, l, on) => `<button ${a}="${v}" aria-pressed="${!!on}">${l}</button>`;
  const card = (grp, title, pool, icon) => {
    const d = pool.filter(e => exRec(e.id)).length, w = pool.filter(exWrong).length, n = xCount(grp);
    return `<div class="pk"><div class="pk-m"><b>${icon || ''}${esc(title)}</b>
      <span class="small mute">${pool.length}문제 · 푼 ${d} · 오답 ${w}</span>
      <div class="bar" style="height:6px"><i style="width:${pct(d, pool.length)}%"></i></div></div>
      <button class="b-red" data-xstart="${grp}" ${n ? '' : 'disabled'}>풀기${n ? ' (' + n + ')' : ''}</button></div>`;
  };
  $('#p-exam').innerHTML = `
  <h2>기출·오답 문제 <span class="mute small">푼 ${done} / ${all.length} · 오답노트 ${wr}</span></h2>
  <div class="cs-box">
    <div class="cs-row"><span class="cs-lab">방식</span><div class="cs">${[['order','번호 순서'],['rand','무작위'],['new','안 푼 문제만']].map(m => chip('data-xmode', m[0], m[1], X.mode === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">유형</span><div class="cs">${[['','전체'],['mc','객관식·OX'],['sa','주관식']].map(m => chip('data-xkind', m[0], m[1], (X.kind || '') === m[0])).join('')}</div></div>
  </div>
  <p class="small mute" style="margin:8px 0">번호를 누르면 바로 채점되고, 틀린 문제는 오답노트에 쌓입니다. 오답노트에서 다시 맞히면 빠집니다.</p>
  <div class="pk-grid">${card('wrong', '오답노트 · 틀린 문제만', all.filter(exWrong), '📕 ')}
  ${XG.map(([g, l]) => card(g, l.replace(/^📕 /, ''), all.filter(e => e.grp === g))).join('')}
  ${card('all', '전체', all)}</div>
  ${notes}`;
};
$('#p-exam').addEventListener('click', e => {
  const s = e.target.closest('[data-xstart]'); if (s){ xStart(s.dataset.xstart); return; }
  const m = e.target.closest('[data-xmode]'); if (m){ X.mode = m.dataset.xmode; drawXHome(); return; }
  const k = e.target.closest('[data-xkind]'); if (k){ X.kind = k.dataset.xkind; drawXHome(); }
});

/* ═════════ 🕳 뻥뚫: 난이도·빈칸 수를 고르고 조문의 빈칸을 직접 채운다 ═════════ */
const BT = Object.assign({law:'조직법', topic:'0', lv:2, max:10, md:'type', cnt:10, ord:'weak', ch:0}, S.btp || {},
  {sess:false, done:false, queue:[], i:0, res:[], checked:false});
const btRec = id => (S.bt && S.bt[id]) || null;
const btPrefs = () => { S.btp = {law:BT.law, topic:BT.topic, lv:BT.lv, max:BT.max, md:BT.md, cnt:BT.cnt, ord:BT.ord, ch:BT.ch}; save(); };
const LVD = {1:['쉬움', '숫자·주체(기관·장관)만 가립니다.'], 2:['보통', '숫자·주체에 승인·의결 같은 동사까지 가립니다.'], 3:['어려움', '조사·접속어만 남기고 낱말을 가립니다.']};
const btNorm = s => String(s).replace(/\s+/g, '');
function btTopics(law){
  const out = [{v:'0', l:'전체 조문'}];
  if (!BASE_LAWS.includes(law)){ const ix = LAW_INDEX.find(x => x.law === law); (ix ? ix.chapters : []).forEach(c => out.push({v:'c' + c.i, l:c.title})); return out; }
  if (law !== '운영규정') Object.keys(D.topics).filter(k => +k < 11).forEach(k => out.push({v:k, l:tl(k) + ' ' + D.topics[k]}));
  else GROUPS.filter(g => g.lawName === law).forEach(g => {
    out.push({v:g.id, l:g.label.replace(/^\S+\s/, '').replace(/\s*\(.*$/, '') + ' 전체', g:1});
    g.topics.forEach(k => out.push({v:String(k), l:tl(k) + ' ' + D.topics[k]}));
  });
  return out;
}
const blankCount = (a, lv) => lv === 3 ? 99 : (a.html.match(/class="b b1"/g) || []).length + (lv === 2 ? (a.html.match(/class="b b2"/g) || []).length : 0);
function btCands(){ return D.articles.filter(a => a.type === 'a' && a.law === BT.law && inTopic(a, BT.topic) && blankCount(a, BT.lv) > 0); }
const btShuffle = arr => { const q = arr.slice(); for (let i = q.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; } return q; };
function btPick(){
  let c = btCands();
  if (BT.ord === 'rand') c = btShuffle(c);
  else if (BT.ord === 'weak'){ const k = a => { const r = btRec(artId(a)); return r ? r.last : -1; }; c = c.map((a, i) => [a, i]).sort((x, y) => k(x[0]) - k(y[0]) || x[1] - y[1]).map(x => x[0]); }
  return BT.cnt ? c.slice(0, BT.cnt) : c;
}
/* 가리기 ②·③ 공통: 조사·어미는 남기고 낱말을 빈칸으로 만든다.
   ② = 표시된 핵심어 + 숫자 + 나머지 낱말 약 30%   ③ = 숫자 + 나머지 낱말 약 65% (전부 가리지 않음)
   별표 표 칸은 낱말마다 끊지 않고 칸 안의 한 줄('1. ' 같은 번호는 남김)을 한 빈칸으로 가린다. 머리 행은 그대로 둔다.
   어떤 낱말을 가릴지는 글자로 정해지므로 다시 그려도 같은 자리가 가려진다. */
const CK_KEEP = new Set(['경우','다음','해당','등','수','때','것','바','위','각호','같은','관한','대한','따른','의한','위한','따라','의하여','위하여','대하여','관하여','정하는','정한','하는','하고','하며','하거나','있는','없는','이러한','그밖에','밖의','그','이','다른','삭제','해당하','비고']);
const CZ_RATE = {2: 30, 3: 65};
function czHash(str){ let h = 2166136261; for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 100; }
function czSpan(txt){ const b = document.createElement('span'); b.className = 'b b3'; b.textContent = txt; return b; }
function clozeIn(root, lv){
  lv = +lv || 3; const rate = CZ_RATE[lv] || 65;
  /* 표 칸: 줄 단위로 가린다 */
  $$('td', root).forEach(td => {
    const tr = td.parentElement, tb = tr && tr.parentElement;
    if (tb && tb.firstElementChild === tr) return;
    const w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()){ const n = w.currentNode; if (!n.parentElement.closest('.b, .xr, .amend')) nodes.push(n); }
    nodes.forEach((n, k) => {
      const m = n.nodeValue.match(/^(\s*(?:\d+\.\s*|[가-하]\.\s*)?)(.*?)(\s*)$/s); if (!m || !/[가-힣0-9]/.test(m[2]) || /^삭제$/.test(m[2])) return;
      const num = /\d/.test(m[2]);
      if (!(num && lv === 3) && czHash(m[2] + '|' + k) >= (lv === 3 ? 75 : 40)) return;
      const f = document.createDocumentFragment();
      if (m[1]) f.appendChild(document.createTextNode(m[1]));
      f.appendChild(czSpan(m[2])); if (m[3]) f.appendChild(document.createTextNode(m[3]));
      n.parentNode.replaceChild(f, n);
    });
  });
  /* 본문 줄: 낱말 단위 */
  $$('.ln', root).forEach(el => {
    if (el.closest('.chap') || /^\s*\[(별표|비고)/.test(el.textContent)) return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()){ const n = w.currentNode; if (!n.parentElement.closest('.b, .xr, .amend, td')) nodes.push(n); }
    let k = 0;
    nodes.forEach(n => {
      const t = n.nodeValue, re = /[가-힣A-Za-z0-9]+/g; let m, last = 0, hit = false; const out = document.createDocumentFragment();
      while ((m = re.exec(t))){
        if (/^\d+$/.test(m[0]) && /^[.)]/.test(t.slice(re.lastIndex, re.lastIndex + 1))) continue;
        const sp = split3(m[0]); if (!sp || !sp[0] || CK_KEEP.has(sp[0])) continue;
        const num = /\d/.test(sp[0]);
        if (!num && (sp[0].length < 2 || czHash(sp[0] + '|' + (k++)) >= rate)) continue;
        out.appendChild(document.createTextNode(t.slice(last, m.index)));
        out.appendChild(czSpan(sp[0]));
        if (sp[1]) out.appendChild(document.createTextNode(sp[1]));
        last = re.lastIndex; hit = true;
      }
      if (hit){ out.appendChild(document.createTextNode(t.slice(last))); n.parentNode.replaceChild(out, n); }
    });
  });
}
function btBuild(a){
  const root = document.createElement('div'); root.innerHTML = a.html;
  $$('.b', root).forEach(b => {
    const t = b.classList.contains('b1') ? 1 : b.classList.contains('b2') ? 2 : 0;
    const keep = BT.lv === 1 ? t === 1 : BT.lv === 2 ? t > 0 : false;
    if (!keep) b.replaceWith(document.createTextNode(b.textContent));
  });
  root.normalize();
  if (BT.lv === 3) clozeIn(root);
  let bl = $$('.b', root);
  if (BT.max > 0 && bl.length > BT.max){
    const keep = new Set(btShuffle(bl.map((_, i) => i)).slice(0, BT.max));
    bl.forEach((b, i) => { if (!keep.has(i)) b.replaceWith(document.createTextNode(b.textContent)); });
    bl = bl.filter((_, i) => keep.has(i));
  }
  bl.forEach(b => {
    const ans = b.textContent, n = [...ans].length;
    if (BT.md === 'type'){
      const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'bt-in'; inp.dataset.ans = ans;
      inp.style.width = Math.max(3.4, n * 1.05 + 1.6) + 'em'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', '빈칸');
      if (BT.ch) inp.placeholder = czCho(ans);
      b.replaceWith(inp);
    } else {
      const s = document.createElement('span'); s.className = 'bt-tap'; s.dataset.ans = ans; s.textContent = ans; b.replaceWith(s);
    }
  });
  return root;
}
function drawBtHome(){
  const topics = btTopics(BT.law);
  if (!topics.some(t => t.v === BT.topic)) BT.topic = '0';
  const cands = btCands(), seen = D.articles.filter(a => a.type === 'a' && a.law === BT.law && btRec(artId(a))).length;
  const chip = (a, v, l, on) => `<button ${a}="${esc(v)}" aria-pressed="${!!on}">${esc(l)}</button>`;
  const weak = D.articles.filter(a => a.type === 'a' && btRec(artId(a)) && btRec(artId(a)).last < 0.7);
  $('#p-bt').innerHTML = `
  <h2>🕳 뻥뚫 <span class="mute small">조문의 빈칸을 직접 채워 외웁니다</span></h2>
  <div class="bt-grid"><div class="bt-l">
  <div class="seg seg-scroll">${LAW_LIST.map(l => `<button data-bl="${l}" aria-pressed="${BT.law === l}">${l}</button>`).join('')}</div>
  <div class="cs-box" style="margin-top:10px">
    <div class="cs-row"><span class="cs-lab">범위</span><div class="cs">${topics.map(t => chip('data-btt', t.v, t.l, BT.topic === t.v)).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">난이도</span><div class="cs">${[1, 2, 3].map(l => chip('data-lv', l, (l === 1 ? '🟢 ' : l === 2 ? '🟡 ' : '🔴 ') + LVD[l][0], BT.lv === l)).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">빈칸 수</span><div class="cs">${[[5, '조문당 5개'], [10, '10개'], [20, '20개'], [0, '전부']].map(m => chip('data-max', m[0], m[1], BT.max === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">방식</span><div class="cs">${[['type', '✍️ 직접 쓰기'], ['tap', '👆 눌러서 확인']].map(m => chip('data-md', m[0], m[1], BT.md === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">초성</span><div class="cs">${[[0, '숨김'], [1, '처음부터 보이기']].map(m => chip('data-ch', m[0], m[1], BT.ch === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">조문 수</span><div class="cs">${[[5, '5개'], [10, '10개'], [20, '20개'], [0, '전부']].map(m => chip('data-cnt', m[0], m[1], BT.cnt === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">순서</span><div class="cs">${[['weak', '약한 것 먼저'], ['num', '번호순'], ['rand', '무작위']].map(m => chip('data-ord', m[0], m[1], BT.ord === m[0])).join('')}</div></div>
  </div>
  </div><div class="bt-r">
  <p class="small mute" style="margin:8px 0"><b>${LVD[BT.lv][0]}</b> · ${LVD[BT.lv][1]} 출제 가능 ${cands.length}개 조문 · 이 법령에서 푼 조문 ${seen}개</p>
  <button class="b-red" id="bt-start" ${cands.length ? '' : 'disabled'}>시작 (${Math.min(cands.length, BT.cnt || cands.length)}개 조문)</button>
  ${weak.length ? `<div class="card"><b>⚠️ 정답률 70% 미만 조문 ${weak.length}개</b><p class="small mute" style="margin:4px 0 0">순서를 '약한 것 먼저'로 두면 이 조문부터 나옵니다.</p></div>` : ''}</div></div>`;
}
function drawBt(){
  if (!BT.sess) return drawBtHome();
  if (BT.done || BT.i >= BT.queue.length) return drawBtEnd();
  const a = BT.queue[BT.i]; BT.checked = false;
  const root = btBuild(a), n = $$('[data-ans]', root).length;
  $('#p-bt').innerHTML = `
  <div class="row"><span class="mute small grow">${BT.i + 1} / ${BT.queue.length} · ${LVD[BT.lv][0]} · 빈칸 ${n}개</span><button class="b-line" id="bt-end">끝내기</button></div>
  <div class="bar" style="margin:6px 0"><i style="width:${pct(BT.i, BT.queue.length)}%"></i></div>
  <div class="card">
    <div class="art-h"><span class="badge">${esc(a.law)}</span><span class="no">${esc(nl(a.no))}</span><span class="tt">${esc(a.title || '')}</span></div>
    <div class="bt-art" id="bt-art"></div>
    <div id="bt-res"></div>
    <div class="row" id="bt-act">${BT.md === 'type'
      ? '<button class="b-line" id="bt-hint">초성 힌트</button><button class="b-red" id="bt-check">채점</button>'
      : '<span class="small mute grow">빈칸을 눌러 정답을 확인한 뒤 스스로 채점하세요.</span><button class="b-red" id="bt-ok">모두 맞혔다 ✅</button><button class="b-line" id="bt-no">틀렸다 ❌</button>'}</div>
  </div>`;
  $('#bt-art').appendChild(root);
}
function btRecord(ok, tot){
  const a = BT.queue[BT.i], id = artId(a), r = btRec(id) || {n:0, ok:0, tot:0};
  S.bt = S.bt || {}; S.bt[id] = {n:r.n + 1, ok:r.ok + ok, tot:r.tot + tot, last:tot ? ok / tot : 0, t:Date.now()};
  BT.res.push({id, ok, tot}); BT.checked = true; save();
  $('#bt-act').innerHTML = `<button class="b-red" id="bt-next">${BT.i + 1 < BT.queue.length ? '다음 조문 ▶' : '결과 보기'}</button>`;
}
function btCheck(){
  if (BT.checked) return;
  const ins = $$('#bt-art .bt-in'); let ok = 0;
  ins.forEach(inp => {
    const good = btNorm(inp.value) === btNorm(inp.dataset.ans);
    inp.classList.add(good ? 'ok' : 'no'); inp.disabled = true;
    if (good) ok++; else { const fx = document.createElement('span'); fx.className = 'bt-fix'; fx.textContent = inp.dataset.ans; inp.after(fx); }
  });
  $('#bt-res').innerHTML = `<div class="${ok === ins.length ? 'note' : 'xex'}"><b>${ok} / ${ins.length}</b> ${ok === ins.length ? '모두 맞혔습니다 👏' : '· 틀린 칸의 정답을 초록색으로 표시했습니다.'}</div>`;
  btRecord(ok, ins.length);
}
function drawBtEnd(){
  const tot = BT.res.reduce((s, r) => s + r.tot, 0), ok = BT.res.reduce((s, r) => s + r.ok, 0);
  const bad = BT.res.filter(r => r.ok < r.tot).map(r => D.articles.find(a => a.type === 'a' && artId(a) === r.id)).filter(Boolean);
  $('#p-bt').innerHTML = `<h2>결과 ${ok} / ${tot} <span class="mute small">(${pct(ok, tot)}%) · ${BT.res.length}개 조문</span></h2>
  ${bad.length ? `<div class="card"><b>다시 볼 조문</b>${bad.map(a => { const r = BT.res.find(x => x.id === artId(a)); return `<div class="exrow"><span class="nm grow">${esc(a.law)} ${esc(nl(a.no))} ${esc(a.title || '')}</span><span class="mute small">${r.ok}/${r.tot}</span><button class="rc" data-goart="${esc(artId(a))}">원문</button></div>`; }).join('')}</div>` : '<div class="note">모두 맞혔습니다! 👏</div>'}
  <div class="row"><button class="b-red" id="bt-home">처음으로</button>${bad.length ? '<button class="b-line" id="bt-retry">틀린 조문만 다시</button>' : ''}</div>`;
}
const _drawBtHome = drawBtHome;
drawBtHome = function(){
  if (!lawReady(BT.law)){ lawLoading('#p-bt', BT.law, () => drawBtHome()); return; }
  _drawBtHome();
};
renderers.bt = function(){ BT.sess ? drawBt() : drawBtHome(); };
$('#p-bt').addEventListener('click', e => {
  const t = e.target, id = t.id, pick = (attr, fn) => { const b = t.closest('[' + attr + ']'); if (b){ fn(b.getAttribute(attr)); btPrefs(); drawBtHome(); return true; } };
  if (pick('data-bl', v => { BT.law = v; BT.topic = '0'; })) return;
  if (pick('data-btt', v => { BT.topic = v; })) return;
  if (pick('data-lv', v => { BT.lv = +v; })) return;
  if (pick('data-max', v => { BT.max = +v; })) return;
  if (pick('data-md', v => { BT.md = v; })) return;
  if (pick('data-ch', v => { BT.ch = +v; })) return;
  if (pick('data-cnt', v => { BT.cnt = +v; })) return;
  if (pick('data-ord', v => { BT.ord = v; })) return;
  const ga = t.closest('[data-goart]'); if (ga){ showTab('read'); setTimeout(() => goRef('a|' + ga.dataset.goart), 60); return; }
  const tap = t.closest('.bt-tap'); if (tap){ tap.classList.toggle('rev'); return; }
  if (id === 'bt-start'){ const q = btPick(); if (!q.length){ toast('출제할 조문이 없습니다.'); return; } BT.queue = q; BT.i = 0; BT.res = []; BT.sess = true; BT.done = false; drawBt(); window.scrollTo(0, 0); }
  else if (id === 'bt-hint') $$('#bt-art .bt-in:not(:disabled)').forEach(i => { if (!i.value) i.placeholder = czCho(i.dataset.ans); });
  else if (id === 'bt-check') btCheck();
  else if (id === 'bt-ok' || id === 'bt-no'){ if (BT.checked) return; $$('#bt-art .bt-tap').forEach(s => s.classList.add('rev')); const n = $$('#bt-art .bt-tap').length; btRecord(id === 'bt-ok' ? n : 0, n); }
  else if (id === 'bt-next'){ BT.i++; drawBt(); window.scrollTo(0, 0); }
  else if (id === 'bt-end'){ BT.done = true; drawBtEnd(); }
  else if (id === 'bt-home'){ BT.sess = false; drawBtHome(); }
  else if (id === 'bt-retry'){
    const q = BT.res.filter(r => r.ok < r.tot).map(r => D.articles.find(a => a.type === 'a' && artId(a) === r.id)).filter(Boolean);
    BT.queue = q; BT.i = 0; BT.res = []; BT.done = false; drawBt(); window.scrollTo(0, 0);
  }
});
$('#p-bt').addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.classList.contains('bt-in')) return;
  e.preventDefault();
  const ins = $$('#bt-art .bt-in'), k = ins.indexOf(e.target);
  if (k >= 0 && k < ins.length - 1) ins[k + 1].focus(); else btCheck();
});

/* ═════════ 오늘: 지난 일정 접기 · 밀린 일 모으기 · 약점 기반 추천 ═════════ */
const _rToday = renderers.today;
renderers.today = function(){ _rToday(); try { todayEnhance(); } catch(e){ console.warn(e); } };
function todayEnhance(){
  const p = $('#p-today'), t = todayKey(); S.skip = S.skip || {};
  const idx = D.days.map((_, i) => i), firstUp = D.days.findIndex(d => d.date >= t);
  const pastIdx = idx.filter(i => D.days[i].date < t);
  const gstat = i => ({tot: D.days[i].goals.length, done: D.days[i].goals.filter((g, j) => S.checks[`d${i}.${j}`]).length});
  const late = []; pastIdx.forEach(i => { if (S.skip[i]) return; D.days[i].goals.forEach((g, j) => { if (!S.checks[`d${i}.${j}`]) late.push({i, j, g}); }); });
  const row = $$('.row', p).find(r => r.querySelector('[data-day]')); if (!row) return;
  const show = new Set(firstUp < 0 ? [] : idx.filter(i => i >= firstUp && i < firstUp + 7)); if (dayIdx !== null) show.add(dayIdx);
  row.innerHTML = [...show].sort((a, b) => a - b).map(i => `<button class="chip ${i === dayIdx ? 'on' : ''}" data-day="${i}">${esc(D.days[i].label)}${D.days[i].date === t ? ' · 오늘' : ''}</button>`).join('');
  /* 약점 기반 추천 */
  const wr = exWrongCount(), weakB = Object.values(S.bt || {}).filter(r => r.last < 0.7).length;
  const items = amendItems(), maxY = +items[0].latest.slice(0, 4), seenR = S.revSeen || {};
  const revNew = items.filter(it => +it.latest.slice(0, 4) >= maxY - 1 && !seenR[revKey(it)]).length;
  const st = cardStats(), weakT = Object.entries(st.byTopic).filter(([, o]) => o.right + o.wrong >= 3).map(([k, o]) => [k, pct(o.right, o.right + o.wrong)]).filter(x => x[1] < 70).sort((a, b) => a[1] - b[1]).slice(0, 2);
  const recs = [];
  if (wr) recs.push(['📕', `오답노트 <b>${wr}</b>문제`, '풀기', 'data-recx="1"']);
  if (weakB) recs.push(['🕳', `뻥뚫 정답률 낮은 조문 <b>${weakB}</b>개`, '뻥뚫', 'data-go="bt"']);
  if (weakT.length) recs.push(['🧠', '약한 주제 ' + weakT.map(([k, v]) => `${esc(D.topics[k])} ${v}%`).join(', '), '복습 카드', 'data-go="quiz"']);
  if (revNew) recs.push(['🆕', `확인 안 한 최근 개정 <b>${revNew}</b>건`, '보기', 'data-go="rev"']);
  const recHtml = `<div class="card rec-card"><b>🎯 오늘 추천</b>${recs.length ? recs.map(r => `<div class="rec"><span>${r[0]}</span><span class="grow">${r[1]}</span><button class="rc" ${r[3]}>${r[2]}</button></div>`).join('')
    : '<p class="small mute" style="margin:6px 0 0">아직 약점 기록이 없습니다. <b>🕳 뻥뚫</b>이나 <b>🗂 기출</b>을 한 번 풀면 여기에 복습할 것이 나타납니다.</p>'}</div>`;
  const lateHtml = late.length ? `<div class="card late-card"><div class="row"><b class="grow">⏰ 밀린 일 ${late.length}개</b><button class="rc" data-skipall="1">모두 건너뛰기</button></div>
    ${late.slice(0, 8).map(({i, j, g}) => `<label class="check"><input type="checkbox" data-chk="d${i}.${j}"><span>${g.tag ? `<span class="badge">${esc(g.tag)}</span>` : ''}${g.t} <span class="mute small">· ${esc(D.days[i].label)}</span></span></label>`).join('')}
    ${late.length > 8 ? `<p class="small mute" style="margin:6px 0 0">나머지 ${late.length - 8}개는 아래 '지난 일정'에서 날짜별로 볼 수 있습니다.</p>` : ''}</div>` : '';
  const skipN = pastIdx.filter(i => S.skip[i]).length;
  const pastHtml = pastIdx.length ? `<details class="card past-card"><summary><b>지난 일정 ${pastIdx.length}일</b> <span class="mute small">미완료 ${late.length}개${skipN ? ' · 건너뜀 ' + skipN + '일' : ''}</span></summary>
    ${pastIdx.map(i => { const s = gstat(i), sk = !!S.skip[i]; return `<div class="exrow past"><span class="dd">${esc(D.days[i].label)}</span><span class="nm grow">${esc(D.days[i].title)}</span><span class="mute small">${s.done}/${s.tot}${sk ? ' · 건너뜀' : ''}</span><button class="rc" data-day="${i}">보기</button><button class="rc" data-skip="${i}">${sk ? '건너뜀 해제' : '건너뛰기'}</button></div>`; }).join('')}</details>` : '';
  row.insertAdjacentHTML('beforebegin', recHtml + lateHtml + pastHtml);
}
$('#p-today').addEventListener('click', e => {
  const s = e.target.closest('[data-skip]'); if (s){ const k = s.dataset.skip; S.skip = S.skip || {}; if (S.skip[k]) delete S.skip[k]; else S.skip[k] = 1; save(); renderers.today(); return; }
  if (e.target.closest('[data-skipall]')){ S.skip = S.skip || {}; const t = todayKey(); D.days.forEach((d, i) => { if (d.date < t) S.skip[i] = 1; }); save(); toast('지난 일정을 모두 건너뜀으로 표시했습니다. (지난 일정에서 해제할 수 있어요)'); renderers.today(); return; }
  if (e.target.closest('[data-recx]')){ showTab('exam'); setTimeout(() => xStart('wrong'), 40); }
});
