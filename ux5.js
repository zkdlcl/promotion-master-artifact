
/* ═════ 선배 앱 문제 (기출 12묶음 · 스터디 문제 98묶음): 묶음 파일은 누를 때 불러온다 ═════ */
const QINDEX = D.quizIndex || [];
const QNAME = Object.fromEntries(QINDEX.map(g => [g.id, g.name]));
const QLOADED = {}, QPROM = {};                         /* 묶음 id → 문제 목록 / 불러오는 중인 Promise */
function loadQuizGroup(id){
  if (QLOADED[id]) return Promise.resolve(QLOADED[id]);
  if (QPROM[id]) return QPROM[id];
  const g = QINDEX.find(x => x.id === id);
  if (!g) return Promise.reject(new Error('알 수 없는 묶음: ' + id));
  return (QPROM[id] = fetch(g.file).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(j => { QLOADED[id] = j.items; delete QPROM[id]; return j.items; })
    .catch(e => { delete QPROM[id]; throw e; }));
}
const loadQuizGroups = ids => Promise.all(ids.map(loadQuizGroup));
const QID_RX = /^((?:past|sen)-\d+)-\d+$/;
const exById = id => D.exam.find(e => e.id === id) || ((QLOADED[(id.match(QID_RX) || [])[1]] || []).find(e => e.id === id));
const exWrongCount = () => Object.values(S.ex || {}).filter(r => !r.last).length;
const wrongGroupIds = () => [...new Set(Object.entries(S.ex || {}).filter(([id, r]) => !r.last && QID_RX.test(id)).map(([id]) => id.match(QID_RX)[1]))];
const groupProgress = id => { let n = 0, w = 0; for (const [k, r] of Object.entries(S.ex || {})) if (k.startsWith(id + '-')){ n++; if (!r.last) w++; } return {n, w}; };
/* 불러오는 데 시간이 걸리면 알림 */
function withLoadingToast(p, msg){ const t = setTimeout(() => toast(msg || '문제 불러오는 중…'), 250); const done = () => clearTimeout(t); p.then(done, done); return p; }

/* 원문 복원본 2024·2025 기출은 선배 앱 기출로 대체했으므로, 예전 풀이 기록을 새 번호로 한 번만 옮긴다 */
(function(){
  try {
    if (S.exmig || !D.exMap) return;
    S.ex = S.ex || {};
    for (const [o, nw] of Object.entries(D.exMap)) if (S.ex[o]){ if (!S.ex[nw]) S.ex[nw] = S.ex[o]; delete S.ex[o]; }
    S.exmig = 1; save();
  } catch (e) { console.warn(e); }
})();

/* 기존 기출·오답 코드가 새 문제에서도 맞게 동작하도록 이어 붙인다 */
const _exLabel = exLabel;
exLabel = e => QNAME[e.grp] ? QNAME[e.grp] + ' ' + e.no + '번' : _exLabel(e);
const _exChoices = exChoices;
exChoices = e => {
  if (e.kind === 'mc'){
    const n = Math.max(0, ...(e.q.match(/^[①-⑥]/gm) || []).map(c => '①②③④⑤⑥'.indexOf(c) + 1));
    if (n >= 2) return '①②③④⑤⑥'.slice(0, n).split('');
  }
  return _exChoices(e);
};
const _xPool = xPool;
xPool = function(){
  if (X.grp === 'custom') return X.custom || [];
  if (QLOADED[X.grp]) return QLOADED[X.grp];
  if (X.grp === 'wrong'){
    const extra = []; wrongGroupIds().forEach(gid => (QLOADED[gid] || []).forEach(e => { if (exWrong(e)) extra.push(e); }));
    return _xPool().concat(extra);
  }
  return _xPool();
};
const _xQueue = xQueue;
xQueue = function(){ let q = _xQueue(); if (X.grp === 'custom' && X.limit > 0) q = q.slice(0, X.limit); return q; };
X.limit = (S.xlim !== undefined ? S.xlim : 20);
const _xStart = xStart;
xStart = async function(grp){
  try {
    if (grp === 'wrong') await withLoadingToast(loadQuizGroups(wrongGroupIds()));
    else if (QINDEX.some(g => g.id === grp)) await withLoadingToast(loadQuizGroup(grp));
  } catch (e){ toast('문제 파일을 불러오지 못했습니다. 인터넷 연결을 확인하세요.'); return; }
  _xStart(grp);
};
/* 법령별로 모아 풀기: 그 법령 문제가 들어 있는 묶음만 불러와 같은 문제는 한 번만 담는다 */
async function startLawQuiz(laws){
  const cand = QINDEX.filter(g => laws.some(l => (g.areas || {})[l]));
  let gids = cand.map(g => g.id);
  if (X.limit > 0 && X.mode !== 'new'){            /* 문제 수가 정해져 있으면 필요한 만큼의 묶음만 무작위로 골라 불러온다 (중복 제거 여유분 3배) */
    let acc = 0; gids = [];
    for (const g of btShuffle(cand)){ gids.push(g.id); acc += laws.reduce((m, l) => m + ((g.areas || {})[l] || 0), 0); if (acc >= X.limit * 3) break; }
  }
  try { await withLoadingToast(loadQuizGroups(gids), '문제 ' + gids.length + '개 묶음 불러오는 중…'); }
  catch (e){ toast('문제 파일을 불러오지 못했습니다. 인터넷 연결을 확인하세요.'); return; }
  const seen = new Set(), items = [];
  gids.forEach(id => QLOADED[id].forEach(e => { if (!laws.includes(e.area)) return; const k = e.q + '|' + e.a; if (seen.has(k)) return; seen.add(k); items.push(e); }));
  X.custom = items;
  if (X.mode === 'order') X.mode = 'rand';
  _xStart('custom');
}
const lawQuizCount = laws => QINDEX.reduce((n, g) => n + laws.reduce((m, l) => m + ((g.areas || {})[l] || 0), 0), 0);

