# Quiz conversion report

- senior: 4157 questions in 98 packages; past: 393 in 12
- per-package counts match source (no mismatch anomalies listed below if OK)
- converted items: 4550; unique ids: 4550 (all unique: True)
- kinds: {'mc': 2567, 'sa': 1157, 'ox': 826}
- answer encoding (source): mc = digit string "3" or "1, 3" (1-based), converted to circled digits in the given order (not sorted); ox = already exactly "O"/"X"; sa unchanged. Unparseable mc answers (empty / letter-labelled) are kept raw.
- text preservation: source chars (title+content+choices, newlines removed) = 980124; converted q chars after removing circled markers/newlines = 979468; equal: False
- extra fields: {'hint': 10}; examples: {"hint": ["무력충돌 시 적용되는 법규를 일컫는 다양한 명칭들을 떠올려 보세요.", "책이 출간된 연도가 뒤낭의 활동 시기와 맞는지 확인해 보세요.", "국제적 무력충돌과 비국제적 무력충돌 시 신분 규정의 차이점을 생각해보세요."]}
- questions whose q equals another question q: 341 (distinct duplicated texts: 166); within-group dup counts: {"sen-070": 6, "sen-047": 4, "sen-013": 10, "sen-053": 2, "sen-005": 2, "sen-039": 2}
- mc explanations stating "정답 N" that disagree with answer: ['sen-023-19', 'sen-079-4'] (2)

## Anomalies (168)

