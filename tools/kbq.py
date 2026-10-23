"""기출 근거 DB 질의 도구: 큰 파일을 통째로 읽지 않고 필요한 조각만 꺼낸다 (출력 상한 약 5000자).
  python -X utf8 tools/kbq.py digest [규정]        기출기준.md 의 그 규정 절 (규정 생략 시 목록)
  python -X utf8 tools/kbq.py item <id...>         문항 본문·정답·근거 기록 (예: past-09-5)
  python -X utf8 tools/kbq.py art <규정:조문...>    조문 원문 + 그 조문의 기출 id·함정
  python -X utf8 tools/kbq.py find <규정> <낱말>    낱말이 든 조문
  python -X utf8 tools/kbq.py err                  가채점 오류 교훈
  python -X utf8 tools/kbq.py ans <id...>          스터디 답지 기록
  python -X utf8 tools/kbq.py checkpoint "<한 줄>"  kb/진행상황.md '세션 메모'에 한 줄 남김 (최근 30줄만 유지)
  --offset N 을 붙이면 N번째 글자부터 이어서 보여 준다.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'kb'))

LIMIT = 5000
MEMO = '## 세션 메모'
MEMO_MAX = 30


def emit(text, offset=0):
    chunk = text[offset:offset + LIMIT]
    print(chunk)
    rest = len(text) - offset - len(chunk)
    if rest > 0:
        print(f'\n… {rest}자 더 있음: 같은 명령에 --offset {offset + len(chunk)}')


def sections(path):
    """'## ' 제목 → 본문 (파일 앞머리는 '' 키)"""
    out, cur, buf = {}, '', []
    for line in path.read_text(encoding='utf8').splitlines():
        if line.startswith('## '):
            out[cur] = '\n'.join(buf)
            cur, buf = line[3:].strip(), [line]
        else:
            buf.append(line)
    out[cur] = '\n'.join(buf)
    return out


def digest(args):
    sec = sections(ROOT / 'kb' / '기출기준.md')
    names = [k for k in sec if k]
    if not args:
        return '규정 절: ' + ' / '.join(names)
    hit = [k for k in names if k.startswith(args[0])]
    return sec[hit[0]] if hit else f'없음: {args[0]} (절: {", ".join(names)})'


def exam_kb():
    return json.loads((ROOT / 'kb' / 'exam_kb.json').read_text(encoding='utf8'))


def item(args):
    from kb_lib import exam_items
    kb = exam_kb()['items']
    q = {x['id']: x for x in exam_items()}
    out = []
    for i in args:
        x = q.get(i)
        if x:
            out.append(f"[{i}] {x['src']} · {x['kind']} · 영역 {x['area']} · 정답 {x['a']}\n{x['q']}")
        else:
            out.append(f'[{i}] 기출 본문 없음')
        out.append('— 근거 기록: ' + (json.dumps(kb[i], ensure_ascii=False) if i in kb else '아직 없음'))
    return '\n\n'.join(out)


def art(args):
    from kb_lib import articles
    A, arts = articles(), exam_kb()['arts']
    out = []
    for k in args:
        a = A.get(k)
        out.append(f"[{k}] {a['title']}\n{a['text']}" if a else f'[{k}] 원문 없음')
        if k in arts:
            r = arts[k]
            traps = ' · '.join(f"{t['orig'] or '(끼워 넣음)'} → {t['alt'] or '(빠뜨림)'}" for t in r['traps'])
            out.append(f"— 기출 {r['n']}회 ids: {', '.join(r['ids'])}\n— 함정: {traps or '없음'}")
    return '\n\n'.join(out)


def find(args):
    from kb_lib import articles
    law, word = args[0], args[1]
    hits = [f"{k} {a['title']}" for k, a in articles().items() if a['law'] == law and (word in a['text'] or word in a['title'])]
    return '\n'.join(hits) or '없음'


def err(_):
    sec = sections(ROOT / 'kb' / 'study' / '가채점오류.md')
    return sec.get('교훈 (먼저 읽기)', '교훈 절 없음')


def ans(args):
    d = json.loads((ROOT / 'kb' / 'study' / '답지.json').read_text(encoding='utf8'))
    rows = {x['id']: x for x in d['items'] + d['add']}
    return '\n\n'.join(json.dumps(rows.get(i, '없음'), ensure_ascii=False, indent=1) for i in args)


def checkpoint(args):
    """바이트 그대로 보존(BOM·줄바꿈): '## 세션 메모' 절에 한 줄 추가, 최근 MEMO_MAX 줄만 유지"""
    path = ROOT / 'kb' / '진행상황.md'
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    nl = '\r\n' if b'\r\n' in raw else '\n'
    text = raw.decode('utf-8-sig').replace('\r\n', '\n')
    line = f"- {datetime.now().strftime('%m-%d %H:%M')} {' '.join(args).strip()}"
    m = re.search(r'^' + re.escape(MEMO) + r'.*?\n(?=^## |\Z)', text, re.S | re.M)
    if m:
        body = [x for x in m.group(0).splitlines()[1:] if x.startswith('- ')]
        block = MEMO + '\n' + '\n'.join((body + [line])[-MEMO_MAX:]) + '\n\n'
        text = text[:m.start()] + block + text[m.end():]
    else:
        block = MEMO + ' (kbq.py checkpoint 가 갱신, 최근 30줄)\n' + line + '\n\n'
        at = text.find('\n## 작업 요령')
        text = text[:at + 1] + block + text[at + 1:] if at >= 0 else text.rstrip('\n') + '\n\n' + block
    out = text.replace('\n', nl).encode('utf8')
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + out)
    return '세션 메모 저장: ' + line


CMDS = {'digest': digest, 'item': item, 'art': art, 'find': find, 'err': err, 'ans': ans, 'checkpoint': checkpoint}


def main(argv):
    offset = 0
    if '--offset' in argv:
        i = argv.index('--offset')
        offset = int(argv[i + 1])
        argv = argv[:i] + argv[i + 2:]
    if not argv or argv[0] not in CMDS:
        print(__doc__)
        return 2
    if argv[0] in ('item', 'art', 'ans', 'find') and len(argv) < (3 if argv[0] == 'find' else 2):
        print(__doc__)
        return 2
    emit(CMDS[argv[0]](argv[1:]), offset)
    return 0


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf8')
    sys.exit(main(sys.argv[1:]))
