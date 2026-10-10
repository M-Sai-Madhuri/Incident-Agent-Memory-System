import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from dotenv import load_dotenv
load_dotenv()

from services.hindsight_service import hindsight_service
from services.incident_engine import incident_engine

# Test Scenario 1: Payment API
print("=" * 60)
print("SCENARIO 1: Payment API")
print("=" * 60)
memories = hindsight_service.recall("Payment API HTTP 502 Bad Gateway")
print(f"Total recall results: {len(memories)}")
for i, m in enumerate(memories):
    print(f"  [{i}] type={m['type']}, content_preview={str(m['content'])[:150]}")

# Now test the full engine
result = incident_engine.investigate({
    "service": "Payment API",
    "severity": "SEV-1",
    "error": "HTTP 502 Bad Gateway",
    "description": "Payment API returning 42% HTTP 502 errors after deployment.",
    "recent_deployment": "payment-service-v2.8.1"
})
print(f"\nsimilar_incidents count: {len(result['similar_incidents'])}")
print(f"lessons count: {len(result['lessons'])}")
for i, inc in enumerate(result['similar_incidents']):
    print(f"  similar[{i}]: {str(inc)[:150]}")
for i, les in enumerate(result['lessons']):
    print(f"  lesson[{i}]: {str(les)[:150]}")

# Test Scenario 2: Kubernetes
print("\n" + "=" * 60)
print("SCENARIO 2: Kubernetes")
print("=" * 60)
memories2 = hindsight_service.recall("kubernetes-cluster Pods in CrashLoopBackOff, OOMKilled events")
print(f"Total recall results: {len(memories2)}")
for i, m in enumerate(memories2):
    print(f"  [{i}] type={m['type']}, content_preview={str(m['content'])[:150]}")

# Test Scenario 3: Redis
print("\n" + "=" * 60)
print("SCENARIO 3: Redis")
print("=" * 60)
memories3 = hindsight_service.recall("redis-cache Cache full, elevated latency, and session drops")
print(f"Total recall results: {len(memories3)}")
for i, m in enumerate(memories3):
    print(f"  [{i}] type={m['type']}, content_preview={str(m['content'])[:150]}")
