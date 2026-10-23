"""인사관리 시행규칙 hwpx 의 인사서식(제1~33호)·별표 제5호의6 을 HTML 조각으로 뽑는다.
표는 칸 병합(colspan/rowspan)을 살리고, 그림만 있는 서식은 자리표시 문구로 둔다.
실행: python -X utf8 -I tools/hwpx_forms.py <풀어 둔 hwpx 폴더> <출력 json> [regs.json — 주면 시행규칙에 넣는다]
  (hwpx 는 새 빈 폴더에 python -I zipfile 로 풀어서 넘긴다 — 다운로드한 파일이라 신뢰하지 않는다)
"""
import glob, html as H, json, os, re, sys
import xml.etree.ElementTree as ET

P = '{http://www.hancom.co.kr/hwpml/2011/paragraph}'
HEAD = re.compile(r'^\(?인사서식\s*제\s*(\d+)\s*호(?:의\s*(\d+))?\)?\s*(.*)$', re.S)
HEAD_ANY = re.compile(r'\(?인사서식\s*제\s*(\d+)\s*호(?:의\s*(\d+))?\)?([^\n]*)')
AMEND = re.compile(r'<([^<>]*)>')
PIC = '<div class="ln mute">[그림 서식 — 원문 hwpx 의 이미지]</div>'


def esc(s):
    return H.escape(s, quote=False)


def ttext(t):
    """hp:t 안의 글자 — 공백·탭·줄바꿈 요소는 꼬리 글자와 함께 이어 붙인다."""
    out = [t.text or '']
    for c in t:
        tag = c.tag.replace(P, '')
        out.append({'fwSpace': ' ', 'tab': ' ', 'lineBreak': '\n', 'nbSpace': ' '}.get(tag, ''))
        out.append(c.tail or '')
    return ''.join(out)


def para_blocks(p, ctx):
    """문단 하나 → [('text', 글자) | ('html', 조각)] (표·그림·글상자가 섞이면 순서대로)"""
    blocks, buf = [], []

    def flush():
        s = ''.join(buf)
        buf.clear()
        if s.strip():
            blocks.append(('text', s))

    def walk(e):
        for c in e:
            tag = c.tag.replace(P, '')
            if tag == 't':
                buf.append(ttext(c))
            elif tag == 'tbl':
                flush(); blocks.append(('html', table_html(c, ctx)))
            elif tag == 'pic':
                flush(); ctx['pics'] += 1; blocks.append(('pic', ''))
            elif tag == 'drawText':
                flush()
                sl = c.find(P + 'subList')
                if sl is not None:
                    for q in sl.findall(P + 'p'):
                        blocks.extend(para_blocks(q, ctx))
            elif tag in ('linesegarray', 'secPr', 'ctrl'):
                continue
            else:
                walk(c)
    walk(p)
    flush()
    return blocks


def cell_html(tc, ctx):
    sl = tc.find(P + 'subList')
    lines = []
    for p in (sl.findall(P + 'p') if sl is not None else []):
        for kind, v in para_blocks(p, ctx):
            if kind == 'text':
                lines.append(esc(v.strip('\n')).replace('\n', '<br>'))
            elif kind == 'html':
                lines.append(v)
            else:
                lines.append('<span class="mute">[그림]</span>')
    # 끝쪽 빈 줄은 버리고 가운데 빈 줄은 한 줄 간격으로 남긴다
    while lines and not lines[-1].strip():
        lines.pop()
    return '<br>'.join(l if l.strip() else '&nbsp;' for l in lines) or '&nbsp;'


def col_widths(tbl):
    """칸 너비(%) — 병합 없는 칸으로 열 너비를 정하고, 병합 칸에서 모자란 열을 역산한다."""
    cells = []
    for tc in tbl.iter(P + 'tc'):
        a, s, z = tc.find(P + 'cellAddr'), tc.find(P + 'cellSpan'), tc.find(P + 'cellSz')
        cells.append((int(a.get('colAddr')), int(s.get('colSpan')), int(z.get('width'))))
    n = int(tbl.get('colCnt'))
    w = [None] * n
    for c, s, z in cells:
        if s == 1 and c < n:
            w[c] = z if w[c] is None else min(w[c], z)
    for _ in range(n):
        for c, s, z in cells:
            if s > 1 and c + s <= n:
                known = sum(x for x in w[c:c + s] if x is not None)
                unk = [i for i in range(c, c + s) if w[i] is None]
                if len(unk) == 1 and z > known:
                    w[unk[0]] = z - known
    kn = [x for x in w if x]
    avg = (sum(kn) / len(kn)) if kn else 1
    w = [x if x else avg for x in w]
    tot = sum(w)
    return [round(x * 100 / tot, 2) for x in w]


def table_html(tbl, ctx):
    ctx['tbls'] += 1
    ws = col_widths(tbl)
    out = ['<div class="tw"><table class="hf" style="table-layout:fixed;width:100%"><colgroup>'
           + ''.join(f'<col style="width:{x}%">' for x in ws) + '</colgroup>']
    for tr in tbl.findall(P + 'tr'):
        out.append('<tr>')
        for tc in tr.findall(P + 'tc'):
            s = tc.find(P + 'cellSpan')
            cs, rs = int(s.get('colSpan')), int(s.get('rowSpan'))
            at = (f' colspan="{cs}"' if cs > 1 else '') + (f' rowspan="{rs}"' if rs > 1 else '')
            out.append(f'<td{at}>{cell_html(tc, ctx)}</td>')
        out.append('</tr>')
    out.append('</table></div>')
    return ''.join(out)


