# 승진고시 마스터 (아티팩트) — Codex 작업 안내

Claude Code 와 같은 폴더를 번갈아 쓴다. 규칙의 원본은 `CLAUDE.md` 와 `README.md` 의 "Claude · Codex 같이 쓸 때". 아래는 핵심만.

- 사용자는 7년차 개발자. 기술 용어 그대로, 간결하게. UI: 태블릿 우선·아이콘만·칩 방식.
- 학습 기록(아티팩트 DB `state/progress`)은 읽기만. 백업은 `backup/progress.json`.
- 규정·문제 판단은 원문과 기출 근거 DB 로만. 기억·추측으로 숫자·주체·기한을 말하지 않는다.
- 게시는 Claude 만 한다. Codex 는 빌드·검증·커밋까지 하고 "게시 대기"로 인계한다. 푸시·공개 여부 등 외부에 영향 주는 일은 먼저 묻는다.

## 스킬 (원본: `.claude/skills/<이름>/SKILL.md` — 해당 작업이면 먼저 읽는다)
`exam-kb`(카드·문제·검수), `kb-annotate`(기출 DB 기록), `case-gen`(사례형·빈칸), `artifact-release`(빌드·게시·백업), `artifact-restore`(복원).

## 컨텍스트 아끼기 (필독)
- `kb/exam_kb.json`, `kb/annot/*.json`, `regs.json`, `quiz/dump.json`, `site/data/**`, `orgmaster*.html`, `dist/`, `base/*.html` 은 **통째로 읽지 않는다**(`tools/ctx_guard.py` 훅이 막는다).
- 조회는 `python -X utf8 tools/kbq.py digest <규정> | item <id> | art <규정:조문> | find <규정> <낱말> | err | ans <id>`. 출력은 약 5000자까지, 더 필요하면 `--offset`.
- 5문항(조문 묶음) 단위로 일하고, 끝날 때마다 `python -X utf8 tools/kbq.py checkpoint "<한 줄>"`. 컨텍스트 알림이 오면 사용자에게 새 세션(`/clear` 또는 새 대화)을 권한다. 새 세션은 SessionStart 훅이 `kb/진행상황.md` 발췌를 넣어 준다.
- 이어서 하기: "기출 DB 이어서" 요청이면 `kb/진행상황.md` 부터.
- Codex 훅 설정은 공개본에서 제외했다.
