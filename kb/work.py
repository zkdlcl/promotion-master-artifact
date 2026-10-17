"""작업지: 기출 문항 + 근거 조문 후보를 보여 준다 (사람·Claude 가 읽고 판단하는 용도).
  python -X utf8 kb/work.py 운영규정            → 그 영역 문항 목록(번호만)
  python -X utf8 kb/work.py 운영규정 0 5        → 0번째부터 5문항, 후보 조문 포함
  python -X utf8 kb/work.py --art 운영규정:53   → 조문 원문 전체
  python -X utf8 kb/work.py --find 운영규정 직권면직   → 낱말이 든 조문 찾기
"""
import sys, re, math, collections, html as H
sys.path.insert(0, __import__('os').path.dirname(__file__))
from kb_lib import articles, exam_items, laws_in

A = articles()
tok = lambda s: set(re.findall(r'\d+(?:분의\s*\d+)?[가-힣%]{0,3}|[가-힣]{2,}', s))


def cands(laws, text, k=5):
    pool = [(key, a) for key, a in A.items() if a['law'] in laws]
    N = len(pool) or 1
    df = collections.Counter(t for _, a in pool for t in tok(a['text'] + a['title']))
    T = tok(text)
    sc = []
    for key, a in pool:
        X = tok(a['text'] + ' ' + a['title'])
        sc.append((sum(math.log(N / df[t]) for t in T & X if df[t]), key))
    return [key for s, key in sorted(sc, reverse=True)[:k] if s > 0]


def show(x):
    print('=' * 100)
    print(f"[{x['id']}] {x['src']} · {x['kind']} · 영역 {x['area']} · 정답 {x['a']}")
    print(x['q'])
    if x['ex']: print('— 해설:', H.unescape(re.sub(r'<br\s*/?>', '\n', x['ex'])))
    laws = laws_in(x['q']) or [x['area']]
    if x['area'] and x['area'] not in laws: laws.append(x['area'])
    print('— 후보:', ', '.join(f"{c}({A[c]['title']})" for c in cands(laws, x['q'] + ' ' + x['ex'])))


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--art':
        for key in a[1:]:
            v = A.get(key); print(f'■ {key} ({v["title"]})\n{v["text"]}\n' if v else f'없음: {key}')
    elif a and a[0] == '--find':
        law, words = a[1], a[2:]
        for key, v in A.items():
            if v['law'] == law and all(w in v['text'] for w in words):
                i = v['text'].find(words[0]); print(f"{key}({v['title']}): …{v['text'][max(0, i - 60):i + 80]}…".replace('\n', ' '))
    else:
        items = [x for x in exam_items() if not a or x['area'] == a[0]]
        if len(a) <= 1:
            print(len(items), '문항'); print(' '.join(x['id'] for x in items))
        else:
            s, n = int(a[1]), int(a[2]) if len(a) > 2 else 5
            for x in items[s:s + n]: show(x)
