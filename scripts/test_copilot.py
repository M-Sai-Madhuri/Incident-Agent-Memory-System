import unittest
from unittest.mock import patch, MagicMock
import json

from services.hindsight_service import HindsightService
from services.incident_engine import IncidentEngine
from services.llm_service import LLMService

class TestIncidentCopilot(unittest.TestCase):
    def setUp(self):
        # Fresh instances for each test
        self.hindsight_service = HindsightService()
        self.incident_engine = IncidentEngine()
        self.llm_service = LLMService()

    @patch('services.hindsight_service.Hindsight')
    def test_hindsight_connected(self, mock_hindsight):
        with patch('os.getenv', return_value="fake_key"):
            service = HindsightService()
            self.assertTrue(service.is_connected)
            self.assertFalse(service.mock_mode)

    @patch('services.hindsight_service.Hindsight')
    def test_hindsight_disconnected(self, mock_hindsight):
        with patch('os.getenv', return_value=""):
            service = HindsightService()
            self.assertFalse(service.is_connected)
            self.assertTrue(service.mock_mode)

    def test_mock_recall_returns_results(self):
        self.hindsight_service.mock_mode = True
        results = self.hindsight_service.recall("payment 502")
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]['type'], 'incident')

    def test_mock_recall_returns_zero_results(self):
        self.hindsight_service.mock_mode = True
        results = self.hindsight_service.recall("supercalifragilisticexpialidocious")
        self.assertEqual(len(results), 0)

    def test_mock_reflect_works(self):
        self.hindsight_service.mock_mode = True
        reflection = self.hindsight_service.reflect("payment 502")
        self.assertIn("teach us about this failure mode", reflection)

    def test_mock_retain_works(self):
        self.hindsight_service.mock_mode = True
        self.hindsight_service.mock_memory = []
        res = self.hindsight_service.retain_incident({"incident_id": "INC-TEST", "service": "test"})
        self.assertTrue(res)
        self.assertEqual(len(self.hindsight_service.mock_memory), 1)

    def test_postmortem_retention(self):
        self.hindsight_service.mock_mode = True
        self.hindsight_service.mock_memory = []
        res = self.hindsight_service.retain_postmortem({
            "postmortem_id": "PM-TEST", 
            "service": "test", 
            "lesson_learned": "test lesson"
        })
        self.assertTrue(res)
        self.assertEqual(len(self.hindsight_service.mock_memory), 1)

    def test_duplicate_retention_prevention(self):
        self.hindsight_service.mock_mode = True
        self.hindsight_service.mock_memory = []
        
        pm = {"postmortem_id": "PM-DUP", "service": "test"}
        self.hindsight_service.retain_postmortem(pm)
        self.assertEqual(len(self.hindsight_service.mock_memory), 1)
        
        # Retain again
        self.hindsight_service.retain_postmortem(pm)
        self.assertEqual(len(self.hindsight_service.mock_memory), 1) # Should not duplicate

    def test_llm_deterministic_fallback(self):
        incident = {"service": "payment-api", "error": "502"}
        evidence = [{"type": "incident", "content": {"successful_resolution": ["Restored connection"]}}]
        
        res_json = self.llm_service._deterministic_recommendation(incident, evidence, "mock reflection", [])
        data = json.loads(res_json)
        
        self.assertIn("Restored connection", data['successful_historical_actions'])
        self.assertIn("strong", data['historical_match']['level'])

    def test_new_postmortem_appears_in_future_recall(self):
        self.hindsight_service.mock_mode = True
        self.hindsight_service.mock_memory = []
        
        # Retain new memory
        self.hindsight_service.retain_postmortem({
            "postmortem_id": "PM-NEW123", 
            "service": "new-service-xyz",
            "lesson_learned": "we learned a new lesson today"
        })
        
        # Recall
        results = self.hindsight_service.recall("new-service-xyz lesson")
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['metadata'].get('postmortem_id'), "PM-NEW123")

if __name__ == '__main__':
    unittest.main()