- sen-004 #11: duplicate questionNumber 01
- sen-004 #12: duplicate questionNumber 02
- sen-004 #13: duplicate questionNumber 03
- sen-004 #14: duplicate questionNumber 04
- sen-004 #15: duplicate questionNumber 05
- sen-004 #16: duplicate questionNumber 06
- sen-004 #17: duplicate questionNumber 07
- sen-004 #18: duplicate questionNumber 08
- sen-004 #19: duplicate questionNumber 09
- sen-004 #20: duplicate questionNumber 10
- sen-004 #21: duplicate questionNumber 01
- sen-004 #22: duplicate questionNumber 02
- sen-004 #23: duplicate questionNumber 03
- sen-004 #24: duplicate questionNumber 04
- sen-004 #25: duplicate questionNumber 05
- sen-004 #26: duplicate questionNumber 06
- sen-004 #27: duplicate questionNumber 07
- sen-004 #28: duplicate questionNumber 08
- sen-004 #29: duplicate questionNumber 09
- sen-004 #30: duplicate questionNumber 10
- sen-004 #31: duplicate questionNumber 01
- sen-004 #32: duplicate questionNumber 02
- sen-004 #33: duplicate questionNumber 03
- sen-004 #34: duplicate questionNumber 04
- sen-004 #35: duplicate questionNumber 05
- sen-004 #36: duplicate questionNumber 06
- sen-004 #37: duplicate questionNumber 07
- sen-004 #38: duplicate questionNumber 08
- sen-004 #39: duplicate questionNumber 09
- sen-004 #40: duplicate questionNumber 10
- sen-005 #11: duplicate questionNumber 01
- sen-005 #12: duplicate questionNumber 02
- sen-005 #13: duplicate questionNumber 03
- sen-005 #14: duplicate questionNumber 04
- sen-005 #15: duplicate questionNumber 05
- sen-005 #16: duplicate questionNumber 06
- sen-005 #17: duplicate questionNumber 07
- sen-005 #18: duplicate questionNumber 08
- sen-005 #19: duplicate questionNumber 09
- sen-005 #20: duplicate questionNumber 10
- sen-005 #23: duplicate questionNumber 01
- sen-005 #24: duplicate questionNumber 02
- sen-005 #25: duplicate questionNumber 03
- sen-005 #26: duplicate questionNumber 04
- sen-005 #27: duplicate questionNumber 05
- sen-005 #28: duplicate questionNumber 06
- sen-005 #29: duplicate questionNumber 07
- sen-005 #30: duplicate questionNumber 08
- sen-005 #31: duplicate questionNumber 09
- sen-005 #32: duplicate questionNumber 10
- sen-005 #33: duplicate questionNumber 01
- sen-005 #34: duplicate questionNumber 02
- sen-005 #35: duplicate questionNumber 03
- sen-005 #36: duplicate questionNumber 04
- sen-005 #37: duplicate questionNumber 05
- sen-005 #38: duplicate questionNumber 06
- sen-005 #39: duplicate questionNumber 07
- sen-005 #40: duplicate questionNumber 08
- sen-005 #41: duplicate questionNumber 09
- sen-005 #42: duplicate questionNumber 10
- sen-015 #36: mc without choices (answer "2, 3, 6, 1, 5")
- sen-015 #36: mc answer "2, 3, 6, 1, 5" exceeds choices count 0
- sen-018 #56: mc without choices (answer "a: 이재민, b: 수용보호, c: 이동진료소, d: 봉사실, e: 자매적십자사, f: 상호협력, g: 재회알선")
- sen-018 #56: mc answer unparseable "a: 이재민, b: 수용보호, c: 이동진료소, d: 봉사실, e: 자매적십자사, f: 상호협력, g: 재회" kept raw
- sen-021 #58: mc without choices (answer "가: 기본방향, 나: 대상기관, 다: 일정, 라: 교육계획, 마: 개선계획")
- sen-021 #58: mc answer unparseable "가: 기본방향, 나: 대상기관, 다: 일정, 라: 교육계획, 마: 개선계획" kept raw
- sen-027 #9: mc answer "3" exceeds choices count 2
- sen-032 #59: duplicate questionNumber 이은주-01
- sen-032 #60: duplicate questionNumber 이은주-02
- sen-032 #61: duplicate questionNumber 이은주-03
- sen-032 #62: duplicate questionNumber 이은주-04
- sen-032 #63: duplicate questionNumber 이은주-05
- sen-032 #64: duplicate questionNumber 이은주-06
- sen-032 #65: duplicate questionNumber 이은주-07
- sen-032 #66: duplicate questionNumber 이은주-08
- sen-032 #67: duplicate questionNumber 이은주-09
- sen-032 #68: duplicate questionNumber 이은주-10
- sen-033 #26: duplicate questionNumber 김은지-01
- sen-033 #27: duplicate questionNumber 김은지-02
- sen-033 #28: duplicate questionNumber 김은지-03
- sen-033 #29: duplicate questionNumber 김은지-04
- sen-033 #30: duplicate questionNumber 김은지-05
- sen-033 #31: duplicate questionNumber 김은지-06
- sen-033 #32: duplicate questionNumber 김은지-07
- sen-033 #33: duplicate questionNumber 김은지-08
- sen-033 #34: duplicate questionNumber 김은지-09
- sen-033 #35: duplicate questionNumber 김은지-10
- sen-033 #59: mc without choices (answer "3, 2")
- sen-033 #59: mc answer "3, 2" exceeds choices count 0
- sen-033 #66: mc without choices (answer "5")
- sen-033 #66: mc answer "5" exceeds choices count 0
- sen-034 #18: mc answer "1, 2, 3, 5" exceeds choices count 4
- sen-035 #2: mc without choices (answer "2")
- sen-035 #2: mc answer "2" exceeds choices count 0
- sen-035 #24: duplicate questionNumber 이은주-01
- sen-035 #25: duplicate questionNumber 이은주-02
- sen-035 #26: duplicate questionNumber 이은주-03
- sen-035 #27: duplicate questionNumber 이은주-04
- sen-035 #28: duplicate questionNumber 이은주-05
- sen-035 #29: duplicate questionNumber 이은주-06
- sen-035 #30: duplicate questionNumber 이은주-07
- sen-035 #31: duplicate questionNumber 이은주-08
- sen-035 #32: duplicate questionNumber 이은주-09
- sen-035 #33: duplicate questionNumber 이은주-10
- sen-035 #34: duplicate questionNumber 이은주-11
- sen-037 #15: mc answer EMPTY
- sen-037 #16: mc answer EMPTY
- sen-037 #19: mc answer EMPTY
- sen-037 #32: mc without choices (answer "7")
- sen-037 #32: mc answer "7" exceeds choices count 0
- sen-038 #44: mc without choices (answer "3")
- sen-038 #44: mc answer "3" exceeds choices count 0
- sen-041 #1: mc answer EMPTY
- sen-041 #2: mc answer EMPTY
- sen-041 #3: mc answer EMPTY
- sen-041 #4: mc answer EMPTY
- sen-041 #5: mc answer EMPTY
- sen-041 #6: mc answer EMPTY
- sen-041 #7: mc answer EMPTY
- sen-041 #9: mc answer EMPTY
- sen-041 #10: mc answer EMPTY
- sen-041 #21: mc answer EMPTY
- sen-041 #22: mc answer EMPTY
- sen-041 #23: mc answer EMPTY
- sen-041 #24: mc answer EMPTY
- sen-041 #26: mc answer EMPTY
- sen-041 #27: mc answer EMPTY
- sen-041 #28: mc answer EMPTY
- sen-041 #29: mc answer EMPTY
- sen-041 #30: mc answer EMPTY
- sen-041 #40: mc answer EMPTY
- sen-041 #41: mc answer EMPTY
- sen-048 #37: mc answer EMPTY
- sen-048 #39: mc without choices (answer "5, 4, 1, 6")
- sen-048 #39: mc answer "5, 4, 1, 6" exceeds choices count 0
- sen-054 #47: mc without choices (answer "2, 4")
- sen-054 #47: mc answer "2, 4" exceeds choices count 0
- sen-056 #25: mc without choices (answer "3, 2, 1, 1")
- sen-056 #25: mc answer "3, 2, 1, 1" exceeds choices count 0
- sen-056 #25: mc answer "3, 2, 1, 1" repeated digits (kept, order preserved)
- sen-057 #9: mc without choices (answer "5, 2, 1")
- sen-057 #9: mc answer "5, 2, 1" exceeds choices count 0
- sen-063 #1: mc answer EMPTY
- sen-063 #2: mc answer EMPTY
- sen-063 #3: mc answer EMPTY
- sen-063 #4: mc answer EMPTY
- sen-063 #5: mc answer EMPTY
- sen-063 #6: mc answer EMPTY
- sen-070 #32: mc without choices (answer "5")
- sen-070 #32: mc answer "5" exceeds choices count 0
- sen-070 #36: mc answer "4" exceeds choices count 2
- sen-070 #41: mc answer "1, 3, 4" exceeds choices count 2
- sen-070 #42: mc without choices (answer "3")
- sen-070 #42: mc answer "3" exceeds choices count 0
- sen-070 #46: mc answer "1, 2" exceeds choices count 1
- sen-071 #22: mc without choices (answer "5, 2, 2, 9, 1")
- sen-071 #22: mc answer "5, 2, 2, 9, 1" exceeds choices count 0
- sen-071 #22: mc answer "5, 2, 2, 9, 1" repeated digits (kept, order preserved)
- sen-072 #20: mc without choices (answer "3, 4, 7")
- sen-072 #20: mc answer "3, 4, 7" exceeds choices count 0
- sen-080 #9: duplicate questionNumber 빈-01
- sen-080 #10: duplicate questionNumber 빈-02
- sen-080 #11: duplicate questionNumber 빈-03
- sen-080 #12: duplicate questionNumber 빈-04
- sen-080 #13: duplicate questionNumber 빈-05
- sen-080 #14: duplicate questionNumber 빈-06
- sen-080 #15: duplicate questionNumber 빈-07
- sen-080 #16: duplicate questionNumber 빈-08

