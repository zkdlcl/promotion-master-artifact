# 승진고시 마스터 (아티팩트) 소스

claude.ai 아티팩트 **승진고시 마스터**(https://claude.ai/artifact/XmAgPN8DtD9eoujJX8naXs)의 소스·데이터·테스트 백업입니다.
학습 기록은 아티팩트 DB(`state/progress`)와 브라우저에 있고, 이 저장소에는 **페이지와 데이터**만 있습니다.

## 구조
| 경로 | 내용 |
|---|---|
| `base/orgmaster.base.html` | 출발점이 된 기존 페이지(게시 버전 16). 빌드는 이 위에 아래 조각들을 덧붙입니다. |
| `lawdata.js` `rev-tab.js` `ux-polish.js` `ux2.js` … `ux6.js` | 덧붙이는 기능 조각 (규정 불러오기, 개정 탭, 칩/패널/검색 화면, 뻥뚫, 일정, 문제 연동, 복습 카드). 뒤 파일이 앞 파일의 함수를 덮어쓰는 순서이므로 `build_artifact.py` 의 `js` 목록 순서가 중요합니다. |
| `*.css` | 위 조각에 딸린 스타일 |
| `build_artifact.py` | 기준 페이지 + 조각 → `orgmaster.html`(게시용 본문) 과 테스트용 `site/index.html` |
| `dist/orgmaster.html` | **게시한 최종 페이지** (버전 24 시점). 빌드 없이도 이 파일로 복구할 수 있습니다. |
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

## 테스트
```
cd site && python -m http.server 8765          # 다른 터미널에서
cd tests && npm install && node card-test.mjs  # quiz-test, law-test, split-test, ux4-test … 도 같은 방식
```
Chrome 경로는 `C:/Program Files/Google/Chrome/Application/chrome.exe` 로 되어 있습니다.
`rev-test`의 favicon 404, `ux-test`의 "장 칩 생성"은 알려진 무해한 항목(테스트 가정)입니다.

## 게시
Artifact 도구로 `orgmaster.html` 을 같은 URL에 게시하고, `root=site` 에서 `data/laws/*.json`, `data/quiz/*.json` 118개 파일을 `files` 로 함께 올립니다.
규정·문제 파일에 깨진 글자(U+FFFD)가 있으면 게시가 거부됩니다.

## 데이터 후처리 기록 (다시 변환하면 같은 처리를 해야 함)
- 문제: 보기·답이 맞지 않는 객관식 47문항 → 직접 채점형(`sa`)으로 변경, 정답 없는 30문항은 `(정답 미등록)`.
- 문제: 선배 앱 원본에서 깨진 글자 9문제 복구 → `quiz/FFFD_REPAIRS.md`
- 문제: 원문 복원본 2024·2025 기출은 선배 앱 기출(`past-07`, `past-08`)과 번호까지 같은 시험이라 제거하고, 복원본의 더 풍부한 해설 18건을 옮김, 풀이 기록은 `site/exmap.json` 으로 이전 (`dedupe_exam.py`)
- 문제 목차의 `file` 경로를 `data/quiz/<id>.json` 으로 통일

## 알려진 한계 / 다음 할 일
- 게시된 뷰어에서 규정·문제 파일을 실제로 불러오는지는 사람이 한 번 확인해야 합니다(회독에서 인사관리시행규칙, 기출에서 2018년 4급 기출).
- 조직법·정관·직원 운영규정 3종의 복습 카드(366장)는 손으로 만든 것이고, 새 규정 7종 306장은 빈칸에서 자동 생성한 것이라 질문이 덜 다듬어졌습니다.
- 2027년 개정 규정: 🆕 개정 탭의 "개정 전·후 비교"에 JSON 을 붙여 넣는 방식(프롬프트는 탭에서 복사). 데이터가 오면 시험해 볼 것.
- 조각들이 함수를 덮어쓰는 구조라 읽기 어렵습니다. 안정화되면 한 파일로 정리(리팩터링)하는 것을 권장합니다.
