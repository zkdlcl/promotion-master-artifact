/* ───────── 개정 (시행된 최근 개정 + 개정 전·후 비교) ───────── */
const RV = {sub:'recent', law:'전체', year:'recent', hide:false};
const AMEND_RE = /<span class="amend">&lt;([^<]*?)&gt;<\/span>/g;
function parseMarks(txt){
  const out = []; let kind = '개정', m;
  const re = /(전문개정|일부개정|개정|신설|삭제)|(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/g;
  while ((m = re.exec(txt))){
    if (m[1]) kind = m[1] === '일부개정' ? '개정' : m[1];
    else out.push({kind, date: m[2] + '-' + m[3].padStart(2, '0') + '-' + m[4].padStart(2, '0')});
  }
  return out;
}
const noNum = n => parseInt(String(n).replace(/\D.*$/, ''), 10) || 0;
const LAW_ORDER = Object.fromEntries(LAW_LIST.map((l, i) => [l, i]));
let _amendItems = null;
function amendItems(){
  if (_amendItems) return _amendItems;
  const items = [];
  for (const a of D.articles){
    if (a.type !== 'a') continue;
    const lines = []; let latest = '';
    (a.html.match(/<div class="ln[^"]*">[\s\S]*?<\/div>/g) || []).forEach(h => {
      const marks = [];
      h.replace(AMEND_RE, (_, t) => { marks.push(...parseMarks(t)); return ''; });
      lines.push({h, marks});
      marks.forEach(m => { if (m.date > latest) latest = m.date; });
    });
    if (!latest) continue;
    const kinds = new Set();
    lines.forEach(l => l.marks.forEach(m => { if (m.date === latest) kinds.add(m.kind); }));
    items.push({law:a.law, no:a.no, title:a.title, latest, kinds:[...kinds], lines});
  }
  items.sort((x, y) => y.latest.localeCompare(x.latest) || (LAW_ORDER[x.law] - LAW_ORDER[y.law]) || (noNum(x.no) - noNum(y.no)));
  return (_amendItems = items);
}
let plainBlanks = h => h.replace(/<span class="b b\d">([\s\S]*?)<\/span>/g, '$1');
const fmtDate = d => d.slice(0, 4) + '.' + (+d.slice(5, 7)) + '.' + (+d.slice(8, 10));
const revKey = it => it.law + ':' + it.no + '@' + it.latest;

/* 토큰 단위 비교 (LCS) */
function rvTok(s){ return s.match(/\s+|[가-힣]+|[A-Za-z]+|\d+|[^\s가-힣A-Za-z\d]/g) || []; }
function rvDiff(a, b){
  const A = rvTok(a), B = rvTok(b), n = A.length, m = B.length;
  if (!n || !m || n * m > 4e6) return null;
  const w = m + 1, dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i * w + j] = A[i] === B[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  const ops = []; let i = 0, j = 0;
  const push = (t, s) => { const l = ops[ops.length - 1]; if (l && l.t === t) l.s += s; else ops.push({t, s}); };
  while (i < n && j < m){
    if (A[i] === B[j]){ push('=', A[i]); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]){ push('-', A[i]); i++; }
    else { push('+', B[j]); j++; }
  }
  while (i < n) push('-', A[i++]);
  while (j < m) push('+', B[j++]);
  /* 바뀐 낱말 사이에 끼인 공백은 같이 묶어 한 덩어리로 보이게 한다 */
  const out = [];
  ops.forEach((o, k) => {
    const p = ops[k - 1], q = ops[k + 1];
    if (o.t === '=' && /^\s+$/.test(o.s) && p && q && p.t !== '=' && q.t !== '='){ out.push({t:'-', s:o.s}, {t:'+', s:o.s}); }
    else out.push(o);
  });
  return out;
}
/* 같은 쪽(전/후)에서 이어지는 같은 종류 조각을 하나로 합친다 */
function rvMerge(ops){
  const r = [];
  ops.forEach(o => { const l = r[r.length - 1]; if (l && l.t === o.t) l.s += o.s; else r.push({t:o.t, s:o.s}); });
  return r;
}
const rvNl = s => esc(s).replace(/\n/g, '<br>');
function rvBody(c){
  const before = c.before || '', after = c.after || '';
  if (!before) return {b: '<span class="mute">(신설 · 개정 전 없음)</span>', a: `<span class="rv-add">${rvNl(after)}</span>`};
  if (!after) return {b: `<del class="rv-del">${rvNl(before)}</del>`, a: '<span class="mute">(삭제)</span>'};
  const ops = rvDiff(before, after);
  if (!ops) return {b: rvNl(before), a: rvNl(after)};
  return {
    b: rvMerge(ops.filter(o => o.t !== '+')).map(o => o.t === '-' ? `<del class="rv-del">${rvNl(o.s)}</del>` : rvNl(o.s)).join(''),
    a: rvMerge(ops.filter(o => o.t !== '-')).map(o => o.t === '+' ? `<span class="rv-add">${rvNl(o.s)}</span>` : rvNl(o.s)).join('')
  };
}

