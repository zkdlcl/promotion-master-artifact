
/* ═════ 복습 카드: 스터디 일정의 '1회독 차수'를 한 단위로 (2회독 이후는 같은 과목의 반복이라 따로 세지 않는다) ═════ */
const CARD_UNITS = D.cardUnits || {};                    /* 새 주제 번호 → 차수 (예: 21 → 4) */
/* 주제 이름표: 예전 '1주차·운2', '10순위' 같은 표기 대신 지금 일정의 차수로 */
const _tl = tl;
tl = t => CARD_UNITS[t] ? CARD_UNITS[t] + '차' : (+t >= 11 && +t <= 16 ? '2차' : +t >= 17 && +t <= 19 ? '3차' : _tl(t));
const topicShort = t => String(D.topics[t] || '').replace(/^운영규정\s*/, '');
/* 묶음 이름도 같은 차수 표기로 */
GR('g1').label = '📚 1차 · 조직법·정관 (10/8)';
GR('g2').label = '🗓 2차 · 운영규정 1~5장 (10/16)';
GR('g3').label = '🗓 3차 · 운영규정 6~7장 (10/22)';
GROUPS.push(
  {id:'g4', label:'🗓 4차 · 인사관리시행규칙 (10/29)', topics:[21]},
  {id:'g5', label:'🗓 5차 · 보수운영규정 (11/5)', topics:[22]},
  {id:'g6', label:'🗓 6차 · 재무·여비·감사 (11/12)', topics:[23, 24, 25]},
  {id:'g7', label:'🗓 7차 · 국제인도법 (11/19)', topics:[26]},
  {id:'g8', label:'🗓 8차 · 국제적십자규약 (12/3)', topics:[27]}
);
/* 처음 열면 '다음 스터디 시험'의 묶음을 고른다 (9차 이후는 같은 과목 반복이므로 전체) */
curGroup = function(){
  if (Q.group === null){
    const nx = SCHED.find(s => s.n && !s.prep && s.d >= todayKey());
    const gid = nx && nx.n <= 8 ? 'g' + nx.n : 'all';
    Q.group = GR(gid) ? gid : 'all';
  }
  return Q.group === 'all' ? null : GR(Q.group);
};
