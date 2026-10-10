from fastapi import FastAPI, HTTPException, Request, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
import json
import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

from passlib.context import CryptContext
import jwt

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

from services.hindsight_service import hindsight_service
from services.data_service import data_service
from services.incident_engine import incident_engine
from services.llm_service import llm_service

# --- SECURITY CONFIGURATION ---
SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-default-key-please-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
limiter = Limiter(key_func=get_remote_address)

USERS_FILE = "users.json"

def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
            
    # Default users if file doesn't exist
    default_users = {
        "admin": {
            "id": "A-001",
            "username": "admin",
            "email": "admin@gmail.com",
            "role": "manager",
            "hashed_password": pwd_context.hash("Admin@123"),
            "plaintext_password": "Admin@123",
            "stats": { "searched": 0, "approved": 0, "declined": 0, "postmortems": 0, "runbooks": 0 }
        },
        "Ram": {
            "id": "U-001",
            "username": "Ram",
            "email": "ram123@gmail.com",
            "role": "developer",
            "hashed_password": pwd_context.hash("Ram@1234"),
            "plaintext_password": "Ram@1234",
            "stats": { "searched": 0, "approved": 0, "declined": 0, "postmortems": 0, "runbooks": 0 }
        },
        "Shiva": {
            "id": "U-002",
            "username": "Shiva",
            "email": "shiva123@gmail.com",
            "role": "Analyst",
            "hashed_password": pwd_context.hash("Shiva@1234"),
            "plaintext_password": "Shiva@1234",
            "stats": { "searched": 0, "approved": 0, "declined": 0, "postmortems": 0, "runbooks": 0 }
        }
    }
    with open(USERS_FILE, "w") as f:
        json.dump(default_users, f, indent=4)
    return default_users

def save_users():
    with open(USERS_FILE, "w") as f:
        json.dump(MOCK_USERS_DB, f, indent=4)

MOCK_USERS_DB = load_users()

app = FastAPI(docs_url=None, redoc_url=None) # Disable debug docs in prod

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allowed Origins (CORS Hardening)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# --- AUTHENTICATION UTILS ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        # Check if it has a bearer prefix
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username not in MOCK_USERS_DB:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def parse_llm_json(raw_text):
    try:
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            clean_json = raw_text[start_idx:end_idx+1]
        else:
            clean_json = raw_text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_json)
    except Exception:
        return None

# --- MODELS ---
class LoginRequest(BaseModel):
    user_id: str
    username: str
    email: str
    password: str
    role: str

class InvestigateRequest(BaseModel):
    service: str = Field(..., max_length=100)
    severity: str = Field(..., max_length=20)
    error: str = Field(..., max_length=500)
    description: str = Field(..., max_length=2000)
    error_rate: str = Field(..., max_length=100)
    recent_deployment: str = Field(..., max_length=100)
    deployment_time: str = Field(..., max_length=100)
    db_utilization: str = Field(..., max_length=100)
    memory_mode: bool = True

class PostmortemRequest(BaseModel):
    incident_id: Optional[str] = None
    stream: Optional[str] = Field(None, max_length=50)
    service: str = Field(..., max_length=100)
    root_cause: str = Field(..., max_length=1000)
    what_worked: Union[str, List[str]]
    what_failed: Union[str, List[str]]
    resolution: Union[str, List[str]]
    lesson_learned: str = Field(..., max_length=1000)
    prevention: Union[str, List[str]]

class QueryRequest(BaseModel):
    query: str = Field(..., max_length=500)

class ChangePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)

class EditUserRequest(BaseModel):
    id: str
    username: str
    email: str
    role: str
    new_password: Optional[str] = None