const REV_PROMPT = `아래는 [규정명]의 개정 내용입니다(신구조문대비표 또는 개정 전/후 조문). 이것을 아래 JSON 형식으로 변환해 주세요.

규칙
1. before/after에는 해당 조문 전체를 넣습니다(바뀐 항만 넣지 않습니다). 글자·조사·숫자·부호를 원문 그대로 옮기고 요약하거나 고치지 않습니다.
2. 항·호·목은 줄바꿈(\\n)으로 나누고 ①②, 1., 가. 같은 기호를 그대로 유지합니다.
3. 개정되지 않은 조문은 넣지 않습니다.
4. type은 "개정", "신설", "삭제", "전문개정" 중 하나입니다. 신설은 before를 "", 삭제는 after를 ""로 둡니다.
5. no는 조번호만 씁니다(예: "11", "11의2"). 별표는 "별표1"처럼 씁니다.
6. 이미지로만 있는 별표·서식은 text에 "[별표 제N호 이미지: 확인 필요]"라고 쓰고 note에 이유를 적습니다.
7. 글자가 불확실하면 추측하지 말고 note에 "확인 필요: …"를 적습니다.
8. 설명 없이 JSON만 코드블록으로 출력합니다.

형식
{
  "schema": "rev.v1",
  "from": "2026",
  "to": "2027",
  "changes": [
    {
      "law": "조직법",
      "no": "11",
      "title": "중앙위원회",
      "type": "개정",
      "effective": "2027-01-01",
      "before": "① …\\n② …",
      "after": "① …\\n② …",
      "note": ""
    }
  ]
}

[여기에 개정 내용을 붙여 넣기]`;

