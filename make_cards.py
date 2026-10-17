"""새 규정 7종의 복습 카드를 조문의 빈칸(b1/b2)에서 자동으로 만든다.
 - 한 조문에서 최대 K장: 숫자·기한이 든 빈칸을 우선, 그다음 기관·직위, 마지막으로 동사.
 - 카드 형식은 기존 D.cards 와 같다: {id, t(주제 번호), q, a, src, alt[]}
 - 주제 번호(t)는 스터디 일정의 1회독 차수 단위로 잡는다 (2회독 이후는 같은 단위를 반복하므로 따로 세지 않음).
 - 카드 id 는 (파일, 조문, 줄, 빈칸 번호)로 정해지므로 다시 만들어도 같은 카드는 같은 id 다 → 학습 기록이 유지된다.
실행: python -X utf8 make_cards.py                       → site/cards_new.json
      python -X utf8 make_cards.py --progress 기록.json   → 빠지는 카드에 학습 기록이 있으면 멈춘다
                                                          (기록.json = 아티팩트 DB state/progress 를 내려받은 파일)

걸러내는 규칙 (2026-10 검수에서 찾은 문제):
 1. 찍기 카드: 정답이 흔한 직위·동사(회장, 기관장, 승인 …)인데 문장이 짧거나 "따로 정한다" 꼴이면 카드로 쓰지 않는다.
 2. 괄호 안 빈칸: 빈칸이 ( … ) 안에 있으면 쓰지 않는다. 괄호 속 보충 설명은 외울 거리가 아니고 문장도 어색해진다.
 3. 정답 노출: 같은 정답 낱말이 질문의 다른 곳에 그대로 있으면 쓰지 않는다.
 4. 긴 문장 자르기: 빈칸 위치를 표식으로 잡고 그 주변만 남긴다 (예전에는 빈칸을 못 찾아 빈칸 없는 카드 9장이 생겼음).
 마지막에 check() 가 모든 카드를 다시 검사하고, 하나라도 어기면 파일을 쓰지 않고 멈춘다.
"""
import json, re, os, sys, html as H, hashlib

SP = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SP, 'site', 'cards_new.json')
# (파일 id, 규정 이름, 주제 번호, 차수, 조문당 최대 카드 수)
LAWS = [
    ('personnel', '인사관리시행규칙', 21, 4, 3),
    ('compensation', '보수운영규정', 22, 5, 3),
    ('finance', '재무규정', 23, 6, 3),
    ('travel', '여비규정', 24, 6, 3),
    ('audit', '감사운영규정', 25, 6, 3),
    ('ihl', '국제인도법', 26, 7, 2),
    ('covenant', '국제적십자규약', 27, 8, 3),
]
TOPIC_NAMES = {21: '인사관리시행규칙', 22: '보수운영규정', 23: '재무규정', 24: '여비규정', 25: '감사운영규정', 26: '국제인도법', 27: '국제적십자규약'}
LINE = re.compile(r'<div class="(ln[^"]*)">(.*?)</div>', re.S)
BLANK = re.compile(r'<span class="b (b1|b2)">(.*?)</span>', re.S)
AMEND = re.compile(r'<span class="amend">.*?</span>', re.S)
TAGS = re.compile(r'<[^>]+>')
SKIP_B2 = {'보고', '결정', '제출', '통보', '통지', '신고', '확정'}   # 너무 흔해서 카드 질문으로는 모호한 동사
# 규칙 1: 이 정답들은 문장이 충분히 구체적일 때만 카드로 쓴다
GENERIC = {'회장', '기관장', '소속기관장', '사무총장', '부회장', '지사회장', '위원장', '승인', '동의', '허가', '인가', '임명', '위촉', '선출', '인준', '의결', '심의', '협의', '해임', '면직'}
GENERIC_MIN = 70          # 머리말(【…】)을 뺀 문장 글자 수가 이보다 짧으면 찍기 카드로 본다
GENERIC_VAGUE = re.compile(r'따로\s*정|별도로\s*정|정하는\s*바')
MARK = ''           # 문장 안 빈칸 위치 표식 (자르기 뒤에 Q 로 바꾼다)
Q = '( ? )'     # 카드에 보이는 빈칸. 줄바꿈 없는 공백이라 폰 화면에서 "(" 와 "? )" 로 갈라지지 않는다
MAX_LEN = 230             # 문장이 이보다 길면 빈칸 주변만 남긴다
nl = lambda no: ('제' + (no.replace('의', '조의') if '의' in no else no + '조')) if re.match(r'^\d+(의\d+)?$', no) else no


