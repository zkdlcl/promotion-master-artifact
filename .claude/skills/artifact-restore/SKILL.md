---
name: artifact-restore
description: 승진고시 마스터 아티팩트가 사라졌거나 다른 계정·컴퓨터에서 다시 만들어야 할 때, git 저장소만으로 페이지·규정·문제·기출 근거 DB·학습 기록을 복원한다. "복원", "다시 만들어", "아티팩트가 없어졌어" 요청.
---

# 저장소에서 아티팩트 복원

저장소 하나에 복원에 필요한 것이 모두 있다.
| 무엇 | 어디 |
|---|---|
| 게시본 페이지 | `dist/orgmaster.html` (빌드 없이 바로 게시 가능) |
| 규정 8종 · 문제 110묶음 | `site/data/laws/*.json`, `site/data/quiz/*.json` (118개) |
| 기출 근거 DB | `kb/annot/*.json` → 빌드 때 페이지 안에 들어감 |
| 학습 기록 | `backup/progress.json` (마지막 백업 시점) |
| 소스·도구·테스트 | 나머지 전부 |

## 절차
1. `git clone https://github.com/zkdlcl/promotion-master-artifact.git` (비공개, 소유자 계정 필요)
2. (선택) 다시 빌드: `python -X utf8 build_artifact.py` — 아니면 `dist/orgmaster.html` 을 그대로 쓴다.
3. 게시 파일을 Claude 의 scratchpad 로 복사: `orgmaster.html` + `data/laws/*.json` + `data/quiz/*.json` (폴더 구조 유지).
4. **새 아티팩트로 게시**: `artifact-capabilities` 스킬을 먼저 불러온 뒤 `Artifact publish` — `file_path` = 복사한 `orgmaster.html`, `root` = 그 폴더, `files` = 데이터 118개, `capabilities: {"db": {}}`, `icon: "book"`. 한 번에 255개·64MB 이하라 한 번에 올라간다.
   - 기존 URL 이 살아 있고 페이지만 망가졌다면 `url` 을 주고 같은 방식으로 덮어쓴다(이때 capabilities 는 생략).
5. **학습 기록 넣기**: 새 아티팩트의 `state/progress` 가 비어 있는지 `ArtifactData get` 으로 확인한 뒤에만
   `ArtifactData set` (collection `state`, doc_id `progress`, file_path `backup/progress.json`).
   이미 기록이 있으면 덮어쓰지 말고 사용자에게 어느 쪽을 남길지 묻는다.
6. 열어서 확인: 회독 → 인사관리시행규칙, 기출·오답 → 2018년 4급 기출 풀기, 복습 카드 시작, 테마 전환.
7. 새 URL 을 README·`.claude/skills/*`·메모리에 고쳐 적고 커밋.

## 주의
- 학습 기록 백업은 마지막 백업 이후 것이 빠져 있을 수 있다. 원래 아티팩트가 살아 있으면 거기서 먼저 최신 기록을 받는다.
- 저장소는 비공개로 유지한다(학습 기록 포함). 공개로 바꾸는 일은 사용자에게 먼저 묻는다.
