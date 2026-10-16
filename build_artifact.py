import re, sys, json, os

SP = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'base', 'orgmaster.base.html')
P = lambda name: os.path.join(SP, name)
rd = lambda name: open(P(name), encoding='utf8').read()

s = open(F, encoding='utf8').read()

# 1) 게시 시 자동으로 붙는 외곽 틀(doctype/html/head/body)을 걷어내고 본문만 사용
i = s.index('<body>') + len('<body>')
j = s.rindex('</body>')
body = s[i:j].lstrip('\n')
assert body.startswith('<title>'), body[:60]


def rep(old, new, count=1):
    global body
    assert body.count(old) >= 1, old
    body = body.replace(old, new, count)


# 2) 데이터에 규정 목차(lawIndex)를 넣는다 (규정 본문은 별도 파일에서 필요할 때 불러온다)
m = re.search(r'(<script id="data" type="application/json">)(.*?)(</script>)', body, re.S)
D = json.loads(m.group(2))
D['lawIndex'] = json.load(open(P(os.path.join('site', 'lawindex.json')), encoding='utf8'))
D['quizIndex'] = json.load(open(P(os.path.join('site', 'quizindex.json')), encoding='utf8'))
# 원문 복원본 2024·2025 기출은 선배 앱 기출(past-07·past-08)과 같은 시험이라 빼고, 기록은 번호 대응표로 옮긴다
D['exam'] = [e for e in D['exam'] if e['grp'] not in ('2024', '2025')]
D['exMap'] = json.load(open(P(os.path.join('site', 'exmap.json')), encoding='utf8'))
# 새 규정 복습 카드 (스터디 1회독 차수 단위)
cn = json.load(open(P(os.path.join('site', 'cards_new.json')), encoding='utf8'))
D['cards'] = D['cards'] + cn['cards']
D['topics'].update(cn['topics'])
D['cardUnits'] = cn['units']
newdata = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
body = body[:m.start(2)] + newdata + body[m.end(2):]

# 3) 기존 선언 중 덮어써야 하는 것만 고친다
rep("const nl = n => '제' + (String(n).includes('의') ? String(n).replace('의','조의') : n + '조');",
    "const nl = n => { const s = String(n); return /^\\d+(의\\d+)?$/.test(s) ? '제' + (s.includes('의') ? s.replace('의','조의') : s + '조') : s; };")
rep("const inTopic = (a, t) =>", "let inTopic = (a, t) =>")
rep("const FS = [", "let FS = [")
rep("const tl = t =>", "let tl = t =>")
rep("if (c._arts) return c._arts;", "if (c._arts) return c._arts; if (c.art) return (c._arts = [c.art]);")
rep("const m = seg.match(/^(조직법|정관|운영규정)/);", "const m = seg.match(new RegExp('^(' + LAW_LIST.join('|') + ')'));")
rep("""`<span class="badge" title="${esc(D.topics[t])}">${tl(t)}</span>`""", """`<span class="badge" title="${esc(tl(t) + ' · ' + D.topics[t])}">${esc(topicShort(t))}</span>`""")
rep(",['2025','2025 기출 (5/23)'],['2024','2024 기출 (5/24)']", "")
rep("const exLabel = e =>", "let exLabel = e =>")
rep("const exAnswers = e => (e.a.match(/[①②③④⑤]/g) || []);", "const exAnswers = e => (e.a.match(/[①②③④⑤⑥]/g) || []);")
rep("bad = X.res.filter(r => !r.ok).map(r => D.exam.find(e => e.id === r.id));", "bad = X.res.filter(r => !r.ok).map(r => exById(r.id));")
rep("X.queue = X.res.filter(r => !r.ok).map(r => D.exam.find(q => q.id === r.id));", "X.queue = X.res.filter(r => !r.ok).map(r => exById(r.id));")

# 4) 새 탭 영역, 탭 목록, CSS, JS 를 덧붙인다 (기존 코드는 가급적 수정하지 않음)
rep('<section class="pane" id="p-exam"></section>', '<section class="pane" id="p-exam"></section>\n<section class="pane" id="p-rev"></section>')
rep("['exam','🗂 기출·오답'],", "['exam','🗂 기출·오답'],['rev','🆕 개정'],")
rep('<section class="pane" id="p-read"></section>', '<section class="pane" id="p-read"></section>\n<section class="pane" id="p-bt"></section>')
rep("['read','📖 회독'],", "['read','📖 회독'],['bt','🕳 뻥뚫'],")
rep("['cho','🔤 자음퀴즈'],", "")

css = ''.join(rd(n) for n in ['rev-tab.css', 'ux-polish.css', 'ux2.css', 'ux4.css'])
k = body.index('</style>')
body = body[:k] + css + '\n' + body[k:]
js = ''.join(rd(n) for n in ['lawdata.js', 'rev-tab.js', 'ux-polish.js', 'ux2.js', 'ux3.js', 'ux4.js', 'ux5.js', 'ux6.js'])
rep('/* 시작 */', js + '\n/* 시작 */')

open(P('orgmaster.html'), 'w', encoding='utf8', newline='\n').write(body)
print('body chars', len(body), 'bytes', len(body.encode('utf8')))

# 테스트용: 게시 때 자동으로 붙는 외곽 틀(viewport meta 포함)을 붙인 복사본
wrapped = s[:i] + body + '\n</body></html>'
open(P('orgmaster.wrapped.html'), 'w', encoding='utf8', newline='\n').write(wrapped)
# 규정 파일과 같은 폴더 구조로 둔 테스트 사이트 (로컬 서버로 띄워 fetch 까지 점검)
os.makedirs(P('site'), exist_ok=True)
open(P(os.path.join('site', 'index.html')), 'w', encoding='utf8', newline='\n').write(wrapped)
