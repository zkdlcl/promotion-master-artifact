"""기출 근거 DB 공용 함수: 규정 원문 사전, 기출 문항, 정규화.
규정 키는 '규정:조문번호' (예: '운영규정:53', '인사관리시행규칙:24의4', '운영규정:별표6').
"""
import json, re, os, glob, html as H, unicodedata

KB = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(KB)
TAGS = re.compile(r'<[^>]+>')
AMEND = re.compile(r'<span class="amend">.*?</span>', re.S)
CHAP = re.compile(r'<div class="chap">\[(별표[^\]]*)\](?:\s*<span class="amend">.*?</span>)?\s*</div>', re.S)

# 4급·전직 기출만 (스터디원이 만든 st1·st2 문제는 기준에서 뺀다)
EXAM_GROUPS = {'past-01', 'past-02', 'past-03', 'past-04', 'past-05', 'past-06', 'past-07', 'past-08',
               'past-09', 'past-10', 'past-11', 'past-12', '2026'}
LAWS = ['조직법', '정관', '운영규정', '인사관리시행규칙', '보수운영규정', '재무규정', '여비규정', '감사운영규정',
        '유관법령', '국제인도법', '국제적십자규약']


def plain(h):
    """조문 HTML → 원문 글자 (개정 표시는 뺌)"""
    t = H.unescape(TAGS.sub('', AMEND.sub('', h.replace('</div>', '\n').replace('<br>', '\n').replace('</td>', ' ').replace('</tr>', '\n'))))
    return re.sub(r'[ \t ]+', ' ', re.sub(r'\n\s*', '\n', t)).strip()


def norm(s):
    """인용 대조용: 공백·가운뎃점·따옴표·괄호 모양 차이를 없앤다"""
    s = unicodedata.normalize('NFKC', s)
    s = re.sub(r'[·ㆍ・‧∙•]', '·', s)
    s = re.sub(r'[“”"″]', '"', s); s = re.sub(r"[‘’'′]", "'", s)
    s = s.replace('～', '~').replace('〜', '~')
    return re.sub(r'\s+', '', s)


def _base_data():
    s = open(os.path.join(ROOT, 'base', 'orgmaster.base.html'), encoding='utf8').read()
    m = re.search(r'<script id="data" type="application/json">(.*?)</script>', s, re.S)
    return json.loads(m.group(1))


def _split_extra(law, extra, out):
    parts = CHAP.split(extra or '')
    for i in range(1, len(parts) - 1, 2):
        label = re.sub(r'\s+', '', parts[i])            # '별표제6호' → 키 '별표6'
        m = re.match(r'별표제?(\d+)호?(의\d+)?', label)
        key = f"{law}:별표{m.group(1)}{m.group(2) or ''}" if m else f"{law}:{label}"
        k, n = key, 2
        while k in out: k = f'{key}#{n}'; n += 1
        out[k] = {'law': law, 'no': k.split(':', 1)[1], 'title': '', 'text': plain(parts[i + 1])}


def articles():
    """{'규정:조문': {law, no, title, text}}"""
    out = {}
    D = _base_data()
    for a in D['articles']:
        if a['type'] == 'a':
            out[f"{a['law']}:{a['no']}"] = {'law': a['law'], 'no': a['no'], 'title': a.get('title', ''), 'text': plain(a['html'])}
    for law, ex in (D.get('extra') or {}).items():
        _split_extra(law, ex, out)
    for f in glob.glob(os.path.join(ROOT, 'site', 'data', 'laws', '*.json')):
        d = json.load(open(f, encoding='utf8'))
        for a in d['articles']:
            if a['type'] == 'a':
                out[f"{d['law']}:{a['no']}"] = {'law': d['law'], 'no': a['no'], 'title': a.get('title') or '', 'text': plain(a['html'])}
        _split_extra(d['law'], d.get('extra'), out)
    return out


AREA_HINT = [(re.compile(p), law) for p, law in [
    (r'인사관리\s*시행규칙', '인사관리시행규칙'), (r'보수\s*운영규정', '보수운영규정'), (r'재무\s*(운영)?규정', '재무규정'),
    (r'여비\s*(운영)?규정', '여비규정'), (r'감사\s*운영규정', '감사운영규정'), (r'국제\s*인도법|제네바', '국제인도법'),
    (r'국제\s*적십자\s*(운동)?\s*규약|규약', '국제적십자규약'), (r'직원\s*운영규정|운영규정', '운영규정'),
    (r'조직법', '조직법'), (r'정관', '정관')]]


def laws_in(text, n=120):
    """문제 머리말에 나온 규정들 (나온 순서대로)"""
    head = text[:n]
    found = []
    for rx, law in AREA_HINT:
        m = rx.search(head)
        if m and law not in [f for _, f in found]:
            found.append((m.start(), law))
            head = rx.sub(lambda mm: ' ' * len(mm.group(0)), head)
    return [law for _, law in sorted(found)]


def exam_items():
    """기출 문항 목록 (id, src, kind, area, q, a, ex)"""
    items = []
    idx = {q['id']: q['name'] for q in json.load(open(os.path.join(ROOT, 'site', 'quizindex.json'), encoding='utf8'))}
    for f in sorted(glob.glob(os.path.join(ROOT, 'site', 'data', 'quiz', 'past-*.json'))):
        d = json.load(open(f, encoding='utf8'))
        for x in d['items']:
            items.append({'id': x['id'], 'src': f"{idx.get(d['id'], d['name'])} {x['no']}번", 'year': int(d['name'][:4]),
                          'kind': x['kind'], 'area': x.get('area') or '', 'q': x['q'], 'a': x.get('a', ''), 'ex': x.get('ex') or ''})
    for e in _base_data()['exam']:
        if e['grp'] == '2026':
            items.append({'id': e['id'], 'src': f"2026년 4급 기출 {e['no']}번", 'year': 2026, 'kind': e['kind'],
                          'area': e.get('area') or '', 'q': e['q'], 'a': e.get('a', ''), 'ex': e.get('ex') or ''})
    for x in items:   # 영역을 규정 이름으로 맞춘다 ('직원운영규정 (제척 및 기피)' → '운영규정')
        if x['area'] not in LAWS:
            ls = laws_in(x['area'], 60) or laws_in(x['q'])
            x['topic'] = x['area']; x['area'] = ls[0] if ls else '기타'
    return items
