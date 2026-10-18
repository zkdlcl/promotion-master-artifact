#!/bin/sh
# Stop 훅: 작업이 끝나면 변경분을 커밋한다(푸시는 하지 않음). 변경이 없으면 아무것도 안 한다.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
[ -n "$(git status --porcelain)" ] || exit 0
git add -A
git commit -q -m "작업 자동 커밋 $(date '+%Y-%m-%d %H:%M')

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" >/dev/null 2>&1 \
  && echo '{"systemMessage":"자동 커밋 완료 (푸시는 하지 않음)"}'
exit 0