/* ── 기출·오답 첫 화면 ── */
const _drawXHome2 = drawXHome;
X.sf = X.sf || 'all';
drawXHome = function(){
  _drawXHome2();
  const notes = $$('#p-exam > p.small.mute').slice(1).map(n => n.outerHTML).join('');
  const all = D.exam, wr = exWrongCount();
  const chip = (a, v, l, on) => `<button ${a}="${v}" aria-pressed="${!!on}">${l}</button>`;
  const card = (grp, title, sub, d, w, total, icon) => `<div class="pk"><div class="pk-m"><b>${icon || ''}${esc(title)}</b>
      <span class="small mute">${sub} · 푼 ${d} · 오답 ${w}</span>
      <div class="bar" style="height:6px"><i style="width:${pct(d, total)}%"></i></div></div>
      <button class="b-red" data-xstart="${grp}" ${total ? '' : 'disabled'}>풀기</button></div>`;
  const local = g => { const p = all.filter(e => e.grp === g); return {t: p.length, d: p.filter(e => exRec(e.id)).length, w: p.filter(exWrong).length}; };
  const lawCard = l => { const n = lawQuizCount([l]); return `<div class="pk"><div class="pk-m"><b>${esc(l)}</b><span class="small mute">문제 ${n}개 · 묶음에서 모아 풀기</span></div><button class="b-red" data-xlaw="${esc(l)}" ${n ? '' : 'disabled'}>풀기</button></div>`; };
  const past = QINDEX.filter(g => g.kind === 'past'), sen = QINDEX.filter(g => g.kind === 'senior');
  const yr = g => (g.name.match(/^(\d{4})년/) || [])[1] || '기타';
  const years = ['all'].concat([...new Set(sen.map(yr))].sort().reverse());
  const senShown = sen.filter(g => X.sf === 'all' || yr(g) === X.sf);
  const grpCard = g => { const p = groupProgress(g.id); return card(g.id, g.name, g.count + '문제', p.n, p.w, g.count); };
  $('#p-exam').innerHTML = `
  <h2>기출·오답 문제 <span class="mute small">푼 ${Object.keys(S.ex || {}).length} · 오답노트 ${wr}</span></h2>
  <div class="cs-box">
    <div class="cs-row"><span class="cs-lab">방식</span><div class="cs">${[['order', '번호 순서'], ['rand', '무작위'], ['new', '안 푼 문제만']].map(m => chip('data-xmode', m[0], m[1], X.mode === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">유형</span><div class="cs">${[['', '전체'], ['mc', '객관식·OX'], ['sa', '주관식'], ['bl', '빈칸']].map(m => chip('data-xkind', m[0], m[1], (X.kind || '') === m[0])).join('')}</div></div>
    <div class="cs-row"><span class="cs-lab">모아 풀기</span><div class="cs">${[[10, '10문제'], [20, '20문제'], [50, '50문제'], [0, '전부']].map(m => chip('data-xlim', m[0], m[1], X.limit === m[0])).join('')}</div></div>
  </div>
  <p class="small mute" style="margin:8px 0">번호를 누르면 바로 채점되고, 틀린 문제는 오답노트에 쌓입니다. 오답노트에서 다시 맞히면 빠집니다.</p>
  <h3>📕 오답노트</h3>
  <div class="pk-grid"><div class="pk"><div class="pk-m"><b>틀린 문제만</b><span class="small mute">전체 묶음의 오답 ${wr}문제</span></div><button class="b-red" data-xstart="wrong" ${wr ? '' : 'disabled'}>풀기 (${wr})</button></div></div>
  <h3>📚 법령별로 모아 풀기 <span class="mute small">모든 기출·스터디 문제에서 그 법령만 골라 위의 '모아 풀기' 개수만큼</span></h3>
  <div class="pk-grid">${LAW_LIST.map(lawCard).join('')}</div>
  <h3>🗂 기출 (선배 앱) <span class="mute small">2018~2025년 4급 · 전직시험</span></h3>
  <div class="pk-grid">${past.map(grpCard).join('')}</div>
  <h3>📝 2026 기출 · 스터디 문제 <span class="mute small">원문 복원본 (선배 앱에 없는 문제)</span></h3>
  <div class="pk-grid">${XG.map(([g, l]) => { const c = local(g); return card(g, l.replace(/^📕 /, ''), c.t + '문제', c.d, c.w, c.t); }).join('')}</div>
  <details class="card" ${X.sfOpen ? 'open' : ''} id="x-sen"><summary><b>🧑‍🤝‍🧑 스터디 문제 묶음 (${sen.length})</b> <span class="mute small">선배 스터디에서 만든 문제</span></summary>
    <div class="fsc" style="margin:10px 0">${years.map(y => chip('data-xsf', y, y === 'all' ? '전체' : y, X.sf === y)).join('')}</div>
    <div class="pk-grid">${senShown.map(grpCard).join('')}</div></details>
  ${notes}`;
};
$('#p-exam').addEventListener('click', e => {
  const l = e.target.closest('[data-xlaw]'); if (l){ startLawQuiz([l.dataset.xlaw]); return; }
  const lim = e.target.closest('[data-xlim]'); if (lim){ X.limit = +lim.dataset.xlim; S.xlim = X.limit; save(); drawXHome(); return; }
  const sf = e.target.closest('[data-xsf]'); if (sf){ X.sf = sf.dataset.xsf; X.sfOpen = true; drawXHome(); }
});
$('#p-exam').addEventListener('toggle', e => { if (e.target.id === 'x-sen') X.sfOpen = e.target.open; }, true);
