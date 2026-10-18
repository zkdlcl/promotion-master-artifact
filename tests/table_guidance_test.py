import copy
import json
from pathlib import Path
import re
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import study_tables as t

source = (Path(__file__).resolve().parents[1]/'base/orgmaster.base.html').read_text(encoding='utf8')
BASE = json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>', source, re.S)[1])


class TableGuidanceTests(unittest.TestCase):
    def test_source_and_navigation(self):
        data = copy.deepcopy(BASE)
        t.enrich(data)
        self.assertEqual(data['articles'], BASE['articles'])
        self.assertEqual(data['cards'], BASE['cards'])
        self.assertEqual(len(re.findall(r'id="table-\d+"', data['tableHtml'])), 14)
        day = next(d for d in data['days'] if d['date'] == '2026-10-18')
        self.assertEqual(day['goals'][2]['table'], 10)
        self.assertEqual(day['goals'][4]['table'], 10)
        self.assertNotIn('table', day['goals'][1])
        self.assertIn('만 [[8세]] 이하 또는 초등학교 [[2학년]] 이하', data['tableHtml'])
        self.assertIn('만 [[12세]] 이하 또는 초등학교 [[6학년]] 이하', data['tableHtml'])
        self.assertIn('대상·기간·한도', data['tableHtml'])

    def test_explicit_numbers_and_card_goals(self):
        self.assertEqual(t.target_for_goal("📊 7번 '임용·채용 숫자' 표 백지 복원", ''), 7)
        self.assertEqual(t.target_for_goal("📊 '누가 임용·승인·결정하나' 표(8번)", ''), 8)
        self.assertEqual(t.target_for_goal('📊 운영규정 표 6·7·8·9·12번을 모두 가린 채 복원', ''), 6)
        self.assertIsNone(t.target_for_goal('🧠 카드 17·18번 주제 전체 무작위', ''))
        self.assertIsNone(t.target_for_goal('정관 제25~50조 + 별표 1회독', ''))

    def test_stale_age_fails_build(self):
        data = copy.deepcopy(BASE)
        art = next(a for a in data['articles'] if a['law'] == '운영규정' and a.get('no') == '53')
        art['html'] = art['html'].replace('8세', '9세')
        with self.assertRaises(ValueError):
            t.enrich(data)


if __name__ == '__main__':
    unittest.main()
