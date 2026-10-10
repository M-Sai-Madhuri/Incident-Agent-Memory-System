import os
from dotenv import load_dotenv

# Load env before importing services
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import asyncio
from services.hindsight_service import hindsight_service
from services.data_service import data_service

async def ingest():
    print("Starting Hindsight Ingestion...")
    if hindsight_service.mock_mode:
        print("Running in MOCK MODE. Hindsight credentials not configured or failed.")
        
    incidents = data_service.load_incidents()
    runbooks = data_service.load_runbooks()
    postmortems = data_service.load_postmortems()

    # Ingest Runbooks
    print(f"Retaining {len(runbooks)} runbooks...")
    for rb in runbooks:
        await hindsight_service.retain_runbook(rb)

    # Ingest Postmortems
    print(f"Retaining {len(postmortems)} postmortems...")
    for pm in postmortems:
        await hindsight_service.retain_postmortem(pm)

    # Ingest Incidents
    print(f"Retaining {len(incidents)} incidents...")
    for i, inc in enumerate(incidents, 1):
        await hindsight_service.retain_incident(inc)
        if i % 10 == 0:
            print(f"[{i}/{len(incidents)}] Retaining incident {inc.get('incident_id')}")

    print("\nIngestion Complete.")
    print(f"Runbooks retained: {len(runbooks)}")
    print(f"Postmortems retained: {len(postmortems)}")
    print(f"Incidents retained: {len(incidents)}")

if __name__ == "__main__":
    asyncio.run(ingest())
