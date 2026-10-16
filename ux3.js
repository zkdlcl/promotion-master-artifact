
/* ═════════ 스터디 일정 (25차 · 2027-04-08까지) ═════════ */
const SFMT = {1:'OX 5 · 객관식 5', 2:'OX 5 · 객관식 2 · 주관식 3', 3:'OX 5 · 객관식 2 · 주관식 3', 4:'OX 5 · 객관식 2 · 주관식 3', 5:'OX 6 · 객관식 2 · 주관식 2'};
const SCHED = [
  {n:1,  d:'2026-10-08', r:1, k:'조직법·정관', s:'조직법, 정관'},
  {n:2,  d:'2026-10-16', r:1, k:'운영규정 1~5장', s:'직원 운영규정 (제1장~제5장)', red:1},
  {n:3,  d:'2026-10-22', r:1, k:'운영규정 6~7장', s:'직원 운영규정 (제6장~제7장)'},
  {n:4,  d:'2026-10-29', r:1, k:'인사관리 시행규칙', s:'인사관리 시행규칙'},
  {n:5,  d:'2026-11-05', r:1, k:'보수 운영규정', s:'보수 운영규정'},
  {n:6,  d:'2026-11-12', r:1, k:'재무·여비·감사', s:'재무·여비·감사 운영규정'},
  {n:7,  d:'2026-11-19', r:1, k:'국제인도법', s:'국제인도법 질문과 답변'},
  {edu:1, d:'2026-11-23', to:'2026-11-27', r:1, s:'인재개발원 교육 (11.23. ~ 11.27.)'},
  {n:8,  d:'2026-12-03', r:1, k:'국제적십자운동 규약', s:'국제적십자운동 규약'},
  {n:9,  d:'2026-12-10', r:2, k:'조직법·정관', s:'조직법, 정관'},
  {n:10, d:'2026-12-17', r:2, k:'운영규정·인사규칙', s:'직원 운영규정, 인사관리 시행규칙'},
  {n:11, d:'2026-12-23', r:2, k:'보수 운영규정', s:'보수 운영규정', red:1},
  {n:12, d:'2026-12-30', r:2, k:'재무·여비·감사', s:'재무·여비·감사 운영규정', red:1},
  {n:13, d:'2027-01-07', r:2, k:'국제인도법·규약', s:'국제인도법 질문과 답변, 국제적십자운동 규약'},
  {n:14, d:'2027-01-14', r:2, k:'개인정비', s:'개인정비 / 4급 기출 풀이 (21~26)', prep:1},
  {n:15, d:'2027-01-21', r:3, k:'조직·정관·재무·여비·감사', s:'조직법, 정관, 재무, 여비, 감사'},
  {n:16, d:'2027-01-28', r:3, k:'운영규정·인사·보수', s:'직원 운영규정, 인사관리 시행규칙, 보수 운영규정'},
  {n:17, d:'2027-02-04', r:3, k:'국제인도법·규약', s:'국제인도법 질문과 답변, 국제적십자운동 규약'},
  {n:18, d:'2027-02-18', r:3, k:'개인정비', s:'개인정비 / 필요 시 4급 기출 추가 풀이', red:1, prep:1},
  {n:19, d:'2027-02-25', r:4, k:'조직·정관·재무·여비·감사', s:'조직법, 정관, 재무, 여비, 감사'},
  {n:20, d:'2027-03-04', r:4, k:'운영규정·인사·보수', s:'직원 운영규정, 인사관리 시행규칙, 보수 운영규정'},
  {n:21, d:'2027-03-11', r:4, k:'국제인도법·규약', s:'국제인도법 질문과 답변, 국제적십자운동 규약'},
  {n:22, d:'2027-03-18', r:4, k:'개인정비', s:'개인정비 / 필요 시 4급 기출 추가 풀이', prep:1},
  {n:23, d:'2027-03-25', r:5, k:'조직·정관·재무·여비·감사', s:'조직법, 정관, 재무, 여비, 감사'},
  {n:24, d:'2027-04-01', r:5, k:'운영규정·인사·보수', s:'직원 운영규정, 인사관리 시행규칙, 보수 운영규정'},
  {n:25, d:'2027-04-08', r:5, k:'국제인도법·규약', s:'국제인도법 질문과 답변, 국제적십자운동 규약'}
];
const daysTo = d => Math.round((new Date(d + 'T00:00:00') - new Date(todayKey() + 'T00:00:00')) / 864e5);
const fmtD = d => { const x = new Date(d + 'T00:00:00'); return (x.getMonth() + 1) + '/' + x.getDate() + '(' + '일월화수목금토'[x.getDay()] + ')'; };
examList = function(){
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return SCHED.filter(s => s.n && !s.prep).map(s => ({date:s.d, label:s.n + '차 ' + s.k, scope:SFMT[s.r], n:Math.round((new Date(s.d + 'T00:00:00') - now) / 864e5)}));
};
(function(){ const ex = examList(), nx = ex.find(e => e.n >= 0) || ex[ex.length - 1]; $('#dday').textContent = fmtDD(nx.n) + ' · ' + nx.label; })();
/* 과목 → 이 앱에 들어 있는 규정으로 연결 (없는 과목은 따로 안내) */
function schedPrep(s){
  const out = [], miss = [];
  s.s.split(/,\s*/).forEach(x => {
    if (x.startsWith('조직법')) out.push({law:'조직법', topic:'0', l:'조직법'});
    else if (x.startsWith('정관')) out.push({law:'정관', topic:'0', l:'정관'});
    else if (/^직원\s*운영규정/.test(x)){
      const g = /제6장/.test(x) ? 'g3' : /제1장/.test(x) ? 'g2' : '0';
      out.push({law:'운영규정', topic:g, l: g === 'g3' ? '운영규정 6~7장' : g === 'g2' ? '운영규정 1~5장' : '운영규정'});
    } else {
      const t = x.replace(/\s+/g, '');
      const hit = /^재무·여비·감사/.test(t) ? ['재무규정', '여비규정', '감사운영규정'] : /^인사관리시행규칙/.test(t) ? ['인사관리시행규칙'] : /^보수운영규정/.test(t) ? ['보수운영규정']
        : t === '재무' ? ['재무규정'] : t === '여비' ? ['여비규정'] : t === '감사' ? ['감사운영규정'] : /^국제인도법/.test(t) ? ['국제인도법'] : /^국제적십자운동규약/.test(t) ? ['국제적십자규약'] : null;
      if (hit) hit.forEach(l => out.push({law:l, topic:'0', l}));
      else miss.push(x.replace(/\s*\(.*$/, ''));
    }
  });
  return {out, miss};
}
const _todayEnh = todayEnhance;
todayEnhance = function(){ _todayEnh(); try { schedEnhance(); } catch(e){ console.warn(e); } };
function schedEnhance(){
  const p = $('#p-today'), t = todayKey();
  $$('#p-today > .card').forEach(c => { if (c.textContent.includes('📅 시험 일정')) c.remove(); });
  const cho = p.querySelector('[data-go="cho"]'); if (cho) cho.remove();
  const nxt = SCHED.find(s => s.n && !s.prep && s.d >= t);
  const after = nxt ? SCHED.filter(s => s.d >= t && s !== nxt).slice(0, 3) : [];
  const pr = nxt ? schedPrep(nxt) : null;
  const row = s => `<div class="exrow ${s.d < t ? 'past' : ''}"><span class="dd ${s.red ? 'chg' : ''}">${fmtDD(daysTo(s.d))}</span><span class="nm grow">${s.n ? s.n + '차 ' : ''}${esc(s.s)}</span><span class="mute small">${fmtD(s.d)}${s.to ? '~' + fmtD(s.to) : ''}</span></div>`;
  const rounds = [1, 2, 3, 4, 5].map(r => `<div class="sch-rh">${r}회독 · ${SFMT[r]}</div>${SCHED.filter(s => s.r === r).map(row).join('')}`).join('');
  const html = `<div class="card sch"><b>📅 다음 스터디 시험</b>
    ${nxt ? `<div class="sch-n"><span class="sch-dd">${fmtDD(daysTo(nxt.d))}</span><div class="grow"><b>${nxt.n}차 · ${nxt.r}회독</b> <span class="mute small">${fmtD(nxt.d)}</span>
      <div>${esc(nxt.s)}</div><div class="small mute">출제 ${SFMT[nxt.r]}</div></div></div>
      <div class="row">${pr.out.map(o => `<button class="rc" data-prep="read" data-law="${o.law}" data-topic="${o.topic}">📖 ${esc(o.l)} 회독</button><button class="rc" data-prep="bt" data-law="${o.law}" data-topic="${o.topic}">🕳 ${esc(o.l)} 뻥뚫</button>`).join('')}</div>
      ${pr.out.length ? `<div class="row" style="margin-top:6px"><button class="rc" data-prep="quiz" data-laws="${esc([...new Set(pr.out.map(o => o.law))].join(','))}">📝 기출·문제 풀기 (${lawQuizCount([...new Set(pr.out.map(o => o.law))])})</button></div>` : ''}
      ${pr.miss.length ? `<p class="small mute" style="margin:8px 0 0">📚 앱에 아직 자료가 없는 과목: ${esc(pr.miss.join(', '))}</p>` : ''}`
    : '<p class="small mute" style="margin:6px 0 0">예정된 시험이 모두 끝났습니다. 이후는 오답 풀이입니다.</p>'}
    ${after.length ? `<div style="margin-top:8px">${after.map(row).join('')}</div>` : ''}
    <details style="margin-top:8px"><summary>전체 일정 보기 (25차 · 2027.4.8까지)</summary>${rounds}
      <p class="small mute" style="margin:8px 0 0">빨간 날짜는 원본 일정표에서 빨간색으로 표시된 날짜입니다. 5회독 이후는 오답 풀이 등입니다.</p></details></div>`;
  p.insertAdjacentHTML('afterbegin', html);
}
$('#p-today').addEventListener('click', e => {
  const b = e.target.closest('[data-prep]'); if (!b) return;
  const {law, topic, prep} = b.dataset;
  if (prep === 'quiz'){ showTab('exam'); startLawQuiz(b.dataset.laws.split(',')); }
  else if (prep === 'bt'){ BT.law = law; BT.topic = topic; BT.sess = false; btPrefs(); showTab('bt'); }
  else { R.law = law; R.topic = topic; saveRd(); showTab('read'); setTimeout(() => { drawRead(); window.scrollTo(0, 0); resumeRead(false); }, 60); }
});