function revList(){ return ((S.rev && S.rev.changes) || []); }
renderers.rev = function(){
  const items = amendItems(), chg = revList();
  const seen = S.revSeen || {};
  let html = `<h2>개정 내용</h2>
  <div class="seg" id="rv-sub">
    <button data-sub="recent" aria-pressed="${RV.sub === 'recent'}">시행된 최근 개정 (${items.length})</button>
    <button data-sub="cmp" aria-pressed="${RV.sub === 'cmp'}">개정 전·후 비교 (${chg.length})</button>
  </div>`;
  if (RV.sub === 'recent'){
    const maxY = +items[0].latest.slice(0, 4);
    const years = {}; items.forEach(i => { const y = i.latest.slice(0, 4); years[y] = (years[y] || 0) + 1; });
    const inYear = i => RV.year === 'all' || (RV.year === 'recent' ? +i.latest.slice(0, 4) >= maxY - 1 : i.latest.slice(0, 4) === RV.year);
    const list = items.filter(i => inYear(i) && (RV.law === '전체' || i.law === RV.law));
    const done = list.filter(i => seen[revKey(i)]).length;
    html += `<p class="small mute" style="margin:10px 0 0">조문 끝의 &lt;개정 …&gt; 표시를 모아 가장 최근 개정일 순으로 보여 줍니다. 개정된 조문은 시험에 다시 나올 가능성이 높습니다.</p>
    <div class="fsc">${['전체'].concat(LAW_LIST).map(l => `<button data-law="${l}" aria-pressed="${RV.law === l}">${l}</button>`).join('')}</div>
    <div class="fsc">
      <button data-year="recent" aria-pressed="${RV.year === 'recent'}">최근 2년</button>
      ${Object.keys(years).sort().reverse().map(y => `<button data-year="${y}" aria-pressed="${RV.year === y}">${y} (${years[y]})</button>`).join('')}
      <button data-year="all" aria-pressed="${RV.year === 'all'}">전체</button>
    </div>
    <div class="row" style="margin:6px 0"><span class="small mute grow">${list.length}건 · 확인 ${done}/${list.length}</span></div>
    <div class="bar"><i style="width:${pct(done, list.length)}%"></i></div>`;
    html += list.map(it => {
      const key = revKey(it), ok = !!seen[key];
      const marked = it.lines.filter(l => l.marks.some(m => m.date === it.latest));
      const show = marked.length ? marked : it.lines;
      return `<div class="rv-item ${ok ? 'seen' : ''}">
        <div class="rv-h"><span class="law">${esc(it.law)}</span><span class="no">${esc(nl(it.no))}</span><span class="tt">${esc(it.title || '')}</span>
          <span class="rv-date">${esc(it.kinds.join('·'))} ${fmtDate(it.latest)}</span></div>
        <div style="margin-top:6px">${show.map(l => `<div class="ln rv-hl">${plainBlanks(l.h.replace(/^<div class="ln[^"]*">|<\/div>$/g, ''))}</div>`).join('')}</div>
        <details><summary class="small">조문 전체 보기</summary>${it.lines.map(l => `<div class="ln ${l.marks.some(m => m.date === it.latest) ? 'rv-hl' : ''}">${plainBlanks(l.h.replace(/^<div class="ln[^"]*">|<\/div>$/g, ''))}</div>`).join('')}</details>
        <div class="row" style="margin-top:8px">
          <button class="rc ${ok ? 'has' : ''}" data-seen="${esc(key)}">${ok ? '✓ 확인함' : '확인'}</button>
          <button class="rc" data-goart="${esc(it.law + ':' + it.no)}">원문에서 보기</button>
        </div></div>`;
    }).join('') || '<div class="note">조건에 맞는 개정이 없습니다.</div>';
  } else {
    const laws = ['전체', ...new Set(chg.map(c => c.law))];
    const list = chg.filter(c => RV.law === '전체' || c.law === RV.law);
    html += `<p class="small mute" style="margin:10px 0 0">규정이 바뀌기 전과 후를 나란히 놓고, 바뀐 낱말만 표시합니다. 바뀐 규정 자체가 주요 출제 대상입니다.</p>
    <div class="row" style="margin:10px 0">
      <button class="b-red" data-import="1">📥 개정 데이터 붙여넣기</button>
      <button class="b-line" data-prompt="1">📋 AI에게 줄 프롬프트 복사</button>
      ${chg.length ? '<button class="b-line" data-clear="1">전체 삭제</button>' : ''}
    </div>`;
    if (!chg.length){
      html += `<div class="note"><b>아직 등록된 개정 데이터가 없습니다.</b><br>
      ① <b>프롬프트 복사</b> → ② 개정 조문(신구조문대비표·txt·md)과 함께 AI에 붙여 넣기 → ③ AI가 만든 JSON을 <b>붙여넣기</b> 하면 이 화면에 전·후 비교가 만들어집니다. 같은 조문을 다시 넣으면 덮어씁니다.</div>`;
    } else {
      html += `<div class="fsc">${laws.map(l => `<button data-law="${l}" aria-pressed="${RV.law === l}">${l}</button>`).join('')}</div>
      <div class="row" style="margin:6px 0"><label class="small"><input type="checkbox" id="rv-hide" ${RV.hide ? 'checked' : ''}> 바뀐 부분 가리고 떠올리기 (눌러서 확인)</label></div>
      <div class="small mute">${list.length}건${S.rev.from || S.rev.to ? ' · ' + esc((S.rev.from || '') + ' → ' + (S.rev.to || '')) : ''}</div>`;
      html += list.map(c => {
        const d = rvBody(c);
        return `<div class="rv-item">
          <div class="rv-h"><span class="law">${esc(c.law)}</span><span class="no">${esc(nl(c.no))}</span><span class="tt">${esc(c.title || '')}</span>
            <span class="rv-date">${esc(c.type || '개정')}${c.effective ? ' ' + esc(c.effective) : ''}</span></div>
          <div class="rv-cmp ${RV.hide ? 'rv-hide' : ''}" style="margin-top:8px">
            <div class="rv-col"><h4>개정 전</h4>${d.b}</div>
            <div class="rv-col"><h4>개정 후</h4>${d.a}</div>
          </div>
          ${c.note ? `<div class="note" style="margin:8px 0 0">${esc(c.note)}</div>` : ''}
          <div class="row" style="margin-top:8px">${XA.has(c.law + ':' + c.no) ? `<button class="rc" data-goart="${esc(c.law + ':' + c.no)}">현재 원문 보기</button>` : ''}</div>
        </div>`;
      }).join('');
    }
  }
  $('#p-rev').innerHTML = html;
};
function revImport(text){
  let o; try { o = JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')); } catch(e){ return '올바른 JSON이 아닙니다. 코드블록 기호(```)나 설명 문장이 섞이지 않았는지 확인하세요.'; }
  const arr = Array.isArray(o) ? o : o && o.changes;
  if (!Array.isArray(arr) || !arr.length) return 'changes 배열이 비어 있거나 없습니다.';
  const bad = [];
  const norm = arr.map((c, i) => {
    if (!c || typeof c !== 'object' || !c.law || c.no === undefined){ bad.push(i + 1); return null; }
    return {law: String(c.law), no: String(c.no), title: String(c.title || ''), type: String(c.type || '개정'),
      effective: String(c.effective || ''), before: String(c.before || ''), after: String(c.after || ''), note: String(c.note || '')};
  }).filter(Boolean);
  if (bad.length) return `${bad.join(', ')}번째 항목에 law 또는 no가 없습니다.`;
  S.rev = S.rev || {changes: []};
  const map = new Map(S.rev.changes.map(c => [c.law + ':' + c.no + ':' + c.effective, c]));
  norm.forEach(c => map.set(c.law + ':' + c.no + ':' + c.effective, c));
  S.rev.changes = [...map.values()].sort((a, b) => (LAW_ORDER[a.law] ?? 9) - (LAW_ORDER[b.law] ?? 9) || noNum(a.no) - noNum(b.no));
  if (!Array.isArray(o)){ if (o.from) S.rev.from = String(o.from); if (o.to) S.rev.to = String(o.to); }
  S.rev.t = Date.now(); save();
  return {n: norm.length};
}
$('#p-rev').addEventListener('click', e => {
  const t = e.target;
  const sub = t.closest('[data-sub]'); if (sub){ RV.sub = sub.dataset.sub; RV.law = '전체'; renderers.rev(); return; }
  const law = t.closest('[data-law]'); if (law){ RV.law = law.dataset.law; renderers.rev(); return; }
  const yr = t.closest('[data-year]'); if (yr){ RV.year = yr.dataset.year; renderers.rev(); return; }
  const sn = t.closest('[data-seen]'); if (sn){ S.revSeen = S.revSeen || {}; const k = sn.dataset.seen; if (S.revSeen[k]) delete S.revSeen[k]; else S.revSeen[k] = 1; save(); renderers.rev(); return; }
  const ga = t.closest('[data-goart]'); if (ga){ showTab('read'); setTimeout(() => goRef('a|' + ga.dataset.goart), 60); return; }
  const bk = t.closest('.rv-add'); if (bk && bk.closest('.rv-hide')){ bk.classList.toggle('rev'); return; }
  if (t.closest('[data-prompt]')){ copyText(REV_PROMPT, '프롬프트를 복사했습니다. AI에 붙여 넣고 개정 내용을 이어 붙이세요.'); return; }
  if (t.closest('[data-import]')){
    dlg({title:'개정 데이터 붙여넣기', text:'AI가 만들어 준 JSON을 붙여 넣으세요. 같은 조문(법령·조번호·시행일)은 덮어씁니다.', area:'', okText:'등록', onOk: v => {
      const r = revImport(v); if (typeof r === 'string'){ toast(r); return false; }
      toast(r.n + '건을 등록했습니다.'); RV.sub = 'cmp'; renderers.rev();
    }}); return;
  }
  if (t.closest('[data-clear]')){
    dlg({title:'개정 데이터 전체 삭제', text:'등록한 개정 전·후 비교 데이터를 모두 지웁니다. 학습 기록은 지워지지 않습니다.', okText:'삭제', onOk: () => { S.rev = {changes: []}; save(); renderers.rev(); }});
  }
});
$('#p-rev').addEventListener('change', e => { if (e.target.id === 'rv-hide'){ RV.hide = e.target.checked; renderers.rev(); } });
