"""수록 원문과 대조한 표 보완 및 오늘 과제의 표 위치 지정."""
import html
import re

LEAVE_QUOTE = '임신 중인 직원이 모성을 보호하거나 만 8세 이하 또는 초등학교 2학년 이하 자녀(입양한 자녀를 포함한다)를 양육하기 위하여 필요한 때'
REDUCED_QUOTE = '만 12세 이하 또는 초등학교 6학년 이하의 자녀'
SERVICE_QUOTE = '휴직을 신청하는 직원의 계속근로기간이 6개월 미만(육아휴직 시작일을 기준으로 한다)인 경우 제외한다.'
ADDITIONAL_QUOTE = '다음의 어느 하나에 해당하는 직원의 경우 6개월 이내에서 추가로 육아휴직을 사용할 수 있으며'


def text(value):
    return html.unescape(re.sub(r'<[^>]+>', '', value))


def norm(value):
    return re.sub(r'\s+', '', text(value))


def target_for_goal(value, title):
    t = text(value)
    if re.search(r'🧠|카드', t) or ('별표' in t and not re.search(r'(?<!별)표', t)):
        return None
    explicit = re.search(r'(\d+)(?:[·,]\d+)*번\s*(?:[^\n]*?표|표)', t)
    if not explicit:
        explicit = re.search(r'(?<!별)표\s*(?:\(\s*)?(\d+)(?:[·,]\d+)*번', t)
    if explicit:
        n = int(explicit[1])
        return n if 1 <= n <= 14 else None
    if not re.search(r'표|📊|비교', t):
        return None
    for pattern, n in (
        ('근로시간.*단축|휴직.*(?:표|복원)', 10),
        ('의결기관.*(?:3종|비교)', 1),
        ('지사.*(?:정원|임기|기구).*표', 4),
        ('누가.*임용|주체.*표', 8),
        ('계약직원.*무기계약|임용·채용', 7),
        ('승진.*기간|결격.*비교', 6),
        ('휴가.*일수', 9),
        ('징계.*(?:기구|절차|위원회)', 11),
        ('기한 사다리', 12),
        ('정관 기재|숫자 마스터|숫자 표', 6 if '운영규정' in title else 3),
    ):
        if re.search(pattern, t):
            return n
    return None


def enrich(data):
    articles = {a.get('no'): a for a in data['articles'] if a['law'] == '운영규정' and a['type'] == 'a'}
    for no, quote in (('53', LEAVE_QUOTE), ('53', SERVICE_QUOTE), ('54', ADDITIONAL_QUOTE), ('54의2', REDUCED_QUOTE)):
        if norm(quote) not in norm(articles[no]['html']):
            raise ValueError(f'표 보완 근거 원문 변경: 운영규정 {no} / {quote}')
    table = data['tableHtml']
    old = '<tr><td>육아휴직</td><td>'
    assert table.count(old) == 1, '육아휴직 표 행 확인 필요'
    target = LEAVE_QUOTE.replace('8세', '[[8세]]').replace('2학년', '[[2학년]]')
    service = SERVICE_QUOTE.replace('6개월', '[[6개월]]')
    table = table.replace(old, '<tr><td>육아휴직<br><small>제53조②4호·제54조7호</small></td><td><b>대상:</b> ' + target + '.<br>' + service + '<br><b>기간·근속:</b> ', 1)
    table = table.replace('· 추가 [[6개월]] · 근속 포함', '· 해당 요건 충족 시 추가 [[6개월]] · 근속 포함', 1)
    old_target = '만 [[12세]] 이하(초6 이하)'
    assert table.count(old_target) == 1
    table = table.replace(old_target, '만 [[12세]] 이하 또는 초등학교 [[6학년]] 이하', 1)
    table = table.replace('<h3>10. 휴직·근로시간 단축</h3>\n<div class="tw blankable"><table>\n<tr><th>구분</th><th>기간·한도</th></tr>',
                          '<h3>10. 휴직·근로시간 단축</h3>\n<div class="tw blankable"><table>\n<tr><th>구분</th><th>대상·기간·한도</th></tr>', 1)
    data['tableHtml'] = re.sub(r'<h3>(\d+)\.', lambda m: f'<h3 id="table-{m[1]}" class="table-anchor" tabindex="-1">{m[1]}.', table)
    for day in data['days']:
        for goal in day['goals']:
            target = target_for_goal(goal['t'], day['title'])
            if target:
                goal['table'] = target