class CreateUserRequest(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    role: str
    password: str

# --- ROUTES ---

@app.post("/api/login")
@limiter.limit("5/minute")
async def login(req: LoginRequest, request: Request, response: Response):
    # Find user by ID or email
    user = None
    for k, v in MOCK_USERS_DB.items():
        if v["email"] == req.email and v["id"] == req.user_id and v["role"] == req.role and v["username"] == req.username:
            user = v
            break
            
    if not user or not pwd_context.verify(req.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False, # Use True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return {"message": "Successfully logged in"}

@app.post("/api/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Successfully logged out"}

@app.get("/api/users")
def get_users(current_user: str = Depends(get_current_user)):
    return [{"id": u["id"], "username": u["username"], "email": u["email"], "role": u["role"], "password": u.get("plaintext_password", "********"), "stats": u.get("stats", {})} for u in MOCK_USERS_DB.values()]

@app.get("/api/users/me")
def get_me(current_user: str = Depends(get_current_user)):
    u = MOCK_USERS_DB.get(current_user)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": u["id"], "username": u["username"], "email": u["email"], "role": u["role"], "stats": u.get("stats", {})}

@app.get("/api/users/{user_id}")
def get_user_by_id(user_id: str, current_user: str = Depends(get_current_user)):
    for v in MOCK_USERS_DB.values():
        if v["id"] == user_id:
            return {"id": v["id"], "username": v["username"], "email": v["email"], "role": v["role"], "stats": v.get("stats", {})}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/users/me/stats/{metric}")
def increment_stat(metric: str, current_user: str = Depends(get_current_user)):
    user = MOCK_USERS_DB.get(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "stats" not in user:
        user["stats"] = { "searched": 0, "approved": 0, "declined": 0, "postmortems": 0, "runbooks": 0 }
    if metric in user["stats"]:
        user["stats"][metric] += 1
        save_users()
    return user["stats"]

@app.post("/api/users/password")
def change_password(req: ChangePasswordRequest, current_user: str = Depends(get_current_user)):
    u = MOCK_USERS_DB.get(current_user)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u["hashed_password"] = pwd_context.hash(req.new_password)
    u["plaintext_password"] = req.new_password
    save_users()
    return {"message": "Password updated successfully"}

@app.post("/api/users")
def admin_create_user(req: CreateUserRequest, current_user: str = Depends(get_current_user)):
    admin = MOCK_USERS_DB.get(current_user)
    if not admin or admin["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can create users")
        
    # Check if user already exists
    for v in MOCK_USERS_DB.values():
        if v["email"] == req.email or v["username"] == req.username:
            raise HTTPException(status_code=400, detail="User with this Email or Username already exists")

    prefix = "A-" if req.role.lower() == "manager" else "U-"
    max_num = 0
    for v in MOCK_USERS_DB.values():
        if v["id"].upper().startswith(prefix):
            try:
                num = int(v["id"].split("-")[1])
                if num > max_num:
                    max_num = num
            except:
                pass
    new_id = f"{prefix}{max_num + 1:03d}"
            
    MOCK_USERS_DB[req.username] = {
        "id": new_id,
        "username": req.username,
        "email": req.email,
        "role": req.role,
        "hashed_password": pwd_context.hash(req.password),
        "plaintext_password": req.password,
        "stats": { "searched": 0, "approved": 0, "declined": 0, "postmortems": 0, "runbooks": 0 }
    }
    save_users()
    return {"message": "User created successfully"}

@app.post("/api/users/{user_id}")
def admin_edit_user(user_id: str, req: EditUserRequest, current_user: str = Depends(get_current_user)):
    # Verify the current user is an admin (manager)
    admin = MOCK_USERS_DB.get(current_user)
    if not admin or admin["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can edit users")
        
    # Find the target user by ID
    target_user_key = None
    for k, v in MOCK_USERS_DB.items():
        if v["id"] == user_id:
            target_user_key = k
            break
            
    if not target_user_key:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    MOCK_USERS_DB[target_user_key]["id"] = req.id
    MOCK_USERS_DB[target_user_key]["username"] = req.username
    MOCK_USERS_DB[target_user_key]["email"] = req.email
    MOCK_USERS_DB[target_user_key]["role"] = req.role
    
    if req.new_password:
        MOCK_USERS_DB[target_user_key]["hashed_password"] = pwd_context.hash(req.new_password)
        MOCK_USERS_DB[target_user_key]["plaintext_password"] = req.new_password
        
    save_users()
    return {"message": "User details updated successfully"}

@app.get("/api/health")
def health(current_user: str = Depends(get_current_user)):
    return {
        "status": "ok",
        "hindsight_connected": hindsight_service.is_connected,
        "bank_id": hindsight_service.bank_id,
        "mock_memory_count": len(hindsight_service.mock_memory)
    }

@app.get("/api/incidents")
def get_incidents(current_user: str = Depends(get_current_user)):
    return data_service.load_incidents()

@app.get("/api/runbooks")
def get_runbooks(current_user: str = Depends(get_current_user)):
    return data_service.load_runbooks()

@app.get("/api/postmortems")
def get_postmortems(current_user: str = Depends(get_current_user)):
    postmortems = data_service.load_postmortems()
    for mem in hindsight_service.mock_memory:
        if mem['type'] == 'postmortem':
            postmortems.append(mem['data'])
    return postmortems

@app.post("/api/incidents/investigate")
@limiter.limit("10/minute")
async def investigate(req: InvestigateRequest, request: Request, current_user: str = Depends(get_current_user)):
    incident_data = req.dict()
    
    if not req.memory_mode:
        raw_rec = llm_service.generate_recommendation(incident_data, [], "No historical memory used.", [])
        result = {
            "similar_incidents": [],
            "lessons": [],
            "recommended_runbook": None,
            "evidence": [],
            "reflection": "No historical memory used.",
            "recommendation": raw_rec
        }
    else:
        result = await incident_engine.investigate(incident_data)
        
    rec_data = parse_llm_json(result['recommendation'])
    if not rec_data:
        raise HTTPException(status_code=500, detail="Failed to parse LLM JSON")
        
    result['structured_recommendation'] = rec_data
    return result

@app.post("/api/postmortems")
@limiter.limit("5/minute")
async def create_postmortem(req: PostmortemRequest, request: Request, current_user: str = Depends(get_current_user)):
    def normalize_list(val):
        if isinstance(val, list):
            return val
        if isinstance(val, str):
            return [s.strip() for s in val.split(',') if s.strip()]
        return []

    pm_data = req.dict()
    
    if req.incident_id:
        pm_data["postmortem_id"] = f"PM-{req.incident_id}"
    else:
        stream_prefix = req.stream.upper() if req.stream else "MANUAL"
        existing = data_service.load_postmortems()
        count = sum(1 for p in existing if p.get("postmortem_id", "").startswith(f"PM-INC-{stream_prefix}-"))
        pm_data["postmortem_id"] = f"PM-INC-{stream_prefix}-{count + 1:03d}"

    pm_data["what_worked"] = normalize_list(pm_data.get("what_worked"))
    pm_data["what_failed"] = normalize_list(pm_data.get("what_failed"))
    pm_data["resolution"] = normalize_list(pm_data.get("resolution"))
    pm_data["prevention"] = normalize_list(pm_data.get("prevention"))

    data_service.save_postmortem(pm_data)
    await hindsight_service.retain_postmortem(pm_data)
    return {"status": "success", "postmortem_id": pm_data["postmortem_id"]}

@app.post("/api/memory/recall")
@limiter.limit("20/minute")
async def memory_recall(req: QueryRequest, request: Request, current_user: str = Depends(get_current_user)):
    return await hindsight_service.recall(req.query)

@app.post("/api/memory/reflect")
@limiter.limit("10/minute")
async def memory_reflect(req: QueryRequest, request: Request, current_user: str = Depends(get_current_user)):
    return {"reflection": await hindsight_service.reflect(req.query)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
