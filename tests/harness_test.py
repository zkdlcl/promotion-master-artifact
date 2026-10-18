import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('study_harness', REPO/'tools/study_harness.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)


class HarnessTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.root_patch = patch.object(h, 'ROOT', self.root)
        self.owned_patch = patch.object(h, 'OWNED', {'note.js', 'docs/progress.md'})
        self.root_patch.start(); self.owned_patch.start()
        h.git('init', '-b', 'main')
        h.git('config', 'user.name', 'Harness Test')
        h.git('config', 'user.email', 'harness@example.invalid')
        (self.root/'note.js').write_text('initial\n', encoding='utf8')
        h.git('add', 'note.js'); h.git('commit', '-m', 'initial')
        self.initial = h.git('rev-parse', 'HEAD')

    def tearDown(self):
        self.owned_patch.stop(); self.root_patch.stop(); self.temp.cleanup()

    def change(self):
        (self.root/'note.js').write_text('changed\n', encoding='utf8')

    def receipt(self):
        (h.state_dir()/'verified.json').write_text(json.dumps({'fingerprint': h.fingerprint(), 'base_head': h.git('rev-parse', 'HEAD').strip()}), encoding='utf8')

    def test_clean_no_commit(self):
        self.assertIn('변경 없음', h.auto_commit())
        self.assertEqual(h.git('rev-parse', 'HEAD'), self.initial)

    def test_missing_receipt_preserves_changes(self):
        self.change()
        self.assertIn('validate', h.auto_commit())
        self.assertEqual(h.git('rev-parse', 'HEAD'), self.initial)
        self.assertTrue(h.git('diff', '--name-only').strip())

    def test_stale_receipt_prevents_commit(self):
        self.change(); self.receipt()
        (self.root/'note.js').write_text('newer\n', encoding='utf8')
        self.assertIn('검증 후', h.auto_commit())
        self.assertEqual(h.git('rev-parse', 'HEAD'), self.initial)

    def test_verified_changes_only(self):
        self.change(); self.receipt()
        (self.root/'unrelated.txt').write_text('keep local', encoding='utf8')
        self.assertIn('자동 커밋 완료', h.auto_commit())
        self.assertEqual(h.git('show', '--format=', '--name-only', 'HEAD').strip(), 'note.js')
        self.assertIn('unrelated.txt', h.git('status', '--short'))
        self.assertEqual(h.git('remote').strip(), '')
        self.assertIn('변경 없음', h.auto_commit())

    def test_foreign_stage_preserved(self):
        self.change(); self.receipt()
        (self.root/'unrelated.txt').write_text('staged', encoding='utf8')
        h.git('add', 'unrelated.txt')
        self.assertIn('외 파일', h.auto_commit())
        self.assertEqual(h.git('diff', '--cached', '--name-only').strip(), 'unrelated.txt')

    def test_non_main_preserved(self):
        h.git('checkout', '-b', 'test-branch'); self.change(); self.receipt()
        self.assertIn('main', h.auto_commit())
        self.assertEqual(h.git('rev-parse', 'HEAD'), self.initial)

    def test_progress_notes_after_validation(self):
        self.change(); self.receipt()
        (self.root/'docs').mkdir()
        (self.root/'docs/progress.md').write_text('checked', encoding='utf8')
        self.assertIn('자동 커밋 완료', h.auto_commit())
        self.assertIn('docs/progress.md', h.git('show', '--format=', '--name-only', 'HEAD'))

    def test_checkpoint_is_local(self):
        message = h.checkpoint()
        self.assertIn('체크포인트', message)
        self.assertTrue((h.state_dir()/'handoff.md').exists())
        self.assertEqual(h.git('status', '--porcelain').strip(), '')

    def test_failed_validation_invalidates_old_receipt(self):
        self.change(); self.receipt()
        # 외부 검사 실패를 재현. git 호출은 실제 임시 저장소를 그대로 사용.
        original_run = h.run
        def fail_node(args, **kwargs):
            if args[0] == 'node':
                raise RuntimeError('test failure')
            return original_run(args, **kwargs)
        with patch.object(h, 'run', side_effect=fail_node):
            with self.assertRaises(RuntimeError):
                h.validate()
        self.assertFalse((h.state_dir()/'verified.json').exists())
        self.assertIn('validate', h.auto_commit())


if __name__ == '__main__':
    unittest.main()