def plain(inner, mark):
    """줄 HTML → 문장. mark 번째 빈칸만 MARK, 나머지 빈칸은 원문 그대로."""
    out, pos, k = [], 0, -1
    inner = AMEND.sub('', inner)
    for m in BLANK.finditer(inner):
        k += 1
        out.append(inner[pos:m.start()])
        out.append(MARK if k == mark else m.group(2))
        pos = m.end()
    out.append(inner[pos:])
    t = H.unescape(TAGS.sub('', ''.join(out)))
    return re.sub(r'\s+', ' ', t).strip()


def in_parens(sent):
    """빈칸 표식이 괄호 ( ) 안에 있는가 (규칙 2)."""
    depth = 0
    for ch in sent[:sent.index(MARK)]:
        if ch == '(':
            depth += 1
        elif ch == ')' and depth:
            depth -= 1
    return depth > 0


def leaks(text, a):
    """정답이 빈칸 말고 질문(머리말 포함) 다른 곳에 보이는가 (규칙 3).
    '회장' 이 '부회장' 안에 든 것, '1년' 이 '11년' 안에 든 것은 노출로 보지 않는다.
    숫자 정답은 숫자만 같아도 노출로 본다 (제목 '마르텐스 조항(1899)' → 정답 1899년)."""
    rest = text.replace(MARK, ' ')
    if re.search(r'(?<![가-힣\d])' + re.escape(a), rest): return True
    num = re.match(r'\d[\d,]*', a)
    return bool(num and len(num.group(0)) >= 3 and re.search(r'(?<!\d)' + re.escape(num.group(0)) + r'(?!\d)', rest))


def alts(a):
    s = set()
    one = re.fullmatch(r'\D*?(\d[\d,]*)\D*', a)
    if one and one.group(1) != a: s.add(one.group(1).replace(',', ''))
    core = re.sub(r'\s*(이상|이하|미만|초과|이내|이전|이후|까지|부터|마다)$', '', a)
    if core and core != a: s.add(core)
    m = re.match(r'^(\d+)분의\s*(\d+)', a)
    if m: s.add(f'{m.group(2)}/{m.group(1)}')
    return sorted(s - {a})[:3]


def sentence(lines, li, bi):
    """카드 문장. 호·목 줄이면 위 항의 첫머리를 맥락으로 붙이고, 길면 빈칸 주변만 남긴다 (규칙 4)."""
    sent = plain(lines[li][1], bi)
    if lines[li][0] != 'ln' and li > 0:
        for pj in range(li - 1, -1, -1):
            if lines[pj][0] == 'ln':
                lead = plain(lines[pj][1], -1)
                cut = lead[:42]
                if cut.count('(') > cut.count(')'):   # 자른 자리에 괄호가 열린 채 남지 않게
                    cut = cut[:cut.rindex('(')].rstrip()
                sent = cut + ('…' if len(lead) > len(cut) else '') + ' ' + sent
                break
    if len(sent) > MAX_LEN:
        i = sent.index(MARK); lo = max(0, i - 105); hi = min(len(sent), i + 125)
        sent = ('…' if lo else '') + sent[lo:hi] + ('…' if hi < len(sent) else '')
    return sent


def why_not(sent, txt, head=''):
    """이 빈칸을 카드로 쓰지 않을 이유. 괜찮으면 None. head 는 질문 머리말(규정·조문·제목)."""
    if len(re.sub(r'[\s(?)' + MARK + ']', '', sent)) < 10: return '문장 짧음'
    if in_parens(sent): return '괄호 안 빈칸'
    if leaks(head + ' ' + sent, txt): return '정답 노출'
    if txt in GENERIC and (len(sent) < GENERIC_MIN or GENERIC_VAGUE.search(sent)): return '찍기 카드'
    return None