def new_form(m_no, m_sub, rest):
    no = m_no + ('의' + m_sub if m_sub else '')
    am = AMEND.findall(rest)
    return {'no': no, 'amend': ' / '.join(a.strip() for a in am), 'title': AMEND.sub('', rest).strip(), 'html': ''}


def raw_text(p):
    return '\n'.join(ttext(t) for t in p.iter(P + 't'))


def lines_html(text):
    return ''.join(f'<div class="ln">{esc(l.strip())}</div>' for l in text.split('\n') if l.strip())


def add_blocks(tgt, bl):
    for k, v in bl:
        if k == 'text':
            tgt['html'] += lines_html(v)
        elif k == 'html':
            tgt['html'] += v
        else:
            tgt['html'] += PIC


def sections_paras(folder):
    files = sorted(glob.glob(os.path.join(folder, 'Contents', 'section*.xml')), key=lambda f: int(re.findall(r'(\d+)', os.path.basename(f))[0]))
    for f in files:
        for i, p in enumerate(ET.parse(f).getroot()):
            yield i, p


def build(folder):
    ctx = {'pics': 0, 'tbls': 0}
    forms, cur, b56, lead = [], None, None, ''
    for pi, p in sections_paras(folder):
        bl = para_blocks(p, ctx)
        first = next((v for k, v in bl if k == 'text'), '').strip()
        if re.match(r'^\[별표\s*제5호의6', first):
            b56, cur = {'head': first, 'html': ''}, None
            continue
        m = HEAD.match(first) if bl and bl[0][0] == 'text' else None
        if m:
            cur = new_form(m.group(1), m.group(2), m.group(3)); forms.append(cur)
            cur['html'], lead = lead, ''
            tail = bl[0][1].partition('\n')[2]
            bl = ([('text', tail)] if tail.strip() else []) + bl[1:]
        elif cur is None:
            if b56 is None:
                continue
            if '<table' in b56['html'] and bl and all(k == 'text' for k, v in bl):
                lead += lines_html(''.join(v for k, v in bl))   # 5호의6 표 다음의 글자는 다음 서식(제1호)의 제목
            else:
                add_blocks(b56, bl)
            continue
        elif pi == 0 and bl and bl[0][0] == 'html':
            # 구역 첫 문단의 표 안에 서식 제목이 든 경우(제10호, 제11·12호)
            seen = {f['no'] for f in forms}
            hs = [h for h in HEAD_ANY.findall(raw_text(p)) if h[0] + ('의' + h[1] if h[1] else '') not in seen]
            if len(hs) == 1:
                cur = new_form(*hs[0]); forms.append(cur)
            elif len(hs) > 1:
                sizes = re.findall(r'규격\s*:\s*[^\n<]*', raw_text(p))
                for k, h in enumerate(hs):
                    cur = new_form(*h); forms.append(cur)
                    cur['html'] += (lines_html(sizes[k]) if k < len(sizes) else '') + PIC
                continue
        add_blocks(cur, bl)
    return forms, b56, ctx


def apply_to_regs(forms, b56, regs_path):
    """regs.json 의 인사관리 시행규칙 '별표' 장 끝에 인사서식 제N호를 넣는다(다시 실행해도 같은 결과). 별표 제5호의6 제목·개정 표시도 맞춘다."""
    regs = json.load(open(regs_path, encoding='utf8'))
    law = next(r for r in regs if r['name'] == '인사관리 시행규칙')
    ch = next(c for c in law['chapters'] if c['number'] == '별표')
    arts = [a for a in ch['articles'] if not a['number'].startswith('인사서식')]
    for a in arts:
        if a['number'] == '별표 제5호의6':
            a['title'] = '징계의 감경기준(제24조의4 관련)'
            a['amend'] = '신설 2026.1.1.'
    order = max(a['order'] for a in arts)
    for f in forms:
        deleted = '삭제' in (f['title'] + f['amend'])
        title = '삭제' if deleted else f['title']
        a = {'number': '인사서식 제' + re.sub(r'^(\d+)(?:의(\d+))?$', lambda m: m.group(1) + '호' + ('의' + m.group(2) if m.group(2) else ''), f['no']), 'title': title, 'content': {'html': f['html']}, 'keywords': ['인사서식'], 'order': 0}
        if f['amend']:
            a['amend'] = f['amend']
        order += 1
        a['order'] = order
        arts.append(a)
    ch['articles'] = arts
    json.dump(regs, open(regs_path, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    forms, b56, ctx = build(sys.argv[1])
    json.dump({'forms': forms, 'b56': b56}, open(sys.argv[2], 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(len(forms), 'forms', ctx, [f['no'] for f in forms])
    if len(sys.argv) > 3:
        apply_to_regs(forms, b56, sys.argv[3])
        print('regs.json 갱신:', sys.argv[3])
