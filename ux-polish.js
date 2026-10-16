
/* ───────── UI 개선: 선택 상자 → 눌러 고르는 칩·번호판, 검색 결과 카드 ───────── */
/* 회독 탭의 select 3개(주제·이동·가리기)는 화면에서 숨기고 상태 보관용으로만 남긴다.
   칩을 누르면 해당 select 값을 바꾸고 change 이벤트를 보내, 기존 동작을 그대로 쓴다. */
const MODE_LAB = {'0':'원문', '1':'① 숫자·주체', '2':'② 동사까지', '3':'③ 조사만'};
const _drawRead = drawRead;
function syncLawSeg(){
  const seg = $('#r-law'); if (!seg) return;
  if (seg.children.length !== LAW_LIST.length){ seg.innerHTML = LAW_LIST.map(l => `<button data-law="${esc(l)}">${esc(l)}</button>`).join(''); seg.classList.add('seg-scroll'); }
  $$('#r-law button').forEach(b => b.setAttribute('aria-pressed', b.dataset.law === R.law));
}
drawRead = function(keepScroll){
  syncLawSeg();
  if (!lawReady(R.law)){ lawLoading('#r-body', R.law, () => drawRead(keepScroll)); return; }
  _drawRead(keepScroll);
  const nt = $('#r-note'); if (nt) nt.hidden = !['조직법', '정관'].includes(R.law);
  try { syncChips(); } catch(e){ console.warn(e); }
};
function syncChips(){
  const tb = $('#p-read .toolbar'); if (!tb) return;
  const topic = $('#r-topic'), mode = $('#r-mode'), jump = $('#r-jump');
  let box = $('#r-chips');
  if (!box){
    [topic, mode, jump].forEach(s => { s.hidden = true; });
    box = document.createElement('div'); box.id = 'r-chips'; box.className = 'cs-box';
    tb.insertBefore(box, $('#r-prog'));
    box.addEventListener('click', onChipClick);
  }
  const chip = (attr, val, label, on) => `<button ${attr}="${esc(val)}" aria-pressed="${!!on}">${esc(label)}</button>`;
  let tp = '', lastG = '';
  [...topic.options].forEach(o => {
    const g = o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : '';
    if (g && g !== lastG){ tp += `<span class="cg">${esc(g)}</span>`; lastG = g; }
    tp += chip('data-topic', o.value, o.textContent.replace(/^[▶\s　]+/, ''), o.value === topic.value);
  });
  let ch = '';
  [...jump.querySelectorAll('optgroup')].forEach(g => { const o = g.querySelector('option'); if (o) ch += chip('data-jump', o.value, g.label, false); });
  const md = [...mode.options].map(o => chip('data-mode', o.value, MODE_LAB[o.value] || o.textContent, o.value === mode.value)).join('');
  const sl = $$('#r-chips .cs').map(e => e.scrollLeft);
  box.innerHTML = `
    <div class="cs-row"><span class="cs-lab">범위</span><div class="cs">${tp}</div></div>
    <div class="cs-row cs-nav"><span class="cs-lab">이동</span><div class="cs"><button class="cs-go" data-sheet="1">🔢 조문 번호</button>${ch}</div></div>
    <div class="cs-row"><span class="cs-lab">가리기</span><div class="cs">${md}</div></div>`;
  $$('#r-chips .cs').forEach((e, i) => { e.scrollLeft = sl[i] || 0; });
}
function onChipClick(e){
  const b = e.target.closest('button'); if (!b) return;
  const fire = (sel, v) => { sel.value = v; sel.dispatchEvent(new Event('change')); };
  if (b.dataset.topic !== undefined) return fire($('#r-topic'), b.dataset.topic);
  if (b.dataset.mode !== undefined) return fire($('#r-mode'), b.dataset.mode);
  if (b.dataset.jump !== undefined) return fire($('#r-jump'), b.dataset.jump);
  if (b.dataset.sheet) return openArtSheet();
}
function openArtSheet(){
  const jump = $('#r-jump'); let body = '';
  const btns = opts => opts.map(o => {
    const m = o.textContent.trim().match(/^(\S+)\s*(.*)$/) || ['', o.textContent.trim(), ''];
    return `<button data-aj="${esc(o.value)}"><b>${esc(m[1])}</b><small>${esc(m[2])}</small></button>`;
  }).join('');
  const loose = [...jump.children].filter(o => o.tagName === 'OPTION' && o.value.startsWith('a-'));
  if (loose.length) body += `<div class="cs-gh">조문</div><div class="cs-grid">${btns(loose)}</div>`;
  [...jump.querySelectorAll('optgroup')].forEach(g => {
    const arts = [...g.querySelectorAll('option')].filter(o => o.value.startsWith('a-'));
    if (arts.length) body += `<div class="cs-gh">${esc(g.label)}</div><div class="cs-grid">${btns(arts)}</div>`;
  });
  const o = document.createElement('div'); o.className = 'ov';
  o.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><div class="row" style="margin-bottom:6px"><b class="grow">조문 번호로 이동</b><button class="b-line" id="sheet-x">닫기</button></div>${body || '<p class="mute small">이동할 조문이 없습니다.</p>'}</div>`;
  document.body.appendChild(o);
  o.addEventListener('click', ev => {
    if (ev.target === o || ev.target.id === 'sheet-x'){ o.remove(); return; }
    const b = ev.target.closest('[data-aj]'); if (!b) return;
    o.remove(); const j = $('#r-jump'); j.value = b.dataset.aj; j.dispatchEvent(new Event('change'));
  });
}

/* 🔍 검색: 구분별 건수 칩 + 결과 카드(문제는 문제 본문 그대로, 해설은 접어 두기) */
F.limit = 30; F.key = '';
FS = [['all', '전체']].concat(LAW_LIST.map(l => [l, l]), [['exam', '기출·문제'], ['card', '복습 카드']]);
findRun = function(){
  const terms = F.q.split(/\s+/).filter(Boolean), out = $('#f-out'), sc = $('#f-sc');
  if (terms.length && needAllLaws()){
    out.innerHTML = '<div class="note">⏳ 모든 규정을 불러오는 중…</div>';
    loadAllLaws().then(() => { F.idx = null; findRun(); });
    return;
  }
  if (sc) sc.className = 'cs';
  if (!terms.length){
    if (sc) sc.innerHTML = FS.map(s => `<button data-fsc="${s[0]}" aria-pressed="${F.scope === s[0]}">${s[1]}</button>`).join('');
    out.innerHTML = '<p class="mute small" style="text-align:center">검색어를 입력하세요. 띄어쓰기가 달라도 찾습니다(예: "운영위원회 서면의결").</p>'; return;
  }
  const rxs = terms.map(t => new RegExp([...t].map(rxEsc).join('\\s*'), 'i'));
  const all = [];
  findIndex().forEach(d => {
    let score = 0, first = -1;
    for (const rx of rxs){
      const inT = rx.test(d.t), m = rx.exec(d.x);
      if (!inT && !m) return;
      score += (inT ? 5 : 0) + (m ? 1 : 0) + (d.h && rx.test(d.h) ? 3 : 0);
      if (m && (first < 0 || m.index < first)) first = m.index;
    }
    all.push({d, score, first});
  });
  const counts = {all: all.length}; all.forEach(r => { counts[r.d.sc] = (counts[r.d.sc] || 0) + 1; });
  if (sc) sc.innerHTML = FS.map(s => `<button data-fsc="${s[0]}" aria-pressed="${F.scope === s[0]}">${s[1]} (${counts[s[0]] || 0})</button>`).join('');
  const key = F.q + '|' + F.scope; if (key !== F.key){ F.key = key; F.limit = 30; }
  const res = (F.scope === 'all' ? all : all.filter(r => r.d.sc === F.scope)).sort((a, b) => b.score - a.score);
  const hl = s => { let h = esc(s); terms.forEach(t => { h = h.replace(new RegExp([...esc(t)].map(rxEsc).join('(?:\\s|&nbsp;)*'), 'gi'), m => '<mark>' + m + '</mark>'); }); return h; };
  const shown = res.slice(0, F.limit);
  out.innerHTML = `<p class="small mute" style="text-align:center;margin:6px 0">${res.length}건을 찾았습니다.</p>` + '<div class="fr2-grid">' + shown.map(r => {
    const d = r.d;
    if (d.k === 'law'){
      const st = Math.max(0, r.first - 40), snip = r.first < 0 ? d.x.slice(0, 140) : (st > 0 ? '…' : '') + d.x.slice(st, st + 160) + (st + 160 < d.x.length ? '…' : '');
      return `<div class="fr2"><div class="fr2-h"><span class="badge">${esc(d.a.law)}</span><span class="fr2-m">${hl(d.t)}</span>
        <button class="b-red sm" data-fgo="${esc(d.a.law + ':' + d.a.no)}">원문 보기</button></div>
        <div class="fr2-b">${hl(snip)}</div></div>`;
    }
    if (d.k === 'exam'){
      const e = d.e;
      return `<div class="fr2"><div class="fr2-h"><span class="badge t">문제</span><span class="fr2-m">${esc(d.t)}</span></div>
        <div class="fr2-q">${hl(e.q)}</div>
        <details><summary>정답·해설 보기</summary><div class="fr2-a"><b>정답</b> ${esc(e.a)}${e.ex ? '<div style="margin-top:6px">' + e.ex + '</div>' : ''}</div></details></div>`;
    }
    const c = d.c;
    return `<div class="fr2"><div class="fr2-h"><span class="badge t">카드</span><span class="fr2-m">${esc(D.topics[c.t] || '')}</span></div>
      <div class="fr2-q">${hl(c.q)}</div>
      <details><summary>정답 보기</summary><div class="fr2-a"><b>정답</b> ${esc(c.a)}<span class="mute small"> ${esc(c.src || '')}</span></div></details></div>`;
  }).join('') + '</div>' + (res.length > shown.length ? `<div style="text-align:center;margin:10px 0"><button class="b-line" data-fmore="1">더 보기 (${res.length - shown.length}건 남음)</button></div>` : '');
  F.res = res;
  { const w = lawsMissingNote(); if (w) out.insertAdjacentHTML('afterbegin', w); }
};
$('#p-find').addEventListener('click', e => { if (e.target.closest('[data-fmore]')){ F.limit += 30; findRun(); } });