def make(fid, law, topic, K, skipped):
    d = json.load(open(os.path.join(SP, 'site', 'data', 'laws', fid + '.json'), encoding='utf8'))
    cards = []
    for art in d['articles']:
        if art['type'] != 'a':
            continue
        lines = LINE.findall(art['html'])
        cands = []  # (-우선순위, 줄 번호, 빈칸 번호, 정답)
        for li, (cls, inner) in enumerate(lines):
            for bi, m in enumerate(BLANK.finditer(inner)):
                kind, txt = m.group(1), H.unescape(TAGS.sub('', m.group(2))).strip()
                if len(txt) < 2 or len(txt) > 16: continue
                if kind == 'b2' and txt in SKIP_B2: continue
                score = 3 if re.search(r'\d', txt) else (2 if kind == 'b1' else 1)
                cands.append((-score, li, bi, txt))
        cands.sort()
        title = (art.get('title') or '').strip()
        head = f"【{law} {nl(art['no'])}{(' ' + title) if title else ''}】"
        used_lines, used_ans, picked = set(), set(), []
        for sc, li, bi, txt in cands:   # 걸러진 빈칸 대신 같은 조문의 다음 후보가 들어간다
            if len(picked) >= K: break
            if li in used_lines or txt in used_ans: continue
            sent = sentence(lines, li, bi)
            reason = why_not(sent, txt, head)
            if reason:
                skipped[reason] = skipped.get(reason, 0) + 1
                continue
            picked.append((li, bi, txt, sent)); used_lines.add(li); used_ans.add(txt)
        for li, bi, txt, sent in sorted(picked):
            q = f"{head} {sent.replace(MARK, Q)}"
            cid = 'n' + hashlib.md5(f"{fid}|{art['no']}|{li}|{bi}".encode('utf8')).hexdigest()[:8]
            cards.append({'id': cid, 't': topic, 'q': q, 'a': txt, 'src': f"{law} {nl(art['no'])}", 'art': f"{law}:{art['no']}", 'alt': alts(txt)})
    return cards


def check(cards):
    """모든 카드가 규칙을 지키는지 검사. 어긴 카드 목록을 돌려준다."""
    bad = []
    ids = [c['id'] for c in cards]
    if len(ids) != len(set(ids)): bad.append(('-', '카드 id 중복'))
    for c in cards:
        q, a = c['q'], c['a']
        head, body = q.split('】', 1) if '】' in q else ('', q)
        head, body = head + '】', body.strip()
        probs = []
        if q.count(Q) != 1: probs.append(f'빈칸 {q.count(Q)}개')
        if '~' in body and not re.search(r'[\d급년호월일세상만]~\s*\d', body): probs.append('~ 표기 남음')
        if '�' in q or '�' in a or MARK in q: probs.append('깨진 글자/표식')
        if not a.strip(): probs.append('정답 비어 있음')
        reason = why_not(body.replace(Q, MARK), a, head) if body.count(Q) == 1 else None
        if reason: probs.append(reason)
        bad += [(c['id'], p + ' | ' + q[:70]) for p in probs]
    return bad


def guard_progress(path, old_ids, new_ids):
    """빠지는 카드 중 학습 기록이 있는 것이 있으면 멈춘다 (기록은 사라지지 않지만 화면에서 볼 수 없게 됨)."""
    p = json.load(open(path, encoding='utf8'))
    p = p.get('data', p)
    s = json.loads(p['json']) if isinstance(p.get('json'), str) else p
    gone = sorted(i for i in old_ids - new_ids if i in s.get('cards', {}))
    if gone:
        sys.exit(f'멈춤: 학습 기록이 있는 카드 {len(gone)}장이 빠집니다 → {gone[:10]}')
    print(f'학습 기록 확인: 빠지는 카드 중 기록 있는 카드 없음 (기록 {len(s.get("cards", {}))}건)')


if __name__ == '__main__':
    allc, skipped = [], {}
    for fid, law, topic, unit, K in LAWS:
        c = make(fid, law, topic, K, skipped)
        allc += c
        print(f'{law}: 카드 {len(c)}장 (주제 {topic}, {unit}차)')
    print('걸러낸 빈칸:', ', '.join(f'{k} {v}' for k, v in sorted(skipped.items())) or '없음')
    bad = check(allc)
    if bad:
        for b in bad[:30]: print('  ✗', *b)
        sys.exit(f'멈춤: 규칙을 어긴 카드 {len(bad)}건 — cards_new.json 을 쓰지 않았습니다')
    new_ids = {c['id'] for c in allc}
    old_ids = {c['id'] for c in json.load(open(OUT, encoding='utf8'))['cards']} if os.path.exists(OUT) else set()
    print(f'이전 대비: 유지 {len(old_ids & new_ids)}, 새로 {len(new_ids - old_ids)}, 빠짐 {len(old_ids - new_ids)}')
    if '--progress' in sys.argv:
        guard_progress(sys.argv[sys.argv.index('--progress') + 1], old_ids, new_ids)
    out = {'topics': {str(k): v for k, v in TOPIC_NAMES.items()}, 'units': {str(t): u for _, _, t, u, _ in LAWS}, 'cards': allc}
    json.dump(out, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print('합계', len(allc), '장,', os.path.getsize(OUT) // 1024, 'KB')
