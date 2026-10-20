/* 복습 카드는 고정 과목 범위로 선택한다. 스터디 차수·날짜는 추천 안내에만 사용한다. */
const REVIEW_GROUPS = [
  {...GR('g1'),label:'조직법·정관'},
  {...GR('g1a'),label:'조직법'},
  {...GR('g1b'),label:'정관'},
  {...GR('g2'),label:'운영규정 1~5장'},
  {...GR('g3'),label:'운영규정 6~7장'},
  {...GR('g4'),label:'인사관리시행규칙'},
  {...GR('g5'),label:'보수운영규정'},
  {...GR('g6'),label:'재무·여비·감사'},
  {id:'g6a',label:'재무규정',topics:[23],law:'재무규정'},
  {id:'g6b',label:'여비규정',topics:[24],law:'여비규정'},
  {id:'g6c',label:'감사운영규정',topics:[25],law:'감사운영규정'},
  {...GR('g7'),label:'국제인도법'},
  {...GR('g8'),label:'국제적십자규약'}
];
function nextReviewScope(){
  const next=SCHED.find(s=>s.n&&!s.prep&&s.d>=todayKey());
  if(!next)return null;
  const named={조직법:'g1a',정관:'g1b',인사관리시행규칙:'g4',보수운영규정:'g5',재무규정:'g6a',여비규정:'g6b',감사운영규정:'g6c',국제인도법:'g7',국제적십자규약:'g8'};
  const parts=schedPrep(next).out.flatMap(p=>{
    if(p.law==='운영규정')return p.topic==='g2'?[REVIEW_GROUPS.find(g=>g.id==='g2')]:p.topic==='g3'?[REVIEW_GROUPS.find(g=>g.id==='g3')]:REVIEW_GROUPS.filter(g=>g.id==='g2'||g.id==='g3');
    const group=REVIEW_GROUPS.find(g=>g.id===named[p.law]);return group?[group]:[];
  });
  if(!parts.length)return null;
  return {id:'next',label:'다음 스터디 범위',topics:[...new Set(parts.flatMap(g=>g.topics))],parts,next};
}
function cardGroups(){const next=nextReviewScope();return next?[next,...REVIEW_GROUPS]:REVIEW_GROUPS;}
curGroup=function(){
  if(Q.group===null)Q.group=nextReviewScope()?'next':'all';
  if(Q.group==='all')return null;
  const group=cardGroups().find(g=>g.id===Q.group);
  if(group)return group;
  Q.group='all';return null;
};
inGroup=function(c,g){
  if(g===undefined)g=curGroup();
  if(!g)return true;
  if(g.parts)return g.parts.some(part=>inGroup(c,part));
  return g.topics.includes(c.t)&&(!g.law||cardArts(c).some(k=>k.startsWith(g.law+':'))||c.src.includes(g.law));
};
const _drawReviewHome=drawQuizHome;
drawQuizHome=function(){
  _drawReviewHome();
  const select=document.getElementById('q-group');if(!select)return;
  select.setAttribute('aria-label','복습 과목');
  const card=select.closest('.card'),heading=card.querySelector('b');
  if(heading)heading.textContent='복습할 과목을 골라주세요';
  const next=nextReviewScope(),note=document.createElement('div');note.className='review-guide';
  note.innerHTML=next?`<span class="small mute">다음 스터디 · ${next.next.n}차 · ${esc(fmtD(next.next.d))}</span><b>${esc(next.next.k)}</b><span class="small mute">과목별 범위는 회독이 바뀌어도 그대로 사용할 수 있습니다.</span>`:'<b>자율 복습</b><span class="small mute">등록된 스터디 일정이 끝났습니다. 전체·과목별 범위에서 복습을 계속하세요.</span>';
  select.parentElement.before(note);
  const detail=card.querySelector('details'),hint=document.createElement('p');hint.className='small mute review-overlap';
  hint.textContent='여러 과목을 함께 묻는 카드는 각 과목에 함께 표시됩니다.';
  if(detail)detail.before(hint);
};

/* ── 회독 +1 등으로 본문을 다시 그려도, 눌러서 열어 둔 빈칸(정답 확인)은 그대로 둔다.
   같은 규정·같은 가리기 단계일 때만 되살린다 (단계가 바뀌면 빈칸 자리가 달라지므로). ── */
function rdRevKeys(){
  const body = $('#r-body'); if (!body) return null;
  const keys = new Set(), cnt = {};
  $$('.b', body).forEach(b => {
    const a = b.closest('.art'), k = a ? a.id : '_x';
    const i = cnt[k] = (cnt[k] || 0) + 1;
    if (b.classList.contains('rev')) keys.add(k + '#' + i);
  });
  return keys;
}
function rdRevApply(keys){
  const body = $('#r-body'); if (!body || !keys || !keys.size) return;
  const cnt = {};
  $$('.b', body).forEach(b => {
    const a = b.closest('.art'), k = a ? a.id : '_x';
    const i = cnt[k] = (cnt[k] || 0) + 1;
    if (keys.has(k + '#' + i)) b.classList.add('rev');
  });
}
const _drawReadRev = drawRead;
drawRead = function(keepScroll){
  const sig = R.law + '|' + R.topic + '|' + R.mode;
  const keys = drawRead._sig === sig ? rdRevKeys() : null;
  _drawReadRev(keepScroll);
  drawRead._sig = sig;
  rdRevApply(keys);
};
