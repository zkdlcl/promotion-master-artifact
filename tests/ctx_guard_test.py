import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1] / 'tools'


def load(name):
    spec = importlib.util.spec_from_file_location(name, TOOLS / f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


guard, kbq = load('ctx_guard'), load('kbq')
R = guard.ROOT


def read(path, **kw):
    return guard.pretool({'tool_name': 'Read', 'tool_input': {'file_path': str(R / path), **kw}})


def bash(cmd):
    return guard.pretool({'tool_name': 'Bash', 'tool_input': {'command': cmd}})


def denied(result):
    return result.get('hookSpecificOutput', {}).get('permissionDecision') == 'deny'


class PreToolTest(unittest.TestCase):
    def setUp(self):
        os.environ.pop('CTX_GUARD', None)

    def test_read_whole_big_file_denied(self):
        self.assertTrue(denied(read('kb/exam_kb.json')))
        self.assertTrue(denied(read('kb/annot/운영규정.json')))
        self.assertTrue(denied(read('kb/exam_kb.json', limit=5000)))

    def test_read_with_limit_allowed(self):
        self.assertFalse(denied(read('kb/annot/운영규정.json', offset=10, limit=120)))

    def test_minified_never_readable(self):
        self.assertTrue(denied(read('regs.json', limit=50)))

    def test_small_or_unlisted_allowed(self):
        self.assertFalse(denied(read('CLAUDE.md')))
        self.assertFalse(denied(read('kb/study/가채점오류.md')))

    def test_bash_cat_denied_head_allowed(self):
        self.assertTrue(denied(bash('cat kb/exam_kb.json')))
        self.assertTrue(denied(bash(r'Get-Content .\dist\orgmaster.html')))
        self.assertFalse(denied(bash('head -50 kb/exam_kb.json')))
        self.assertFalse(denied(bash('python -X utf8 tools/kbq.py art 운영규정:53')))
        self.assertFalse(denied(bash('grep -n 직권면직 kb/annot/운영규정.json')))

    def test_env_switch_off(self):
        os.environ['CTX_GUARD'] = 'off'
        self.assertFalse(denied(read('kb/exam_kb.json')))


class PromptTest(unittest.TestCase):
    def test_stage_warns_once(self):
        with tempfile.TemporaryDirectory() as d:
            t = Path(d) / 't.jsonl'
            t.write_bytes(b'x' * (3 * 200000 * 55 // 100))      # 약 55%
            guard.state_dir = lambda: Path(d)
            data = {'transcript_path': str(t), 'session_id': 's1'}
            first = guard.prompt(data)
            self.assertIn('컨텍스트 약 55%', json.dumps(first, ensure_ascii=False))
            self.assertEqual(guard.prompt(data), {})
            t.write_bytes(b'x' * (3 * 200000 * 75 // 100))      # 70% 단계로 올라가면 다시 알림
            self.assertIn('75%', json.dumps(guard.prompt(data), ensure_ascii=False))

    def test_small_transcript_silent(self):
        with tempfile.TemporaryDirectory() as d:
            t = Path(d) / 't.jsonl'
            t.write_bytes(b'x' * 1000)
            guard.state_dir = lambda: Path(d)
            self.assertEqual(guard.prompt({'transcript_path': str(t)}), {})


class ResumeAndCheckpointTest(unittest.TestCase):
    def test_resume_injects_handoff_within_limit(self):
        ctx = guard.resume({})['hookSpecificOutput']['additionalContext']
        self.assertIn('다음 순서', ctx)
        self.assertLessEqual(len(ctx), 1500)

    def test_checkpoint_keeps_bom_and_caps_lines(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / 'kb').mkdir()
            f = Path(d) / 'kb' / '진행상황.md'
            f.write_bytes('\ufeff# 제목\n\n## 다음 순서\n1. 가\n\n## 작업 요령\n- 나\n'.encode('utf8'))
            kbq.ROOT = Path(d)
            for i in range(35):
                kbq.checkpoint([f'메모{i}'])
            raw = f.read_bytes()
            self.assertTrue(raw.startswith(b'\xef\xbb\xbf'))
            text = raw.decode('utf-8-sig')
            self.assertEqual(text.count('\n- ') - 1, 30)        # 세션 메모 30줄 + '작업 요령'의 1줄
            self.assertIn('메모34', text)
            self.assertNotIn('메모4 ', text + ' ')
            self.assertLess(text.index('## 세션 메모'), text.index('## 작업 요령'))
            self.assertNotIn(b'\r', raw)


if __name__ == '__main__':
    unittest.main()
