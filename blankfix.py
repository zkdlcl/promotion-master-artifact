"""빈칸 경계 바로잡기: 낱말 중간에서 시작하는 빈칸(징계[의결], 지사부[회장], 제[2차])을 낱말 앞부분까지 넓힌다.

빈칸 개수는 바꾸지 않는다(새 규정 카드 id 가 빈칸 순번으로 정해지므로). 예외만 BLANK_FIX 로 따로 정한다.
build_artifact.py(조직법·정관·운영규정)와 convert_regs.py(나머지 규정)가 같이 쓴다.
"""
import re

GLUED = re.compile(r'([0-9]*[가-힣]+)<span class="b (b\d)">([^<]+)</span>')
# 앞말 + 빈칸 → 바꿀 html (None 이면 그대로 둔다)
BLANK_FIX = {
    ('면', '허가'): '<span class="b {c}">면허</span>가',   # 면허가(면허 + 조사) — '허가'가 아님
    ('장애아', '동의'): '장애아동의',                         # 장애아동 + 의 — 빈칸이 아님 (개수가 줄어드는 유일한 곳, 조직법·정관·운영규정 카드는 손으로 만든 것이라 영향 없음)
    ('위원', '과반수'): None,                                 # '위원 과반수' 띄어쓰기 빠짐 — 과반수만 빈칸
}


def fix_blanks(html, log=None):
    def one(m):
        pre, cls, t = m.group(1), m.group(2), m.group(3)
        key = (pre, t)
        if key in BLANK_FIX:
            new = BLANK_FIX[key]
            if new is None:
                return m.group(0)
            out = new.format(c=cls)
        else:
            out = f'<span class="b {cls}">{pre}{t}</span>'
        if log is not None:
            log.append(f'{pre}[{t}] → {re.sub(r'<span class="b b\d">(.*?)</span>', r'[\1]', out)}')
        return out
    return GLUED.sub(one, html)


def glued_left(html):
    """BLANK_FIX 로 그대로 두기로 한 것 말고 낱말 중간 빈칸이 남았는지"""
    return [m.group(0) for m in GLUED.finditer(html) if BLANK_FIX.get((m.group(1), m.group(3)), 0) is not None]
