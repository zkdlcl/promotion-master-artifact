"""새 규정 7종의 복습 카드를 조문의 빈칸(b1/b2)에서 자동으로 만든다.
 - 한 조문에서 최대 K장: 숫자·기한이 든 빈칸을 우선, 그다음 기관·직위, 마지막으로 동사.
 - 카드 형식은 기존 D.cards 와 같다: {id, t(주제 번호), q, a, src, alt[]}
 - 주제 번호(t)는 스터디 일정의 1회독 차수 단위로 잡는다 (2회독 이후는 같은 단위를 반복하므로 따로 세지 않음).
실행: python -X utf8 make_cards.py   → site/cards_new.json
"""
import json, re, os, html as H, hashlib, collections

SP = os.path.dirname(os.path.abspath(__file__))
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
nl = lambda no: ('제' + (no.replace('의', '조의') if '의' in no else no + '조')) if re.match(r'^\d+(의\d+)?$', no) else no


def plain(inner, mark):
    """줄 HTML → 문장. mark 번째 빈칸만 ( ? ), 나머지 빈칸은 원문 그대로."""
    out, pos, k = [], 0, -1
    inner = AMEND.sub('', inner)
    for m in BLANK.finditer(inner):
        k += 1
        out.append(inner[pos:m.start()])
        out.append('(  ?  )' if k == mark else m.group(2))
        pos = m.end()
    out.append(inner[pos:])
    t = H.unescape(TAGS.sub('', ''.join(out)))
    return re.sub(r'\s+', ' ', t).strip()


def alts(a):
    s = set()
    one = re.fullmatch(r'\D*?(\d[\d,]*)\D*', a)
    if one and one.group(1) != a: s.add(one.group(1).replace(',', ''))
    core = re.sub(r'\s*(이상|이하|미만|초과|이내|이전|이후|까지|부터|마다)$', '', a)
    if core and core != a: s.add(core)
    m = re.match(r'^(\d+)분의\s*(\d+)', a)
    if m: s.add(f'{m.group(2)}/{m.group(1)}')
    return sorted(s - {a})[:3]


def make(fid, law, topic, K):
    d = json.load(open(os.path.join(SP, 'site', 'data', 'laws', fid + '.json'), encoding='utf8'))
    cards = []
    for art in d['articles']:
        if art['type'] != 'a':
            continue
        lines = LINE.findall(art['html'])
        cands = []  # (우선순위, 줄 번호, 빈칸 번호, 줄 인덱스)
        for li, (cls, inner) in enumerate(lines):
            for bi, m in enumerate(BLANK.finditer(inner)):
                kind, txt = m.group(1), H.unescape(TAGS.sub('', m.group(2))).strip()
                if len(txt) < 2 or len(txt) > 16: continue
                if kind == 'b2' and txt in SKIP_B2: continue
                score = 3 if re.search(r'\d', txt) else (2 if kind == 'b1' else 1)
                cands.append((-score, li, bi, txt, cls))
        cands.sort()
        used_lines, used_ans, picked = set(), set(), []
        for sc, li, bi, txt, cls in cands:
            if len(picked) >= K: break
            if li in used_lines or txt in used_ans: continue
            picked.append((li, bi, txt, cls)); used_lines.add(li); used_ans.add(txt)
        for li, bi, txt, cls in sorted(picked):
            sent = plain(lines[li][1], bi)
            if len(re.sub(r'[\s(?)]', '', sent)) < 10: continue
            if cls != 'ln' and li > 0:   # 호·목 줄이면 바로 위의 항 첫머리를 맥락으로
                for pj in range(li - 1, -1, -1):
                    if lines[pj][0] == 'ln':
                        lead = plain(lines[pj][1], -1)
                        sent = (lead[:42] + ('…' if len(lead) > 42 else '') + ' ' + sent); break
            if len(sent) > 230:
                i = sent.find('(  ?  )'); lo = max(0, i - 105); hi = min(len(sent), i + 125)
                sent = ('…' if lo else '') + sent[lo:hi] + ('…' if hi < len(sent) else '')
            title = (art.get('title') or '').strip()
            q = f"【{law} {nl(art['no'])}{(' ' + title) if title else ''}】 {sent}"
            cid = 'n' + hashlib.md5(f"{fid}|{art['no']}|{li}|{bi}".encode('utf8')).hexdigest()[:8]
            cards.append({'id': cid, 't': topic, 'q': q, 'a': txt, 'src': f"{law} {nl(art['no'])}", 'art': f"{law}:{art['no']}", 'alt': alts(txt)})
    return cards


if __name__ == '__main__':
    allc = []
    for fid, law, topic, unit, K in LAWS:
        c = make(fid, law, topic, K)
        allc += c
        print(f'{law}: 카드 {len(c)}장 (주제 {topic}, {unit}차)')
    ids = [c['id'] for c in allc]
    assert len(ids) == len(set(ids)), '카드 id 중복'
    out = {'topics': {str(k): v for k, v in TOPIC_NAMES.items()}, 'units': {str(t): u for _, _, t, u, _ in LAWS}, 'cards': allc}
    json.dump(out, open(os.path.join(SP, 'site', 'cards_new.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print('합계', len(allc), '장,', os.path.getsize(os.path.join(SP, 'site', 'cards_new.json')) // 1024, 'KB')
