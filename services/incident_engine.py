from .hindsight_service import hindsight_service
from .llm_service import llm_service
from .data_service import data_service

class IncidentEngine:
    def __init__(self):
        pass

    async def investigate(self, incident_data):
        # 1. Normalize incident
        service = incident_data.get('service', '')
        severity = incident_data.get('severity', '')
        error = incident_data.get('error', '')
        description = incident_data.get('description', '')
        error_rate = incident_data.get('error_rate', '')
        recent_deployment = incident_data.get('recent_deployment', '')
        deployment_time = incident_data.get('deployment_time', '')
        db_util = incident_data.get('db_utilization', '')
        
        # Build a rich query using all available context
        query = f"Service: {service}. Symptoms: {error}."
        if description:
            query += f" Description: {description.split(chr(10))[0]}"
        
        # 2. Query Hindsight Recall and Reflect
        memories = await hindsight_service.recall(query)
        reflection = await hindsight_service.reflect(query)
        
        # 3. Categorize memories
        similar_incidents = []
        lessons = []
        for mem in memories:
            if mem['type'] == 'incident':
                similar_incidents.append(mem)
            elif mem['type'] == 'postmortem':
                lessons.append(mem)

        # Find Runbook from local data
        runbooks = data_service.load_runbooks()
        recommended_runbook = None
        for rb in runbooks:
            if rb['service'].lower() in service.lower() or service.lower() in rb['service'].lower():
                recommended_runbook = rb
                break
                
        # Also check memories for runbooks
        for mem in memories:
            if mem['type'] == 'runbook' and not recommended_runbook:
                recommended_runbook = mem.get('content')
                
        # Inject full incident context
        full_incident = {
            "service": service,
            "severity": severity,
            "error": error,
            "description": description,
            "error_rate": error_rate,
            "recent_deployment": recent_deployment,
            "deployment_time": deployment_time,
            "db_utilization": db_util
        }

        # Generate recommendation
        recommendation = llm_service.generate_recommendation(
            incident=full_incident,
            historical_evidence=memories,
            reflection=reflection,
            runbooks=[recommended_runbook] if recommended_runbook else []
        )

        return {
            "similar_incidents": similar_incidents,
            "lessons": lessons,
            "recommended_runbook": recommended_runbook,
            "recommendation": recommendation,
            "evidence": memories,
            "reflection": reflection
        }

incident_engine = IncidentEngine()
