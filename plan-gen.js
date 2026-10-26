/* ═════════ 일정 이후 날짜의 목표 과제 — 스터디 일정(SCHED)에서 만든다 ═════════
   기준 페이지의 일일표(D.days)는 10/22 에서 끝난다. 그 뒤는 다음 스터디의 과목으로 날짜별 과제를 만들어 덧붙인다.
   과제 번호(d{i}.{j})가 날짜마다 고정되도록 시작일(PLAN_FROM)부터 마지막 스터디까지 항상 같은 순서로 만든다. */
(function(){
  const PLAN_FROM = '2026-10-26', last = D.days[D.days.length - 1].date;
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const steps = SCHED.filter(s => !s.edu);
  const end = steps[steps.length - 1].d;
  const lawsOf = s => { const o = schedPrep(s).out, seen = new Set(); return o.filter(x => !seen.has(x.law + x.topic) && seen.add(x.law + x.topic)); };
  for (let d = new Date(PLAN_FROM + 'T00:00:00'); ymd(d) <= end; d.setDate(d.getDate() + 1)){
    const date = ymd(d); if (date <= last) continue;
    const label = fmtD(date), edu = SCHED.find(s => s.edu && date >= s.d && date <= s.to);
    if (edu){ D.days.push({date, label, title:'인재개발원 교육 기간 · 가볍게 복습', goals:[
      {tag:'복습', t:'🕳 뻥뚫에서 정답률 낮은 조문만 다시', go:'bt', min:20}, {tag:'점검', t:'🗂 기출·오답 탭에서 오답노트 풀기', go:'exam', min:20}], tip:'교육 기간에는 분량을 줄이고 틀린 것만 반복합니다.'}); continue; }
    const s = steps.find(x => x.d >= date), k = Math.round((new Date(s.d + 'T00:00:00') - d) / 864e5);
    if (!s.n || s.prep){ D.days.push({date, label, title:s.s, goals:[
      {tag:'기출', t:'🗂 4급 기출을 원문 없이 풀고, 틀린 문항은 원문 조문 확인', go:'exam', min:60}, {tag:'정리', t:'🔬 실험실에서 학습법별 정답률 확인 → 약한 규정 고르기', go:'lab', min:10}], tip:'개인정비 주간: 약한 규정부터 되돌아가 봅니다.'}); continue; }
    const L = lawsOf(s), cur = L[(L.length - 1 - k % L.length + L.length) % L.length] || L[0];   /* 여러 규정이면 날마다 번갈아 */
    const names = L.map(x => x.l).join('·'), one = k >= 2 ? cur : null;
    const goals = [];
    if (k === 0) goals.push({tag:'점검', t:`🕳 ${names} 뻥뚫 — 정답률 낮은 조문만`, go:'bt', law:L[0].law, min:30}, {tag:'점검', t:'📊 대조·숫자 표를 가린 채 훑기', go:'table', min:20});
    else if (k === 1) goals.push({tag:'점검', t:`📖 ${names} 가리기 모드로 틀린 조문만 다시 회독`, go:'read', law:L[0].law, min:40}, {tag:'복원', t:`🕳 ${names} 뻥뚫 만점 도전`, go:'bt', law:L[0].law, min:30}, {tag:'정리', t:'🗂 오답노트에서 틀린 문항 마무리', go:'exam', min:20});
    else goals.push({tag:s.r + '회독', t:`📖 ${one.l} 원문 ${s.r}회독 — 조문을 소리 내어 읽기`, go:'read', law:one.law, min:50}, {tag:'뻥뚫', t:`🕳 ${one.l} 뻥뚫으로 빈칸 채우기`, go:'bt', law:one.law, min:30}, {tag:'기출', t:`🗂 ${one.l} 관련 기출 풀고 틀린 문항은 원문 확인`, go:'exam', min:30});
    D.days.push({date, label, title:`${s.n}차 ${one ? one.l : names} ${k === 0 ? '시험 당일' : k === 1 ? '최종 점검' : '준비'}`, goals, tip:`${s.n}차(${fmtD(s.d)}) 범위: ${esc(s.s)}`});
  }
})();
