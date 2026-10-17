
/* ═══════════════ 기출 근거 DB 연결 (kb/ → D.kb) ═══════════════
   1) 기출 풀이: 정답 공개 뒤 근거 조문(누르면 원문 패널) · 함정(원문 → 바꾼 말) · 개정 차이
   2) 회독: 기출에 나온 조문 머리에 '기출 N' 배지
   D.kb 는 build_artifact.py 가 kb/exam_kb.json 에서 줄여 넣는다. */
const KB = D.kb || {items: {}, arts: {}};
const kbArtLabel = k => { const [law, no] = k.split(':'); return law + ' ' + (no.startsWith('별표') ? no.replace('별표', '별표 ') : nl(no)); };
const kbPeekKey = k => { const [law, no] = k.split(':'); return no.startsWith('별표') ? 'b|' + law + ':' + no.replace('별표', '') : 'a|' + k; };
const KB_ST = {'확인됨': '', '일부확인': '일부 확인', '확인필요': '근거 확인 필요', '개정차이': '지금 원문과 다름'};

function kbExamBox(id){
  const r = KB.items[id]; if (!r) return '';
  const arts = (r.a || []).map(k => `<button class="kbchip" data-kbart="${esc(k)}">${esc(kbArtLabel(k))}</button>`).join('');
  const trapHtml = t => !t[0] ? `<span class="kbtag">끼워 넣음</span> <span class="kbalt">${esc(t[1])}</span>`
    : !t[1] ? `<span class="kbtag">빠뜨림</span> <span class="kbo">${esc(t[0])}</span>`
    : `<span class="kbo">${esc(t[0])}</span><span class="kbarrow">→</span><span class="kbalt">${esc(t[1])}</span>`;
  const traps = (r.t || []).map(t => `<li>${trapHtml(t)}<span class="mute small"> ${esc(t[2] || '')}</span></li>`).join('');
  return `<div class="kbx">
    <div class="kbx-h"><span class="kbx-t">기출 근거</span><span class="kbtag">${esc(r.f)}</span><span class="kbtag">난이도 ${r.lv}</span>${r.c ? '<span class="kbtag">사례</span>' : ''}${KB_ST[r.st] ? `<span class="kbtag warn">${esc(KB_ST[r.st])}</span>` : ''}</div>
    ${arts ? `<div class="kbx-row"><span class="kbx-l">근거 조문</span><div class="kbchips">${arts}</div></div>` : ''}
    ${traps ? `<div class="kbx-row"><span class="kbx-l">함정<br><small>원문 → 보기</small></span><ul class="kbtraps">${traps}</ul></div>` : ''}
    ${r.n ? `<p class="kbnote">${esc(r.n)}</p>` : ''}
  </div>`;
}
if (typeof drawX === 'function'){
  const _drawX = drawX;
  drawX = function(){
    _drawX.apply(this, arguments);
    const e = X.queue && X.queue[X.i], ex = $('#p-exam .xex');
    if (e && ex && KB.items[e.id]){
      ex.insertAdjacentHTML('afterend', kbExamBox(e.id));
      if (/자료 해설 오류/.test(KB.items[e.id].n || '')){   // 원문과 다른 자료 해설은 표시만 남기고 경고
        ex.classList.add('kbbad');
        ex.insertAdjacentHTML('afterbegin', '<span class="kbtag warn">이 해설은 원문과 다름 · 아래 기출 근거를 보세요</span><br>');
      }
    }
  };
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-kbart]'); if (!b) return;
  if (typeof openPeek === 'function') openPeek(kbPeekKey(b.dataset.kbart));
});
/* 회독: 기출에 나온 조문 표시 */
function kbBadges(root){
  (root.matches && root.matches('.art[id^="a-"]') ? [root] : root.querySelectorAll ? root.querySelectorAll('.art[id^="a-"]') : []).forEach(el => {
    if (el.dataset.kb) return; el.dataset.kb = '1';
    const a = KB.arts[el.id.slice(2)], h = el.querySelector('.art-h'); if (!a || !h) return;
    const sp = h.querySelector('.sp, .rc');
    const tag = document.createElement('span'); tag.className = 'kbb'; tag.textContent = '기출 ' + a.n;
    tag.title = a.y.join(', ') + '년 기출'; tag.setAttribute('aria-label', `기출 ${a.n}번 출제 (${a.y.join(', ')}년)`);
    sp ? h.insertBefore(tag, sp) : h.appendChild(tag);
  });
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && kbBadges(n)))).observe(document.body, {childList: true, subtree: true});
