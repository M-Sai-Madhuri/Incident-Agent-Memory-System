# Incident Memory Copilot

Every incident teaches the next incident.

## 1. Problem
During critical SEV-1 incidents, Site Reliability Engineers (SREs) and DevOps teams often waste valuable time digging through old Slack threads, fragmented Jira tickets, and outdated runbooks to figure out if an issue has occurred before. Institutional memory is frequently lost when engineers leave or simply forget the specifics of past outages.

## 2. Solution
The **Incident Memory Copilot** acts as an organizational brain for incident response. Instead of treating every incident as a brand-new problem, the copilot instantly recalls past incidents, postmortems, and runbooks, synthesizing actionable investigation steps backed by historical evidence. 

## 3. Why Memory Matters
A generic AI chatbot can only provide standard internet advice. The Incident Memory Copilot provides *your organization's* advice. By maintaining a living memory, it surfaces what worked and—crucially—warns engineers about actions that failed in the past, preventing repeated mistakes.

## 4. Architecture
- **Frontend:** Streamlit (Python) offering a premium classic, enterprise-grade SRE console.
- **Memory Engine:** Hindsight Cloud (Retain, Recall, Reflect).
- **Reasoning Engine:** Large Language Models via OpenRouter API.
- **Workflow Pipeline:** A strict JSON structured output pipeline ensuring evidence-based recommendations.

## 5. Hindsight Retain
"Store what we learned."  
When an incident is resolved and a postmortem is written, the copilot uses Hindsight's `retain` API to store the memory alongside rich metadata (incident ID, service, severity) and context.

## 6. Hindsight Recall
"Find relevant previous experience."  
When a new incident begins, the copilot queries the Hindsight vector database to recall semantically similar past incidents, postmortems, and runbooks.

## 7. Hindsight Reflect
"Reason over what we learned."  
Before generating a final plan, the copilot uses Hindsight `reflect` to reason over the recalled historical data, summarizing high-level patterns and identifying recurring themes.

## 8. Incident Lifecycle
1. **Investigate:** Current incident details are matched against historical memory.
2. **Resolve:** Engineer uses the historical insights to safely fix the issue.
3. **Learn:** A postmortem is written and *retained* back into the system.
4. **Remember:** Future incidents automatically benefit from the newly learned lesson.

## 9. Before/After Memory Example
**WITHOUT MEMORY:** 
"Check Redis memory usage and investigate cache saturation." (Generic)

**WITH MEMORY:** 
"Three similar incidents occurred. Two were resolved by enforcing TTL. A Redis restart previously caused a downstream database spike. Recommended: inspect TTL policy before restarting Redis." (Specific, evidence-based)

## 10. Setup
Clone the repository and install the dependencies.
```bash
pip install -r requirements.txt
```

## 11. Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```
HINDSIGHT_API_KEY=your_key_here
HINDSIGHT_BANK_ID=incident-response
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
```

## 12. Running
Start the application:
```bash
streamlit run app.py
```

## 13. Demo Scenarios
1. **Payment API (502 Errors):** Demonstrates connection pool exhaustion and rollback recommendations.
2. **Redis Cache:** Warns against dangerous historical actions (like restarting without TTLs).
3. **Kubernetes (OOMKilled):** Demonstrates learning from previous replica scaling failures.
4. **Learn Then Recall:** Submit an incident, write a postmortem, "Teach Memory," and then submit a similar incident to see the new memory applied immediately.

## 14. Testing
Tests can be executed natively (if test scripts are present) to validate deterministic fallbacks, JSON parsing, and memory retention.
```bash
python -m unittest test_api.py
```

## 15. Known Limitations
- If Hindsight Cloud is unavailable, the application degrades gracefully to a local mock memory matching mode.
- Recommendations are advisory; human approval is always required before production remediation.