## regulationName -> area

| raw | count | area |
|---|---|---|
| '국제인도법 질문과 답변' | 1000 | '국제인도법' |
| '직원' | 646 | '운영규정' |
| '보수' | 505 | '보수운영규정' |
| '규약' | 472 | '국제적십자규약' |
| '재무' | 386 | '재무규정' |
| '인사관리' | 381 | '인사관리시행규칙' |
| '감사' | 245 | '감사운영규정' |
| '여비' | 230 | '여비규정' |
| '정관' | 220 | '정관' |
| '조직법' | 207 | '조직법' |
| '조직법 | 정관' | 136 | '조직법' |
| '국제인도법' | 35 | '국제인도법' |
| '직원 | 인사관리' | 27 | '운영규정' |
| '직원 | 보수' | 14 | '운영규정' |
| '조직법 | 정관 | 재무' | 10 | '조직법' |
| '직원 | 인사관리 | 보수' | 6 | '운영규정' |
| '직원 | 보수 | 인사관리' | 5 | '운영규정' |
| '여비 | 감사' | 3 | '여비규정' |
| '정관 | 보수' | 2 | '정관' |
| '직원 | 보수 | 감사' | 2 | '운영규정' |
| '재무 | 여비 | 감사' | 2 | '재무규정' |
| '조직법 | 정관 | 직원' | 1 | '조직법' |
| '직원 | 재무 | 여비' | 1 | '운영규정' |
| '직원 | 감사' | 1 | '운영규정' |
| '조직법 | 정관 | 재무운영규정' | 1 | '조직법' |
| '조직법, 정관 | 재무' | 1 | '조직법' |
| '정관 | 직원 | 재무' | 1 | '정관' |
| '정관 | 직원 | 인사관리' | 1 | '정관' |
| '조직법 | 직원 | 감사 | 인사관리' | 1 | '조직법' |
| '정관 | 직원 | 보수 | 감사' | 1 | '정관' |
| '국제인도법 | 규약' | 1 | '국제인도법' |
| '조직법 | 정관 | 보수 | 인사관리' | 1 | '조직법' |
| '재무(계약)' | 1 | '재무규정' |
| '국제인도법 질문과 답변 | 규약' | 1 | '국제인도법' |
| '조직법 | 재무' | 1 | '조직법' |
| '기타' | 1 | '기타' |
| '재무 | 조직법' | 1 | '재무규정' |

