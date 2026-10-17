# 승진고시 마스터 (아티팩트) 소스

claude.ai 아티팩트 **승진고시 마스터**(https://claude.ai/artifact/XmAgPN8DtD9eoujJX8naXs)의 소스·데이터·테스트 백업입니다.
학습 기록은 아티팩트 DB(`state/progress`)와 브라우저에 있고, 이 저장소에는 **페이지와 데이터**만 있습니다.

## 구조
| 경로 | 내용 |
|---|---|
| `base/orgmaster.base.html` | 출발점이 된 기존 페이지(게시 버전 16). 빌드는 이 위에 아래 조각들을 덧붙입니다. |
| `lawdata.js` `rev-tab.js` `ux-polish.js` `ux2.js` … `ux6.js` | 덧붙이는 기능 조각 (규정 불러오기, 개정 탭, 칩/패널/검색 화면, 뻥뚫, 일정, 문제 연동, 복습 카드). 뒤 파일이 앞 파일의 함수를 덮어쓰는 순서이므로 `build_artifact.py` 의 `js` 목록 순서가 중요합니다. |
| `*.css` | 위 조각에 딸린 스타일 |
| `ui7.css` `ui7.js` | **디자인 층**(맨 마지막). shadcn/ui zinc 무채색 + Radix red 색 체계(라이트·다크 짝), 이모지 → 선 아이콘, 드롭다운 → 칩(원래 select 는 숨긴 채 값만 바꿈), 원형으로 퍼지는 테마 전환. 기능 함수는 덮어쓰지 않고 그려진 화면만 바꿉니다. 글꼴은 Pretendard(설치 시) → Noto Sans KR, 숫자는 JetBrains Mono. |
| `kb/` | **기출 근거 DB** — 기출 432문항의 근거 조문·원문 인용·형식·난이도·함정. 설명 `kb/README.md`, 요약 `kb/기출기준.md`. 빌드 때 검사를 통과해야 하며 페이지 안(`D.kb`)에 들어간다. |
| `kb-ui.js` | 기출 근거를 앱에 보여 줌: 기출 정답 공개 뒤 근거 조문(누르면 원문 패널)·함정·개정 차이, 회독 조문의 "기출 N" 배지 |
| `backup/progress.json` | 학습 기록(아티팩트 DB `state/progress`) 백업 — 복원용 |
| `CLAUDE.md`, `.claude/skills/` | Claude 작업 규칙과 스킬: `exam-kb`(카드·문제·검수), `kb-annotate`(DB 기록), `artifact-release`(게시·백업), `artifact-restore`(복원) |
| `build_artifact.py` | 기준 페이지 + 조각 → `orgmaster.html`(게시용 본문) 과 테스트용 `site/index.html` |
| `dist/orgmaster.html` | **게시한 최종 페이지** (버전 32 시점). 빌드 없이도 이 파일로 복구할 수 있습니다. |
| `site/data/laws/*.json` | 규정 8종 본문 (처음 열 때 불러옴) — `convert_regs.py` 로 생성 |
| `site/data/quiz/*.json` | 기출 12 + 스터디 문제 98 묶음 — `quiz/convert_quiz.py` 로 생성 후 후처리(아래) |
| `site/*.json` | 규정 목차, 문제 목차, 기록 이전표, 새 복습 카드 |
| `regs.json`, `quiz/dump.json` | 선배 앱에서 뽑은 원본 데이터 |
| `tests/` | 크롬 브라우저 테스트 (아래) |

## 다시 만들기
```
python -X utf8 convert_regs.py     # 규정 JSON + 목차 (빈칸 b1/b2 자동 생성)
python -X utf8 make_cards.py       # 새 규정 복습 카드
python -X utf8 build_artifact.py   # orgmaster.html, site/index.html
```
(한글이 깨지면 반드시 `python -X utf8` 로 실행하세요. `-I` 는 인코딩 설정을 무시합니다.)

### 규정 변환 규칙 (`convert_regs.py`)
- 원본은 괄호 대신 `~…~` 로 적혀 있어 `(…)` 로 되돌립니다. 괄호 뒤가 조사·어미면 붙여 씁니다("등록 ~…~ 을" → "등록(…)을").
- `3~4급`, `1급~4급`, `5년이상~10년미만` 같은 범위 표시는 그대로 둡니다.
- 줄·빈칸 위치는 바뀌지 않으므로 카드 id(=학습 기록)에 영향이 없습니다.

### 복습 카드 규칙 (`make_cards.py`)
카드 id 는 (파일, 조문, 줄, 빈칸 번호)로 정해져 다시 만들어도 같은 카드는 같은 id 입니다. 아래 빈칸은 카드로 쓰지 않고, 같은 조문의 다음 후보가 대신 들어갑니다.
1. **찍기 카드**: 정답이 흔한 직위·동사(회장, 기관장, 승인 …)인데 문장이 짧거나(70자 미만) "따로 정한다" 꼴
2. **괄호 안 빈칸**: 빈칸이 `( … )` 보충 설명 안에 있음
3. **정답 노출**: 정답이 질문(제목 포함) 다른 곳에 보임
4. 긴 문장은 빈칸 주변만 남기고, 빈칸 표시는 줄바꿈 없는 공백 `( ? )` 라 폰에서 갈라지지 않습니다.

마지막에 모든 카드를 다시 검사해서(빈칸 1개, `~` 없음, 깨진 글자 없음, 위 규칙) 하나라도 어기면 **파일을 쓰지 않고 멈춥니다.**
학습 기록을 지키려면 DB `state/progress` 를 내려받아 함께 넘기세요. 빠지는 카드에 기록이 있으면 멈춥니다.
```
python -X utf8 make_cards.py --progress progress.json
```

## 테스트
```
cd site && python -m http.server 8765          # 다른 터미널에서
cd tests && npm install && node card-test.mjs  # quiz-test, law-test, split-test, ux4-test, ui7-test … 도 같은 방식
```
Chrome 경로는 `C:/Program Files/Google/Chrome/Application/chrome.exe` 로 되어 있습니다.
`rev-test`의 favicon 404, `ux-test`의 "장 칩 생성"은 알려진 무해한 항목(테스트 가정)입니다.

## 게시
Artifact 도구로 `orgmaster.html` 을 같은 URL에 게시하고, `data/laws/*.json`, `data/quiz/*.json` 중 **바뀐 파일만** `files` 로 함께 올립니다(빠진 파일은 이전 것이 그대로 남음).
게시 도구는 Claude 작업 폴더·임시 폴더 안의 파일만 받으므로, 임시 폴더에 `orgmaster.html` 과 `data/...` 를 복사한 뒤 그 폴더를 `root` 로 줍니다.
규정·문제 파일에 깨진 글자(U+FFFD)가 있으면 게시가 거부됩니다. 게시 전에 게시본이 `dist/orgmaster.html` 과 같은지 확인하세요(다른 곳에서 바뀐 내용을 덮어쓰지 않도록).

## 데이터 후처리 기록 (다시 변환하면 같은 처리를 해야 함)
- 문제: 보기·답이 맞지 않는 객관식 47문항 → 직접 채점형(`sa`)으로 변경, 정답 없는 30문항은 `(정답 미등록)`.
- 문제: 선배 앱 원본에서 깨진 글자 9문제 복구 → `quiz/FFFD_REPAIRS.md`
- 문제: 원문 복원본 2024·2025 기출은 선배 앱 기출(`past-07`, `past-08`)과 번호까지 같은 시험이라 제거하고, 복원본의 더 풍부한 해설 18건을 옮김, 풀이 기록은 `site/exmap.json` 으로 이전 (`dedupe_exam.py`)
- 문제 목차의 `file` 경로를 `data/quiz/<id>.json` 으로 통일

## 알려진 한계 / 다음 할 일
- 게시된 뷰어에서 규정·문제 파일 불러오기는 사용자가 확인함(2026-10-17, 정상).
- 조직법·정관·직원 운영규정 3종의 복습 카드(366장)는 손으로 만든 것이고, 새 규정 7종 253장은 빈칸에서 자동 생성한 것입니다(버전 25에서 306 → 253장으로 다듬음). 180자가 넘는 긴 질문 카드는 일부러 그대로 두었습니다.
- 2027년 개정 규정: 🆕 개정 탭의 "개정 전·후 비교"에 JSON 을 붙여 넣는 방식(프롬프트는 탭에서 복사). 데이터가 오면 시험해 볼 것.
- 조각들이 함수를 덮어쓰는 구조라 읽기 어렵습니다. 안정화되면 한 파일로 정리(리팩터링)하는 것을 권장합니다.
