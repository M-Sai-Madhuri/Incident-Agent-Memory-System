import os
import json
from datetime import datetime, timezone
from hindsight_client import Hindsight

class HindsightService:
    def __init__(self):
        self.api_key = os.getenv("HINDSIGHT_API_KEY")
        self.bank_id = os.getenv("HINDSIGHT_BANK_ID", "incident-response")
        self.mock_mode = not bool(self.api_key)
        
        if not self.mock_mode:
            try:
                self.client = Hindsight(base_url="https://api.hindsight.vectorize.io", api_key=self.api_key)
                self.is_connected = True
            except Exception as e:
                print(f"Failed to connect to Hindsight Cloud: {e}")
                self.mock_mode = True
                self.is_connected = False
        else:
            self.is_connected = False
            
        self.mock_memory = []

    async def retain_incident(self, incident_data):
        doc_id = incident_data.get('incident_id')
        service = incident_data.get('service')
        content = (
            f"Incident {doc_id} affected {service} at {incident_data.get('timestamp')}. "
            f"Symptoms: {incident_data.get('symptoms', incident_data.get('error', 'None'))}. "
            f"Root cause: {incident_data.get('root_cause')}. "
            f"Successful actions: {', '.join(incident_data.get('successful_resolution', incident_data.get('successful_actions', [])))}. "
            f"Failed actions: {', '.join(incident_data.get('failed_actions', []))}. "
            f"Runbook: {incident_data.get('runbook_id')}. "
            f"Resolution time: {incident_data.get('resolution_time_minutes')} minutes."
        )
        metadata = {
            "memory_type": "incident",
            "service": service,
            "severity": incident_data.get('severity'),
            "incident_id": doc_id,
            "runbook_id": incident_data.get('runbook_id')
        }
        metadata = {k: str(v) for k, v in metadata.items() if v is not None}
        tags = ["incident", service] if service else ["incident"]

        if self.mock_mode:
            self.mock_memory.append({
                "type": "incident", 
                "document_id": doc_id,
                "metadata": metadata,
                "tags": tags,
                "data": incident_data,
                "content": content
            })
            return True
        else:
            try:
                dt = datetime.now(timezone.utc)
                if incident_data.get('timestamp'):
                    try:
                        dt = datetime.fromisoformat(incident_data.get('timestamp').replace('Z', '+00:00'))
                    except:
                        pass
                await self.client.aretain(
                    bank_id=self.bank_id, 
                    content=content,
                    document_id=doc_id,
                    metadata=metadata,
                    tags=tags,
                    timestamp=dt,
                    update_mode="replace"
                )
                return True
            except Exception as e:
                print(f"Error retaining incident: {e}")
                return False

    async def retain_runbook(self, runbook_data):
        doc_id = runbook_data.get('runbook_id')
        service = runbook_data.get('service')
        content = (
            f"Runbook {doc_id} for {service}: {runbook_data.get('title')}. "
            f"Incident patterns: {', '.join(runbook_data.get('incident_patterns', []))}. "
            f"Symptoms: {', '.join(runbook_data.get('symptoms', []))}. "
            f"Investigation steps: {', '.join(runbook_data.get('investigation', []))}. "
            f"Resolution steps: {', '.join(runbook_data.get('resolution', []))}. "
            f"Warnings: {', '.join(runbook_data.get('warnings', []))}."
        )
        metadata = {
            "memory_type": "runbook",
            "service": service,
            "runbook_id": doc_id
        }
        metadata = {k: str(v) for k, v in metadata.items() if v is not None}
        tags = ["runbook", service] if service else ["runbook"]

        if self.mock_mode:
            self.mock_memory.append({
                "type": "runbook", 
                "document_id": doc_id,
                "metadata": metadata,
                "tags": tags,
                "data": runbook_data,
                "content": content
            })
            return True
        else:
            try:
                await self.client.aretain(
                    bank_id=self.bank_id, 
                    content=content,
                    document_id=doc_id,
                    metadata=metadata,
                    tags=tags,
                    timestamp=datetime.now(timezone.utc),
                    update_mode="replace"
                )
                return True
            except Exception as e:
                print(f"Error retaining runbook: {e}")
                return False

    async def retain_postmortem(self, postmortem_data):
        doc_id = postmortem_data.get('postmortem_id')
        service = postmortem_data.get('service')
        incident_id = postmortem_data.get('incident_id')
        
        content = (
            f"Postmortem {doc_id} for {service} (Incident {incident_id}). "
            f"Root cause: {postmortem_data.get('root_cause')}. "
            f"What worked: {postmortem_data.get('what_worked')}. "
            f"What failed: {postmortem_data.get('what_failed')}. "
            f"Resolution: {postmortem_data.get('resolution')}. "
            f"Lesson learned: {postmortem_data.get('lesson_learned')}. "
            f"Prevention: {postmortem_data.get('prevention')}."
        )
        metadata = {
            "memory_type": "postmortem",
            "service": service,
            "postmortem_id": doc_id,
            "incident_id": incident_id
        }
        metadata = {k: str(v) for k, v in metadata.items() if v is not None}
        tags = ["postmortem", service] if service else ["postmortem"]

        if self.mock_mode:
            for mem in self.mock_memory:
                if mem.get('document_id') == doc_id:
                    return True
            self.mock_memory.append({
                "type": "postmortem",
                "document_id": doc_id,
                "metadata": metadata,
                "tags": tags,
                "data": postmortem_data,
                "content": content
            })
            return True
        else:
            try:
                dt = datetime.now(timezone.utc)
                if postmortem_data.get('timestamp'):
                    try:
                        dt = datetime.fromisoformat(postmortem_data.get('timestamp').replace('Z', '+00:00'))
                    except:
                        pass
                await self.client.aretain(
                    bank_id=self.bank_id, 
                    content=content,
                    document_id=doc_id,
                    metadata=metadata,
                    tags=tags,
                    timestamp=dt,
                    update_mode="replace"
                )
                return True
            except Exception as e:
                print(f"Error retaining postmortem: {e}")
                return False

    async def recall(self, query):
        if self.mock_mode:
            results = []
            query_lower = query.lower()
            data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
            try:
                with open(os.path.join(data_dir, 'incidents.json'), 'r') as f:
                    incidents = json.load(f)
                    for inc in incidents:
                        if "payment" in query_lower and inc.get("service") == "payment-api":
                            if "502" in query_lower and "502" in inc.get("summary", ""):
                                results.append({"type": "incident", "content": inc, "metadata": {"incident_id": inc.get("incident_id")}})
                        elif "kubernetes" in query_lower and inc.get("service") == "kubernetes-cluster":
                            results.append({"type": "incident", "content": inc, "metadata": {"incident_id": inc.get("incident_id")}})
                        elif "redis" in query_lower and inc.get("service") == "redis-cache":
                            results.append({"type": "incident", "content": inc, "metadata": {"incident_id": inc.get("incident_id")}})
                
                with open(os.path.join(data_dir, 'postmortems.json'), 'r') as f:
                    postmortems = json.load(f)
                    seen_lessons = set()
                    for pm in postmortems:
                        if "payment" in query_lower and pm.get('service') == "payment-api":
                            lesson = pm.get('lesson_learned', '')
                            if lesson and lesson not in seen_lessons:
                                seen_lessons.add(lesson)
                                results.append({"type": "postmortem", "content": pm, "metadata": {"postmortem_id": pm.get("postmortem_id")}})
                        elif "kubernetes" in query_lower and pm.get('service') == "kubernetes-cluster":
                            lesson = pm.get('lesson_learned', '')
                            if lesson and lesson not in seen_lessons:
                                seen_lessons.add(lesson)
                                results.append({"type": "postmortem", "content": pm, "metadata": {"postmortem_id": pm.get("postmortem_id")}})
                        elif "redis" in query_lower and pm.get('service') == "redis-cache":
                            lesson = pm.get('lesson_learned', '')
                            if lesson and lesson not in seen_lessons:
                                seen_lessons.add(lesson)
                                results.append({"type": "postmortem", "content": pm, "metadata": {"postmortem_id": pm.get("postmortem_id")}})
                
                with open(os.path.join(data_dir, 'runbooks.json'), 'r') as f:
                    runbooks = json.load(f)
                    for rb in runbooks:
                        if rb.get('service') and rb.get('service').lower() in query_lower:
                            results.append({"type": "runbook", "content": rb, "metadata": {"runbook_id": rb.get("runbook_id")}})
                            
            except Exception as e:
                print("Error loading local data for mock recall:", e)
            
            for mem in self.mock_memory:
                pm = mem['data']
                doc_type = mem['type']
                if doc_type == 'postmortem':
                    if pm.get('service', '').lower() in query_lower or query_lower in pm.get('lesson_learned', '').lower():
                        if not any(r.get('metadata', {}).get('postmortem_id') == pm.get('postmortem_id') for r in results if r.get('type') == 'postmortem'):
                            results.append({"type": "postmortem", "content": pm, "metadata": mem.get('metadata', {})})
                elif doc_type == 'incident':
                    if pm.get('service', '').lower() in query_lower or query_lower in pm.get('summary', '').lower():
                        if not any(r.get('metadata', {}).get('incident_id') == pm.get('incident_id') for r in results if r.get('type') == 'incident'):
                            results.append({"type": "incident", "content": pm, "metadata": mem.get('metadata', {})})
                elif doc_type == 'runbook':
                    if pm.get('service', '').lower() in query_lower or query_lower in pm.get('title', '').lower():
                        if not any(r.get('metadata', {}).get('runbook_id') == pm.get('runbook_id') for r in results if r.get('type') == 'runbook'):
                            results.append({"type": "runbook", "content": pm, "metadata": mem.get('metadata', {})})
                            
            return results[:10]
        else:
            try:
                raw_results = await self.client.arecall(bank_id=self.bank_id, query=query)
                mapped_results = []
                for idx, r in enumerate(raw_results):
                    if idx >= 5:
                        break
                    
                    doc_type = "unknown"
                    if r.metadata and "memory_type" in r.metadata:
                        doc_type = r.metadata["memory_type"]
                    else:
                        content_str = getattr(r, 'text', str(r))
                        if "Postmortem" in content_str: doc_type = "postmortem"
                        elif "Runbook" in content_str: doc_type = "runbook"
                        elif "Incident" in content_str: doc_type = "incident"
                        
                    mapped_results.append({
                        "type": doc_type,
                        "content": r.text,
                        "metadata": r.metadata or {},
                        "tags": r.tags or [],
                        "document_id": r.document_id,
                        "scores": r.scores.to_dict() if r.scores else {}
                    })
                return mapped_results
            except Exception as e:
                print(f"Error recalling memory: {e}")
                return []

    async def reflect(self, query):
        if self.mock_mode:
            recalls = await self.recall(query)
            if not recalls:
                return "No sufficiently similar historical incidents were found."
            
            response = "What our previous incidents teach us about this failure mode:\n"
            for r in recalls:
                if r['type'] == 'incident':
                    response += f"- Similar incident {r['metadata'].get('incident_id', '')}: {r['content'].get('summary', r['content']) if isinstance(r['content'], dict) else r['content']}\n"
                elif r['type'] == 'postmortem':
                    response += f"- Postmortem {r['metadata'].get('postmortem_id', '')} Lesson: {r['content'].get('lesson_learned', r['content']) if isinstance(r['content'], dict) else r['content']}\n"
            return response
        else:
            try:
                res = await self.client.areflect(bank_id=self.bank_id, query=query, budget="low")
                return getattr(res, 'text', str(res))
            except Exception as e:
                print(f"Error reflecting memory: {e}")
                return "Error during Hindsight reflect operation."

hindsight_service = HindsightService()