## File sizes (KB)

- site/data/quiz/past-01.json: 21.4
- site/data/quiz/past-02.json: 22.1
- site/data/quiz/past-03.json: 28.4
- site/data/quiz/past-04.json: 39.7
- site/data/quiz/past-05.json: 37.1
- site/data/quiz/past-06.json: 56.0
- site/data/quiz/past-07.json: 42.8
- site/data/quiz/past-08.json: 41.9
- site/data/quiz/past-09.json: 19.6
- site/data/quiz/past-10.json: 18.7
- site/data/quiz/past-11.json: 20.3
- site/data/quiz/past-12.json: 17.0
- site/data/quiz/sen-001.json: 27.9
- site/data/quiz/sen-002.json: 51.4
- site/data/quiz/sen-003.json: 44.9
- site/data/quiz/sen-004.json: 20.0
- site/data/quiz/sen-005.json: 20.0
- site/data/quiz/sen-006.json: 24.2
- site/data/quiz/sen-007.json: 21.2
- site/data/quiz/sen-008.json: 19.9
- site/data/quiz/sen-009.json: 22.7
- site/data/quiz/sen-010.json: 21.0
- site/data/quiz/sen-011.json: 19.9
- site/data/quiz/sen-012.json: 16.6
- site/data/quiz/sen-013.json: 15.7
- site/data/quiz/sen-014.json: 19.0
- site/data/quiz/sen-015.json: 42.0
- site/data/quiz/sen-016.json: 32.8
- site/data/quiz/sen-017.json: 40.5
- site/data/quiz/sen-018.json: 43.4
- site/data/quiz/sen-019.json: 50.6
- site/data/quiz/sen-020.json: 49.1
- site/data/quiz/sen-021.json: 47.4
- site/data/quiz/sen-022.json: 22.2
- site/data/quiz/sen-023.json: 28.3
- site/data/quiz/sen-024.json: 29.2
- site/data/quiz/sen-025.json: 33.2
- site/data/quiz/sen-026.json: 23.3
- site/data/quiz/sen-027.json: 22.0
- site/data/quiz/sen-028.json: 23.2
- site/data/quiz/sen-029.json: 24.8
- site/data/quiz/sen-030.json: 22.6
- site/data/quiz/sen-031.json: 29.7
- site/data/quiz/sen-032.json: 32.6
- site/data/quiz/sen-033.json: 34.1
- site/data/quiz/sen-034.json: 35.8
- site/data/quiz/sen-035.json: 27.4
- site/data/quiz/sen-036.json: 41.2
- site/data/quiz/sen-037.json: 23.9
- site/data/quiz/sen-038.json: 44.2
- site/data/quiz/sen-039.json: 55.3
- site/data/quiz/sen-040.json: 32.3
- site/data/quiz/sen-041.json: 45.6
- site/data/quiz/sen-042.json: 33.8
- site/data/quiz/sen-043.json: 52.1
- site/data/quiz/sen-044.json: 55.8
- site/data/quiz/sen-045.json: 50.6
- site/data/quiz/sen-046.json: 57.4
- site/data/quiz/sen-047.json: 37.9
- site/data/quiz/sen-048.json: 22.1
- site/data/quiz/sen-049.json: 22.2
- site/data/quiz/sen-050.json: 30.0
- site/data/quiz/sen-051.json: 27.5
- site/data/quiz/sen-052.json: 17.1
- site/data/quiz/sen-053.json: 10.6
- site/data/quiz/sen-054.json: 50.8
- site/data/quiz/sen-055.json: 35.2
- site/data/quiz/sen-056.json: 48.6
- site/data/quiz/sen-057.json: 23.3
- site/data/quiz/sen-058.json: 23.0
- site/data/quiz/sen-059.json: 16.9
- site/data/quiz/sen-060.json: 18.7
- site/data/quiz/sen-061.json: 42.9
- site/data/quiz/sen-062.json: 13.1
- site/data/quiz/sen-063.json: 22.0
- site/data/quiz/sen-064.json: 22.8
- site/data/quiz/sen-065.json: 18.5
- site/data/quiz/sen-066.json: 21.8
- site/data/quiz/sen-067.json: 22.6
- site/data/quiz/sen-068.json: 19.1
- site/data/quiz/sen-069.json: 19.4
- site/data/quiz/sen-070.json: 41.5
- site/data/quiz/sen-071.json: 24.1
- site/data/quiz/sen-072.json: 24.5
- site/data/quiz/sen-073.json: 6.0
- site/data/quiz/sen-074.json: 28.4
- site/data/quiz/sen-075.json: 54.3
- site/data/quiz/sen-076.json: 30.6
- site/data/quiz/sen-077.json: 33.9
- site/data/quiz/sen-078.json: 27.2
- site/data/quiz/sen-079.json: 31.1
- site/data/quiz/sen-080.json: 32.5
- site/data/quiz/sen-081.json: 29.0
- site/data/quiz/sen-082.json: 30.9
- site/data/quiz/sen-083.json: 30.3
- site/data/quiz/sen-084.json: 29.6
- site/data/quiz/sen-085.json: 22.0
- site/data/quiz/sen-086.json: 24.8
- site/data/quiz/sen-087.json: 26.6
- site/data/quiz/sen-088.json: 32.9
- site/data/quiz/sen-089.json: 24.1
- site/data/quiz/sen-090.json: 23.1
- site/data/quiz/sen-091.json: 23.0
- site/data/quiz/sen-092.json: 40.8
- site/data/quiz/sen-093.json: 44.2
- site/data/quiz/sen-094.json: 43.3
- site/data/quiz/sen-095.json: 54.9
- site/data/quiz/sen-096.json: 41.5
- site/data/quiz/sen-097.json: 32.9
- site/data/quiz/sen-098.json: 34.6
- site/quizindex.json: 28.2

