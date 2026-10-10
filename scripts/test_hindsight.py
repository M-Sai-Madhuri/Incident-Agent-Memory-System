import os
from dotenv import load_dotenv

# Load Env
load_dotenv()

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.hindsight_service import hindsight_service
from services.incident_engine import incident_engine

def run_tests():
    print(f"Hindsight Connection Status: {'Connected' if hindsight_service.is_connected else 'Disconnected (Mock Mode)'}")
    print(f"Memory Bank: {hindsight_service.bank_id}")
    print("="*50)

    if not hindsight_service.is_connected:
        print("Hindsight is not connected properly. Exiting tests.")
        return

    # 1. Retain test incident
    print("Test 1: Retain Historical Incident")
    test_incident = {
        "incident_id": "TEST-INC-999",
        "service": "test-service",
        "summary": "Database connectivity failed under high load",
        "root_cause": "Test DB timeout"
    }
    retain_res = hindsight_service.retain_incident(test_incident)
    print(f"Retain status: {'Success' if retain_res else 'Failed'}")
    print("-" * 30)

    # 2. Recall Test
    print("Test 2: Recall Similar Incident")
    memories = hindsight_service.recall("Database connectivity failed")
    found_test = any("TEST-INC-999" in str(mem.get('content', '')) for mem in memories)
    print(f"Recall successful, found {len(memories)} memories.")
    print(f"Found test incident in recall? {found_test}")
    print("-" * 30)

    # 3. Reflect Test
    print("Test 3: Reflect over memory")
    reflection = hindsight_service.reflect("Database connectivity failed")
    print("Reflection Output:")
    print(reflection)
    print("-" * 30)

    # 4. Postmortem Learning Test
    print("Test 4: Store Postmortem Learning")
    test_pm = {
        "postmortem_id": "PM-TEST-999",
        "service": "test-service",
        "lesson_learned": "Increase connection limits during high load testing.",
        "root_cause": "Test DB timeout"
    }
    pm_res = hindsight_service.retain_postmortem(test_pm)
    print(f"Postmortem Retain status: {'Success' if pm_res else 'Failed'}")
    
    # 5. Future Incident Test
    print("Test 5: Future incident retrieves the newly stored lesson")
    pm_recall = hindsight_service.recall("test-service high load")
    found_lesson = any("Increase connection limits" in str(mem.get('content', '')) for mem in pm_recall)
    print(f"Found new lesson in future recall? {found_lesson}")
    print("="*50)
    print("ALL TESTS COMPLETED.")

if __name__ == "__main__":
    run_tests()
