"""기출 근거 DB 검사 + 모음 생성.
  python -X utf8 kb/check_kb.py      → 검사 통과 시 kb/exam_kb.json, kb/기출기준.md 생성
검사: 문항 id, 형식·묻는 것·난이도·상태 값, 조문 키, 인용이 원문에 글자 그대로 있는지, 함정 낱말 위치.
"""
import json, os, re, sys, glob, collections
sys.path.insert(0, os.path.dirname(__file__))
from kb_lib import KB, articles, exam_items, norm, LAWS

FORMS = {'정오-옳은것', '정오-틀린것', '개수', '조합', '빈칸', '계산', '짝짓기', '순서', 'OX', '주관식'}
FOCUS = {'주체', '기간·기한', '인원·정족수', '금액·비율', '요건·사유', '절차', '정의·용어', '효력·예외', '구성·조직', '열거', '연도·연혁', '개념'}
STATUS = {'확인됨', '일부확인', '확인필요', '개정차이'}


def load():
    recs = []
    for f in sorted(glob.glob(os.path.join(KB, 'annot', '*.json'))):
        for r in json.load(open(f, encoding='utf8')):
            r['_file'] = os.path.basename(f); recs.append(r)
    return recs


def check(recs, A, E):
    errs = []
    seen = set()
    for r in recs:
        rid = r.get('id'); e = lambda m: errs.append(f"{r['_file']} {rid}: {m}")
        if rid not in E: e('없는 문항 id'); continue
        if rid in seen: e('중복'); seen.add(rid)
        seen.add(rid)
        if r.get('form') not in FORMS: e(f"형식 {r.get('form')}")
        if not set(r.get('focus', [])) <= FOCUS or not r.get('focus'): e(f"묻는 것 {r.get('focus')}")
        if r.get('level') not in (1, 2, 3): e(f"난이도 {r.get('level')}")
        if r.get('status') not in STATUS: e(f"상태 {r.get('status')}")
        for k in r.get('arts', []):
            if k not in A: e(f'조문 키 없음 {k}')
        qn = norm(E[rid]['q'])
        for p in r.get('points', []):
            art, quote = p.get('art'), p.get('quote')
            if art and art not in A: e(f"{p.get('k')}: 조문 키 없음 {art}"); continue
            if quote:
                if not art: e(f"{p.get('k')}: 인용에 조문이 없음"); continue
                body = norm(A[art]['text'] + A[art]['title'])
                for frag in re.split(r'…|\.\.\.', quote):
                    if len(norm(frag)) >= 2 and norm(frag) not in body:
                        e(f"{p.get('k')}: 원문에 없는 인용 「{frag.strip()[:40]}」 ({art})")
            t = p.get('trap')
            if t:
                if not quote or norm(t.get('orig', '')) not in norm(quote): e(f"{p.get('k')}: 함정 원문 낱말이 인용에 없음 {t.get('orig')}")
                if not t.get('alt') or norm(t['alt']) not in qn: e(f"{p.get('k')}: 함정 바뀐 낱말이 문제에 없음 {t.get('alt')}")
        if r.get('status') == '확인됨' and any(p.get('ok') is not None and not p.get('quote') for p in r.get('points', [])):
            e('확인됨인데 인용 없는 보기')
    return errs


def build(recs, A, E):
    items, arts = {}, collections.defaultdict(lambda: {'n': 0, 'ids': [], 'years': [], 'traps': [], 'focus': collections.Counter()})
    for r in recs:
        x = E[r['id']]
        rec = {k: v for k, v in r.items() if not k.startswith('_')}
        rec.update(src=x['src'], year=x['year'], area=x['area'], kind=x['kind'])
        items[r['id']] = rec
        for k in set(r.get('arts', [])) | {p['art'] for p in r.get('points', []) if p.get('art')}:
            a = arts[k]; a['n'] += 1; a['ids'].append(r['id']); a['years'].append(x['year']); a['focus'].update(r.get('focus', []))
        for p in r.get('points', []):
            if p.get('trap') and p.get('art'):
                arts[p['art']]['traps'].append({'orig': p['trap']['orig'], 'alt': p['trap']['alt'], 'id': r['id']})
    arts = {k: dict(v, years=sorted(set(v['years'])), focus=dict(v['focus'])) for k, v in arts.items()}
    by_law = collections.defaultdict(list)
    for rid, r in items.items(): by_law[r['area']].append(r)
    stats = {law: {'n': len(rs), 'form': dict(collections.Counter(r['form'] for r in rs)),
                   'focus': dict(collections.Counter(f for r in rs for f in r['focus'])),
                   'level': dict(collections.Counter(str(r['level']) for r in rs)),
                   'case': sum(1 for r in rs if r.get('case')),
                   'status': dict(collections.Counter(r['status'] for r in rs))} for law, rs in by_law.items()}
    total = collections.Counter(x['area'] for x in E.values())
    kb = {'about': '승진고시 기출 근거 DB. 근거는 규정 원문 인용, 출제 기준은 기출.', 'total': dict(total), 'stats': stats, 'arts': arts, 'items': items}
    json.dump(kb, open(os.path.join(KB, 'exam_kb.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    md(kb, A, total)
    return kb


def md(kb, A, total):
    L = ['# 기출 출제 기준 (자동 생성 — kb/check_kb.py)', '',
         '카드를 만들거나 문제를 내기 전에 이 문서와 `exam_kb.json` 을 먼저 읽는다. 근거는 언제나 규정 원문이다.', '']
    for law in LAWS + ['기타']:
        st = kb['stats'].get(law)
        if not st: continue
        L += [f'## {law} — 기록 {st["n"]} / 기출 {total.get(law, 0)}문항', '',
              f'- 형식: ' + ', '.join(f'{k} {v}' for k, v in sorted(st['form'].items(), key=lambda t: -t[1])),
              f'- 묻는 것: ' + ', '.join(f'{k} {v}' for k, v in sorted(st['focus'].items(), key=lambda t: -t[1])),
              f'- 난이도: ' + ', '.join(f'{k}단계 {v}' for k, v in sorted(st['level'].items())) + f' · 사례형 {st["case"]}',
              f'- 상태: ' + ', '.join(f'{k} {v}' for k, v in st['status'].items()), '',
              '| 조문 | 출제 | 연도 | 함정(원문 → 바꾼 말) |', '|---|---|---|---|']
        rows = sorted(((k, v) for k, v in kb['arts'].items() if k.startswith(law + ':')), key=lambda t: (-t[1]['n'], t[0]))
        for k, v in rows:
            tr = ' · '.join(dict.fromkeys(f"{t['orig']} → {t['alt']}" for t in v['traps']))
            L.append(f"| {k.split(':', 1)[1]} {A[k]['title']} | {v['n']} | {', '.join(map(str, v['years']))} | {tr} |")
        L.append('')
    open(os.path.join(KB, '기출기준.md'), 'w', encoding='utf8', newline='\n').write('\n'.join(L))


if __name__ == '__main__':
    A = articles(); E = {x['id']: x for x in exam_items()}
    recs = load()
    errs = check(recs, A, E)
    if errs:
        print('\n'.join('✗ ' + x for x in errs)); sys.exit(f'멈춤: 오류 {len(errs)}건')
    kb = build(recs, A, E)
    done = collections.Counter(r['area'] for r in kb['items'].values())
    print('검사 통과. 기록', len(recs), '/', len(E), '문항 ·', ', '.join(f'{k} {done[k]}/{v}' for k, v in kb['total'].items() if done[k]))