Total group data: 3404.4 KB. Largest 5: sen-046.json 57.4KB, past-06.json 56.0KB, sen-044.json 55.8KB, sen-039.json 55.3KB, sen-095.json 54.9KB

## Samples

```json
{"id": "past-05-2", "grp": "past-05", "no": 2, "kind": "mc", "area": "정관", "q": "정관 및 직원보수운영규정에 관한 사항이다. 다음 【보기】의 설명 중 옳지 않은 것은 몇 개인가?\n【보기】\n가. 임원과 고문의 처우에 관한 사항은 회장이 정한다.\n나. 상근 임원 및 고문의 보수에 관한 사항은 운영규정으로 정한다.\n다. 부회장은 직원보수운영규정의 적용을 받는다.\n라. 사무총장은 한 차례만 중임할 수 있다.\n① 1개\n② 2개\n③ 3개\n④ 4개", "a": "④", "ex": "보기의 모든 설명이 규정과 맞지 않습니다. (임원 처우는 정관/이사회 권한, 부회장은 보수규정 적용 대상 아님, 사무총장 중임 제한 규정 등 확인 필요)"}
```
```json
{"id": "past-05-3", "grp": "past-05", "no": 3, "kind": "mc", "area": "정관", "q": "정관 중 ‘지사’에 관한 사항이다. 옳지 않은 것은?\n① 상임위원회는 지사사업과 업무에 관하여 심의한다.\n② 지사 관하 시·군·구에 지부를 설치할 수 있으며, 그 운영에 관한 사항은 시행규칙으로 정한다.\n③ 지사회장 선출절차에 관한 세부사항은 회장이 정하여 시행할 수 있다.\n④ 지사를 설치하고자 할 때 최초 상임위원회의 의장은 관할 시·도지사가 된다.", "a": "②", "ex": "지부의 설치와 운영에 관한 사항은 시행규칙이 아닌 지사운영규정 등 상위 규정에서 정하는 바에 따릅니다."}
```
```json
{"id": "past-05-4", "grp": "past-05", "no": 4, "kind": "mc", "area": "조직법", "q": "다음 【보기】를 읽고 가.∼마. 설명 중 조직법과 정관 규정을 따르지 않은 것은 몇 개인지 고르시오. (단, 서면결의는 고려하지 않음)\n【보기】\n대한적십자사 회장은 아래 안건을 처리하기 위하여 2022. 11. 15.에 제2차 중앙위원회와 제1차 전국대의원총회를 개최하고자 하였다. 그런데 2022. 11. 10.부터 폭설이 내리는 천재지변이 발생하여 중앙위원회는 개최하였으나 전국대의원총회는 개최하지 못하였다.\n\n〈중앙위원회 안건〉\n - 제1호 의안 : 2023년도 사업계획 및 예산안 심의·의결의 건\n- 제2호 의안 : 직원운영규정 개정안 심의·의결의 건\n- 제3호 의안 : 통영적십자병원 기숙사 건립안 심의·의결의 건\n\n〈전국대의원총회 안건〉\n- 제1호 의안 : 중앙위원회 위원 선출의 건\n- 제2호 의안 : 2023년도 사업계획 및 예산안 승인의 건\n\n\n가. 중앙위원회는 상정된 안건 모두 심의·의결하였다.\n나. 천재지변으로 중앙위원을 선출하지 못하였으므로 임기 만료된 중앙위원의 임기는 다음 중앙위원회 때까지 연장된다.\n다. 유공회원이 아니며, 회비를 납부하지 않은 A는 전국대의원이 될 수 없다.\n라. 회장은 다음 전국대의원총회를 2023. 1. 15.에소집하기로 결정하였다.\n마. 전국대의원총회는 전국대의원총회가 특히 필요하다고 인정하는 정책사항을 심의할 수 있다.\n① 1개\n② 2개\n③ 3개\n④ 4개", "a": "③", "ex": "천재지변 시 임기 연장 규정, 전국대의원 자격 요건, 정책사항 심의 권한 등에 대한 규정 위반 사항을 체크해야 합니다."}
```
```json
{"id": "sen-003-101", "grp": "sen-003", "no": 101, "kind": "ox", "area": "운영규정", "q": "다음 중 지문의 내용이 올바르면 O, 내용이 옳지 않으면 X를 표시하시오.\n감독기관의 감사부서 등에서 비위와 관련하여 내사 중이고, 중징계에 해당할 경우 해당 직원은 그 내용을 지체없이 당해 기관장 또는 소속기관장에게 신고하여야 한다.", "a": "X", "ex": ""}
```
```json
{"id": "sen-003-102", "grp": "sen-003", "no": 102, "kind": "ox", "area": "운영규정", "q": "다음 중 지문의 내용이 올바르면 O, 내용이 옳지 않으면 X를 표시하시오.\n회장은 사무총장, 본사 부서장 및 직할기관장, 혈액관리본부장 및 혈액관리본부 실·국장, 지사 사무처장, 의료원장, 병원사업본부장, 병원관리부원장, 소속기관장(혈액원 부원장 포함), 그 외 1급 직원에 대해 적격한지 여부를 심사할 수 있다.", "a": "X", "ex": ""}
```
```json
{"id": "sen-003-103", "grp": "sen-003", "no": 103, "kind": "ox", "area": "운영규정", "q": "다음 중 지문의 내용이 올바르면 O, 내용이 옳지 않으면 X를 표시하시오.\n육아휴직 신청 시점에 해당 직원 계속 근로기간이 6개월 미만인 경우에는 청원휴직 대상에서 제외된다.", "a": "X", "ex": ""}
```
```json
{"id": "sen-012-27", "grp": "sen-012", "no": 27, "kind": "sa", "area": "국제인도법", "q": "국제인도법에 관한 사항이다. □에 들어갈 단어를 순서대로 쓰시오.\n국제인도법은 주로 ㉮(□□) 채택과 ㉯(□□□) 형성을 통해 국가들이 발전시킨다. ㉯(□□□)(은)는 국가 실행의 밀도가 충분할 때, 즉 폭넓게 시행되고, ㉰(□□□)(을)를 띠며, 높은 빈도로 동일한 방식으로 실시되고, 국가들이 법에 따라 특정 방식으로 행동하거나 하지 않아야 한다는 믿음이 국가 실행에 수반되었을 때 형성된다.", "a": "가: 조약, 나: 관습법, 다: 대표성", "ex": "질문과답변 17쪽, 조약, 관습법, 대표성"}
```
```json
{"id": "sen-013-7", "grp": "sen-013", "no": 7, "kind": "sa", "area": "운영규정", "q": "□에 들어갈 단어를 순서대로 쓰시오.\n제5조(정의) ...\n8. \"복직\"이라 함은 휴직, ㉮(□□□□) 및 정직 중이거나 강등으로 직무에 종사하지 못하는 직원을 직위에 복귀시키는 것을 말한다.\n9. \"퇴직\"이라 함은 본 운영규정 제20조의 규정에 의한 결격사유의 발생 또는 정년에 의하여 면직되거나 직원의 원에 의하는 경우 기타 ㉯(□□)하는 것을 말한다.\n10. \"직렬\"이라 함은 직무의 성질이 유사하고 그 책임과 ㉰(□□□)의 정도가 상이한 직종의 군을 말한다.", "a": "가: 직위해제, 나: 이직, 다: 곤란성", "ex": "㉮직위해제, ㉯이직, ㉰곤란성"}
```
```json
{"id": "sen-013-8", "grp": "sen-013", "no": 8, "kind": "sa", "area": "운영규정", "q": "□에 들어갈 단어를 순서대로 쓰시오.\n제10조의5(개방형 직위) ... 혈액관리본부는 혈액관리본부장 직위와 부서장 ㉮(□□□)(을)를 개방형 직위로 하며, 의료원은 의료원장 직위와 팀장 1직위를 개방형직위로 할 수 있다.\n②제1항의 규정에 의한 개방형 직위에 대하여는 직위별로 직무의 내용·특성 등을 고려하여 ㉯(□□□□□□)(을)를 설정하고 그 요건을 갖춘 자를 임용하여야 한다.\n③개방형직위에 의해 임용되는 자가 ㉰(□□□□□)일 경우 이를 계약직원으로 하며, 개방형 계약직원의 임용기간은 제10조의4 제2항의 규정에도 불구하고 별도 규칙에서 정한 바에 따른다.", "a": "가: 1직위, 나: 직무수행요건, 다: 외부전문가", "ex": "㉮1직위, ㉯직무수행요건, ㉰외부전문가"}
```
## Note on text preservation
The char-count difference of 656 is fully explained: 328 source title/content lines already begin with a circled digit + space (10756 marker-like line starts in output minus 10428 added choice markers = 328; x2 chars). No text lost.

## Note on area mapping
Raw names are short forms (직원, 보수, 재무, 인사관리, 감사, 여비) and pipe-separated multi-area values ("조직법 | 정관 | 재무"). Rule: use the FIRST listed component, then substring-map (직원->운영규정, 인사관리->인사관리시행규칙, 보수->보수운영규정, 감사->감사운영규정, 재무->재무규정, 여비->여비규정, 규약->국제적십자규약). "기타" stays raw.
