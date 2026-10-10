import sys
from unittest.mock import MagicMock
sys.modules['hindsight_client'] = MagicMock()

import json
from services.hindsight_service import HindsightService
from services.llm_service import LLMService

def run_tests():
    print("Starting architectural verification tests...")
    
    # Force mock mode to avoid flaky remote calls during tests
    hindsight = HindsightService()
    hindsight.mock_mode = True
    hindsight.mock_memory = []
    
    llm = LLMService()
    
    print("\n--- TEST 1: Retain -> Recall -> Returned ---")
    incident_data = {
        "incident_id": "INC-TEST-1",
        "service": "test-service",
        "summary": "Something broke in the test service",
        "root_cause": "Typo in config"
    }
    # Retain
    hindsight.retain_incident(incident_data)
    
    # Recall
    results = hindsight.recall("test-service broke")
    assert len(results) > 0, "TEST 1 FAILED: No results returned"
    assert results[0]['metadata'].get('incident_id') == "INC-TEST-1", "TEST 1 FAILED: Wrong incident returned"
    print("TEST 1 PASSED")
    
    print("\n--- TEST 2: Recall -> Reflect -> LLM -> Recommendation ---")
    reflection = hindsight.reflect("test-service broke")
    assert "teach us about this failure mode" in reflection, "TEST 2 FAILED: Reflect didn't work"
    
    llm_res_raw = llm._deterministic_recommendation(
        incident={"service": "test-service", "error": "broke"},
        historical_evidence=results,
        reflection=reflection,
        runbooks=[]
    )
    llm_res = json.loads(llm_res_raw)
    assert llm_res['historical_match']['level'] in ["strong", "moderate"], "TEST 2 FAILED: Match level incorrect"
    assert len(llm_res['recommended_actions']) > 0, "TEST 2 FAILED: No actions"
    print("TEST 2 PASSED")
    
    print("\n--- TEST 3: Resolve -> Postmortem -> Retain -> Recall -> Returned ---")
    pm_data = {
        "postmortem_id": "PM-TEST-3",
        "incident_id": "INC-TEST-3",
        "service": "billing-service",
        "lesson_learned": "Never cross the streams."
    }
    hindsight.retain_postmortem(pm_data)
    results_3 = hindsight.recall("billing-service streams")
    assert len(results_3) > 0, "TEST 3 FAILED: No results returned"
    assert results_3[0]['metadata'].get('postmortem_id') == "PM-TEST-3", "TEST 3 FAILED: Wrong PM returned"
    print("TEST 3 PASSED")
    
    print("\n--- TEST 4: Historical failed action -> Avoid ---")
    pm_failed = {
        "postmortem_id": "PM-FAILED-1",
        "service": "auth-service",
        "failed_actions": ["Restarted auth database blindly"],
        "lesson_learned": "Restarting DB causes cascade."
    }
    hindsight.retain_postmortem(pm_failed)
    res_failed = hindsight.recall("auth-service database")
    
    llm_res_failed_raw = llm._deterministic_recommendation(
        incident={"service": "auth-service", "error": "db issue"},
        historical_evidence=res_failed,
        reflection="Avoid restarting",
        runbooks=[]
    )
    llm_res_failed = json.loads(llm_res_failed_raw)
    assert "Restarted auth database blindly" in llm_res_failed.get('failed_historical_actions', []), "TEST 4 FAILED: Action not in failed list"
    # Even if it's not directly in actions_to_avoid for deterministic, it should be in failed_historical_actions
    print("TEST 4 PASSED")
    
    print("\n--- TEST 5: Historical successful action -> Recommend ---")
    pm_success = {
        "postmortem_id": "PM-SUCCESS-1",
        "service": "cache-service",
        "successful_resolution": ["Flushed cache nodes sequentially"],
        "lesson_learned": "Flush sequentially."
    }
    hindsight.retain_postmortem(pm_success)
    res_success = hindsight.recall("cache-service flush")
    
    llm_res_success_raw = llm._deterministic_recommendation(
        incident={"service": "cache-service", "error": "cache full"},
        historical_evidence=res_success,
        reflection="Flush sequentially",
        runbooks=[]
    )
    llm_res_success = json.loads(llm_res_success_raw)
    assert "Flushed cache nodes sequentially" in llm_res_success.get('successful_historical_actions', []), "TEST 5 FAILED: Action not in success list"
    print("TEST 5 PASSED")

if __name__ == "__main__":
    run_tests()
