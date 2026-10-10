import json
import random
import os
from datetime import datetime, timedelta

ENGINEERS = [
    "Alice Chen", "Bob Smith", "Charlie Davis", "Diana Prince", 
    "Evan Wright", "Fiona Gallagher", "George Costanza", "Hannah Abbott"
]

STREAMS = {
    "SRE": ["payment-api", "user-auth-service", "inventory-db", "redis-cache", "kubernetes-cluster"],
    "DEV": ["ci-cd-pipeline", "terraform-state", "helm-controller", "prometheus-stack", "aws-network"],
    "SWE": ["user-profile-ui", "cart-api", "notification-worker", "order-service", "mobile-app"],
    "SEC": ["auth-gateway", "s3-storage", "admin-panel", "legacy-api", "ci-pipeline"]
}

def generate_stack_trace(service):
    return [
        f"Error: Crash inside {service} components.",
        "at InternalModule.processRequest (internal.js:10)",
        "at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1187:16)"
    ]

def generate_runbooks():
    runbooks = []
    
    for stream, services in STREAMS.items():
        for i in range(1, 201):
            service = random.choice(services)
            rb_id = f"RB-{stream}-{i:03d}"
            
            runbooks.append({
                "runbook_id": rb_id,
                "stream": stream,
                "title": f"Troubleshooting {service} in {stream}",
                "service": service,
                "incident_patterns": ["High latency", "Errors", "Restarts", "Timeouts"],
                "symptoms": ["Increased error rate", "Customer complaints", "Alert triggered"],
                "investigation": [
                    f"Check dashboard for {service}.",
                    "Verify network connectivity.",
                    "Review recent logs."
                ],
                "resolution": [
                    "Rollback deployment.",
                    "Scale up pods.",
                    "Clear cache."
                ],
                "warnings": [
                    "Do not restart primary databases blindly."
                ],
                "related_incident_ids": []
            })
            
    return runbooks

def generate_dataset():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)

    runbooks = generate_runbooks()
    incidents = []
    postmortems = []

    base_time = datetime.now() - timedelta(days=365)
    
    global_inc_counter = 1
    
    for stream, services in STREAMS.items():
        for i in range(1, 201):
            inc_id = f"INC-{stream}-{i:04d}"
            service = random.choice(services)
            
            inc_time = base_time + timedelta(days=random.randint(1, 360), hours=random.randint(1, 24))
            resolved_time = inc_time + timedelta(minutes=random.randint(15, 240))
            
            severity = random.choice(["SEV-1", "SEV-2", "SEV-3"])
            
            incidents.append({
                "incident_id": inc_id,
                "stream": stream,
                "service": service,
                "status": "Resolved",
                "severity": severity,
                "created_at": inc_time.isoformat() + "Z",
                "resolved_at": resolved_time.isoformat() + "Z",
                "description": f"Automated monitoring detected anomalies in {service}.",
                "metrics": {
                    "error_rate": f"{random.uniform(5.0, 45.0):.1f}%",
                    "latency_p99": f"{random.randint(500, 5000)}ms",
                    "db_utilization": f"{random.randint(60, 100)}%"
                },
                "deployment_context": {
                    "recent_deployment": random.choice([True, False]),
                    "deployed_version": f"v1.{random.randint(10,99)}.{random.randint(0,9)}",
                    "time_since_deploy": f"{random.randint(1, 48)} hours"
                },
                "stack_trace": generate_stack_trace(service)
            })

            postmortems.append({
                "postmortem_id": f"PM-{inc_id}",
                "stream": stream,
                "incident_id": inc_id,
                "service": service,
                "lead_investigator": random.choice(ENGINEERS),
                "impact": f"Customer impact lasted {random.randint(15, 240)} minutes.",
                "timeline": [
                    f"{inc_time.strftime('%H:%M:%S')}Z - Alert triggered.",
                    f"{(inc_time + timedelta(minutes=5)).strftime('%H:%M:%S')}Z - Investigation started.",
                    f"{resolved_time.strftime('%H:%M:%S')}Z - Service recovered."
                ],
                "root_cause": f"System failure in {service} due to resource exhaustion or bug.",
                "what_worked": [
                    "Restarted service",
                    "Scaled resources"
                ],
                "what_failed": [
                    "Waiting for auto-recovery"
                ],
                "resolution": [
                    "Applied hotfix",
                    "Increased limits"
                ],
                "lesson_learned": f"Improve monitoring and resource limits for {service}.",
                "prevention": [
                    "Add stricter validation",
                    "Create specific monitors"
                ]
            })

    with open(os.path.join(data_dir, 'runbooks.json'), 'w') as f:
        json.dump(runbooks, f, indent=2)
        
    with open(os.path.join(data_dir, 'incidents.json'), 'w') as f:
        json.dump(incidents, f, indent=2)
        
    with open(os.path.join(data_dir, 'postmortems.json'), 'w') as f:
        json.dump(postmortems, f, indent=2)

    print(f"Generated {len(runbooks)} runbooks, {len(incidents)} incidents, and {len(postmortems)} postmortems.")

if __name__ == "__main__":
    generate_dataset()
