
/* ═══════════════ ui7 · 디자인 층 ═══════════════
   1) 이모지 → 선 아이콘(Lucide 모양, MIT)  2) 드롭다운 → 칩  3) 테마 전환(원형으로 퍼지는 전환)  4) 머리줄 브랜드
   기능 코드는 건드리지 않고, 화면에 그려진 뒤 모양만 바꾼다. */
const UI7 = (() => {
  const P = {
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    blank: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 12h.01M12 12h.01M17 12h.01"/>',
    cards: '<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
    exam: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    diff: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v6M9 14h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V7M18 17v-8"/>',
    flask: '<path d="M10 2v7.5L4.5 19A2 2 0 0 0 6.3 22h11.4a2 2 0 0 0 1.8-3L14 9.5V2"/><path d="M8.5 2h7M7 16h10"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a10 10 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bookx: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9.5 7.5 5 5M14.5 7.5l-5 5"/>',
    books: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    ok: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    no: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    hour: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    pin: '<path d="M12 17v5M9 10.8V5h6v5.8l2 3.2H7z"/><path d="M8 2h8"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2.7 9 2.7 12 0v-5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z"/>',
    list: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    tap: '<path d="M9 11V6a2 2 0 0 1 4 0v5"/><path d="M13 10.5V9a2 2 0 0 1 4 0v3.5M17 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-1a8 8 0 0 1-6.3-3L3 15.5a2 2 0 0 1 3-2.6L9 15"/>',
    alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    minus: '<path d="M5 12h14"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  };
  const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  // 이모지 → 아이콘 (답 표시 기호 ◯ ✕ ✓ 와 화살표는 글자 그대로 둔다)
  const MAP = {
    '🎯':'target','📖':'book','🕳':'blank','🧠':'cards','🗂':'exam','🆕':'diff','🔍':'search','📊':'chart','🔬':'flask','🧪':'flask',
    '💬':'chat','🔤':'type','👁':'eye','🙈':'eyeoff','📝':'pen','✏':'pen','✍':'pen','🗓':'cal','📅':'cal','📕':'bookx','📚':'books',
    '▶':'play','✅':'ok','❌':'no','☁':'cloud','⚠':'alert','👏':'ok','⏳':'hour','💡':'bulb','🧑':'user','📌':'pin','📈':'trend',
    '🏷':'tag','🎓':'cap','📥':'inbox','📋':'list','🔢':'hash','👆':'tap','⏰':'alarm','🤝':'users','➖':'minus','↩':'undo',
  };
  const DOT = {'🔴':'var(--red)','🟢':'#30a46c','🟡':'#f5d90a'};
  const keys = Object.keys(MAP).concat(Object.keys(DOT)).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const RX = new RegExp('(' + keys.join('|') + ')\\uFE0F?\\s?', 'g');
  const TEST = new RegExp(keys.join('|'));
  const SKIP = '.art,.q,.ans,.xq,.xex,.fr2-q,.fr2-b,.bt-art,.rv-col,.rv-hl,.pk-body,textarea,input,select,option,pre,script,style,svg,.ic,code,#theme,.hd h1';
  const iconHTML = ch => DOT[ch] ? `<i class="ic dot" style="--c:${DOT[ch]}"></i>`
    : `<i class="ic ic-${MAP[ch]}">${svg(MAP[ch])}</i>`;
  const esc = s => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  function iconText(t){
    const s = t.nodeValue;
    if (!TEST.test(s)) return;
    const span = document.createElement('span');
    span.innerHTML = esc(s).replace(RX, (m, ch) => iconHTML(ch));
    t.replaceWith(...span.childNodes);
  }
  function iconize(root){
    if (root.nodeType === 3){ if (root.parentElement && !root.parentElement.closest(SKIP)) iconText(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeType === 1 ? (n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP)
        : (TEST.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)});
    const hits = []; while (w.nextNode()) hits.push(w.currentNode);
    hits.forEach(iconText);
  }

  /* ── 드롭다운 → 칩 ── */
  const CSEL = new Set();
  const optLabel = o => o.textContent.replace(/\s+/g, ' ').trim();
  function chipify(sel){
    if (sel.dataset.csel || sel.multiple || sel.closest('.dlg,.ov,#pk') || !sel.closest('main')) return;
    if (getComputedStyle(sel).display === 'none') return;
    const n = sel.options.length; if (n < 2 || n > 16) return;
    sel.dataset.csel = '1';
    const box = document.createElement('div');
    box.className = 'csel' + ([...sel.options].some(o => optLabel(o).length > 16) ? ' wide' : '');
    box.setAttribute('role', 'radiogroup');
    if (sel.getAttribute('aria-label')) box.setAttribute('aria-label', sel.getAttribute('aria-label'));
    box.innerHTML = [...sel.options].map((o, i) => `<button type="button" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${esc(optLabel(o))}</button>`).join('');
    box.onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const o = sel.options[+b.dataset.i]; if (!o || sel.value === o.value) return;
      sel.value = o.value;
      sel.dispatchEvent(new Event('input', {bubbles:true}));
      sel.dispatchEvent(new Event('change', {bubbles:true}));
      sync(sel);
    };
    sel._csel = box; sel.after(box); sel.classList.add('csel-src');
    sel.addEventListener('change', () => sync(sel));
    CSEL.add(sel); sync(sel); iconize(box);
  }
  function sync(sel){
    const box = sel._csel; if (!box) return;
    if (box.children.length !== sel.options.length){ box.remove(); delete sel.dataset.csel; sel.classList.remove('csel-src'); CSEL.delete(sel); chipify(sel); return; }
    [...box.children].forEach((b, i) => b.setAttribute('aria-pressed', sel.selectedIndex === i));
  }

  /* ── 테마 ── */
  const root = document.documentElement;
  const dark = () => (root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  function themeIcon(){
    const b = document.getElementById('theme'); if (!b) return;
    const want = dark() ? 'sun' : 'moon';
    if (b.dataset.ic !== want){ b.dataset.ic = want; b.innerHTML = `<i class="ic">${svg(want)}</i>`; }
    b.setAttribute('aria-label', dark() ? '밝은 화면으로' : '어두운 화면으로'); b.title = b.getAttribute('aria-label');
  }
  function toggleTheme(){
    const btn = document.getElementById('theme');
    const next = dark() ? 'light' : 'dark';
    const apply = () => { S.theme = next; root.dataset.theme = next; save(); themeIcon(); };
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(apply);
    t.ready.then(() => root.animate({clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`]},
      {duration: 480, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)'})).catch(() => {});
  }

  function brand(){
    const h = document.querySelector('.hd h1'); if (!h || h.dataset.ui7) return;
    h.dataset.ui7 = '1';
    // 적십자 표장: 흰 바탕에 같은 크기 정사각형 5개로 된 빨간 십자 (Pantone 485)
    h.innerHTML = '<span class="brand" aria-hidden="true"><svg viewBox="0 0 30 30"><path d="M11 3h8v8h8v8h-8v8h-8v-8H3v-8h8z"/></svg></span><span class="ht">승진고시 마스터</span>';
  }

  /* ── 화면이 바뀔 때마다 ── */
  let queue = [], raf = 0;
  function flush(){
    raf = 0;
    const nodes = queue; queue = [];
    for (const n of nodes){
      if (!n.isConnected) continue;
      iconize(n);
      if (n.nodeType === 1) (n.matches('select') ? [n] : n.querySelectorAll('select')).forEach(chipify);
    }
    CSEL.forEach(s => s.isConnected ? sync(s) : CSEL.delete(s));
    themeIcon();
  }
  function start(){
    brand(); themeIcon();
    const tb = document.getElementById('theme'); if (tb) tb.onclick = toggleTheme;
    queue.push(document.body); flush();
    new MutationObserver(ms => {
      for (const m of ms) m.addedNodes.forEach(n => queue.push(n));
      if (!raf && queue.length) raf = requestAnimationFrame(flush);
    }).observe(document.body, {childList: true, subtree: true});
    new MutationObserver(themeIcon).observe(root, {attributes: true, attributeFilter: ['data-theme']});
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', themeIcon);
  }
  return {start, iconize, chipify, svg};
})();
