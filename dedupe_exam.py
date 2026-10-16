"""원문 복원본 기출(2024·2025)을 선배 앱 기출(past-07·past-08)로 대체하기 위한 점검·후처리.
 - 번호(no)로 1:1 대응시켜 정답을 비교하고, 복원본의 해설이 더 풍부하면 선배 쪽 문제에 옮긴다.
 - 기록(S.ex) 이전용 대응표 site/exmap.json 을 만든다.
실행: python -X utf8 dedupe_exam.py [--apply]
"""
import json, re, os, sys, collections
from difflib import SequenceMatcher

SP = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'base', 'orgmaster.base.html')
APPLY = '--apply' in sys.argv
s = open(F, encoding='utf8').read()
D = json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>', s, re.S).group(1))
PAIRS = {'2024': 'past-07', '2025': 'past-08'}
CIRC = {'㉮': '가', '㉯': '나', '㉰': '다', '㉱': '라', '㉲': '마', '㉳': '바', '㉴': '사', '㉵': '아'}
strip = lambda t: re.sub(r'<[^>]+>', '', t)
norm_text = lambda t: re.sub(r'[\s①-⑥㉠-㉻\W_]+', '', strip(t))


def norm_ans(a, kind):
    if kind == 'mc':
        return ''.join(sorted(re.findall(r'[①-⑥]', a)))
    a = ''.join(CIRC.get(c, c) for c in a)
    return re.sub(r'[\s:,.·]+', '', a)


exmap, rep = {}, collections.Counter()
for og, sg in PAIRS.items():
    path = os.path.join(SP, 'site', 'data', 'quiz', sg + '.json')
    d = json.load(open(path, encoding='utf8'))
    by_no = {it['no']: it for it in d['items']}
    ocr = [e for e in D['exam'] if e['grp'] == og]
    print(f'== OCR {og} ({len(ocr)}문항) ↔ {sg} {d["name"]} ({len(d["items"])}문항)')
    for e in ocr:
        it = by_no.get(e['no'])
        if not it:
            print('  선배 쪽에 없는 번호', e['no']); rep['no_match'] += 1; continue
        sim = SequenceMatcher(None, norm_text(e['q']), norm_text(it['q'])).ratio()
        same_kind = e['kind'] == it['kind']
        a1, a2 = norm_ans(e['a'], e['kind']), norm_ans(it['a'], it['kind'])
        if sim < .6: rep['low_sim'] += 1; print(f'  유사도 낮음 #{e["no"]} {sim:.2f}')
        if not same_kind: rep['kind_diff'] += 1; print(f'  종류 다름 #{e["no"]}: OCR {e["kind"]} / 선배 {it["kind"]}')
        if a1 != a2:
            rep['ans_diff'] += 1; print(f'  정답 다름 #{e["no"]}: OCR {e["a"]!r} / 선배 {it["a"]!r}')
        exmap[e['id']] = it['id']
        o_ex, s_ex = strip(e.get('ex', '')), strip(it.get('ex', ''))
        if len(o_ex) > len(s_ex) + 20:
            rep['ex_upgraded'] += 1
            if APPLY: it['ex'] = e['ex']
        rep['paired'] += 1
    if APPLY:
        json.dump(d, open(path, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
json.dump(exmap, open(os.path.join(SP, 'site', 'exmap.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(dict(rep), '| exmap', len(exmap), '| apply' if APPLY else '| dry-run')
