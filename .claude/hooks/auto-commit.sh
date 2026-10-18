#!/bin/sh
# Stop: commit only verified study-map changes; never push.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
exec python "$CLAUDE_PROJECT_DIR/tools/study_harness.py" stop
