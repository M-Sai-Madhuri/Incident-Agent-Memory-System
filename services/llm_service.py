import os
import json

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct").strip("'").strip('"')
        self.has_key = bool(self.api_key)
        
        if self.has_key and self.api_key != "your_openrouter_api_key_here":
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=self.api_key,
                )
                print(f"OpenRouter client initialized with model: {self.model}")
            except Exception as e:
                print(f"Failed to initialize OpenRouter client: {e}")
                self.has_key = False
        else:
            self.has_key = False

    def generate_recommendation(self, incident, historical_evidence, reflection, runbooks):
        """Generate a JSON recommendation. Tries OpenRouter first, falls back to deterministic."""
        if self.has_key:
            try:
                result = self._openrouter_recommendation(incident, historical_evidence, reflection, runbooks)
                if result and '{' in result:
                    return result
            except Exception as e:
                print(f"Error calling OpenRouter API: {e}")
        
        # Always fall back to deterministic if OpenRouter fails or unavailable
        return self._deterministic_recommendation(incident, historical_evidence, reflection, runbooks)

    def _openrouter_recommendation(self, incident, historical_evidence, reflection, runbooks):
        """Call OpenRouter API for AI-powered recommendation."""
        evidence_text = "No historical evidence found."
        evidence_ids = []
        if historical_evidence:
            evidence_list = []
            for ev in historical_evidence:
                doc_id = ev.get('document_id') or ev.get('metadata', {}).get('incident_id') or ev.get('metadata', {}).get('postmortem_id') or "Unknown ID"
                evidence_ids.append(doc_id)
                if isinstance(ev['content'], dict):
                    text = ev['content'].get('summary') or ev['content'].get('lesson_learned') or str(ev['content'])
                else:
                    text = str(ev['content'])
                evidence_list.append(f"- [{ev['type'].upper()}] ID: {doc_id} - {text}")
            evidence_text = "\n".join(evidence_list)
            
        runbook_text = "No relevant runbooks found."
        if runbooks and runbooks[0]:
            rb = runbooks[0]
            runbook_text = f"Title: {rb.get('title')}\nInvestigation: {', '.join(rb.get('investigation', []))}\nResolution: {', '.join(rb.get('resolution', []))}"
            
        prompt = f"""You are a Senior SRE Copilot. We have an active incident. 
            
INCIDENT DETAILS:
Service: {incident.get('service')}
Severity: {incident.get('severity')}
Description: {incident.get('description')}
Error: {incident.get('error')}
Error Rate: {incident.get('error_rate')}
Recent Deployment: {incident.get('recent_deployment')}
Deployment Time: {incident.get('deployment_time')}
DB Utilization: {incident.get('db_utilization')}

HISTORICAL EVIDENCE (From Hindsight):
{evidence_text}

HINDSIGHT REFLECTION:
{reflection}

RECOMMENDED RUNBOOK:
{runbook_text}

Provide a concise, evidence-backed recommendation for resolving this incident. 
CRITICAL RULE: You must NEVER invent or hallucinate historical incidents, actions, postmortems, or lessons. If HISTORICAL EVIDENCE is empty, you MUST state that no history exists, and your `memory_insight` MUST clearly state "No historical memory available." Do NOT claim "historical patterns suggest" unless actual evidence is provided above.

You MUST respond with ONLY a valid JSON object matching this exact schema, without markdown blocks or any other text:
{{
  "incident_summary": "Short summary of the current incident",
  "historical_match": {{
    "level": "strong|moderate|none|conflicting",
    "summary": "Brief summary of how this matches history"
  }},
  "likely_causes": ["list of likely causes based on history"],
  "successful_historical_actions": ["list of actions that succeeded in the past"],
  "failed_historical_actions": ["list of actions that failed in the past"],
  "recommended_actions": ["The recommended investigation/resolution steps (numbered or bulleted)"],
  "actions_to_avoid": ["Actions to avoid based on past failures"],
  "runbook": {{"id": "runbook id if any", "title": "runbook title"}},
  "memory_insight": "Insight derived from historical reflection",
  "uncertainty": ["List any missing information or uncertainties"],
  "evidence": ["list of document IDs used as evidence"]
}}
"""

        import time
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a pragmatic, expert Site Reliability Engineer."},
                        {"role": "user", "content": prompt}
                    ]
                )
                print("OpenRouter API call SUCCESSFUL")
                return response.choices[0].message.content
            except Exception as e:
                if "503" in str(e) or "UNAVAILABLE" in str(e) or "429" in str(e):
                    print(f"OpenRouter overloaded, retrying ({attempt+1}/3)...")
                    time.sleep(3)
                else:
                    raise
        raise Exception("OpenRouter API unavailable after 3 retries")

    def _deterministic_recommendation(self, incident, historical_evidence, reflection, runbooks):
        service = incident.get('service', '').lower()
        
        successful_actions = []
        failed_actions = []
        root_causes = []
        evidence_ids = []
        
        for ev in historical_evidence:
            doc_id = ev.get('document_id') or ev.get('metadata', {}).get('incident_id') or ev.get('metadata', {}).get('postmortem_id') or ""
            if doc_id and doc_id not in evidence_ids:
                evidence_ids.append(doc_id)
                
            content = ev.get('content', {})
            if isinstance(content, dict):
                for action in content.get('successful_resolution', content.get('successful_actions', [])):
                    if action not in successful_actions: successful_actions.append(action)
                for action in content.get('failed_actions', []):
                    if action not in failed_actions: failed_actions.append(action)
                rc = content.get('root_cause', '')
                if rc and rc not in root_causes: root_causes.append(rc)
            else:
                if "rollback" in content.lower(): successful_actions.append("Rollback deployment")
                if "restart" in content.lower(): failed_actions.append("Restart without limits")
                
        # Fill in generic SRE recommendations based on service, but NEVER fabricate historical actions
        if 'payment' in service:
            recommendation = ["Check DB connection pool utilization", "Validate connection pool limits have not been reduced", "Rollback the deployment immediately"]
            actions_to_avoid = ["Do not restart API gateway", "Do not scale up pods"]
            level = "strong" if historical_evidence else "none"
        elif 'kubernetes' in service:
            recommendation = ["Check for OOMKilled events", "Review container memory limits", "Increase memory limits and redeploy"]
            actions_to_avoid = ["Restarting pods without fixing limits"]
            level = "strong" if historical_evidence else "none"
        elif 'redis' in service:
            recommendation = ["Check Redis memory usage", "Identify cache keys without TTL", "Remove stale cache patterns"]
            actions_to_avoid = ["DO NOT restart application instances"]
            level = "strong" if historical_evidence else "none"
        else:
            recommendation = ["Check recent deployment logs", "Review application metrics", "Check database connectivity"]
            actions_to_avoid = []
            level = "moderate" if historical_evidence else "none"
            
        rb_dict = {}
        if runbooks and runbooks[0]:
            rb = runbooks[0]
            if isinstance(rb, dict):
                rb_dict = {"id": rb.get('runbook_id', ''), "title": rb.get('title', '')}
            else:
                rb_dict = {"id": "Unknown", "title": "Runbook Match"}

        # Cap lists
        successful_actions = successful_actions[:5]
        failed_actions = failed_actions[:3]
        
        result = {
            "incident_summary": f"Incident in {service} with error {incident.get('error')}",
            "historical_match": {
                "level": level,
                "summary": "Matched previous similar incidents based on error and service."
            },
            "likely_causes": root_causes[:3] if root_causes else ["Configuration change", "Resource exhaustion"],
            "successful_historical_actions": successful_actions,
            "failed_historical_actions": failed_actions,
            "recommended_actions": recommendation,
            "actions_to_avoid": actions_to_avoid,
            "runbook": rb_dict,
            "memory_insight": reflection[:300] if reflection else "No deep insight available.",
            "uncertainty": ["Exact deployment diff is unknown" if incident.get('recent_deployment') else "No recent deployments noted"],
            "evidence": evidence_ids
        }
        return json.dumps(result)

llm_service = LLMService()
