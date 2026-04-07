from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from log_processor import filter_suspicious_lines
from ollama_client import analyze_with_ollama
from gemini_client import generate_ciso_report
from firebase_client import get_threats_by_month
import json

app = FastAPI(title="Project Aegis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://[::1]:3000",
        "https://localhost:3000",
        "https://127.0.0.1:3000",
        "https://[::1]:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "online", "project": "Aegis"}

@app.post("/simulate-attack")
async def simulate_attack():
    # Step 1: Filter & classify logs
    log_data = filter_suspicious_lines("access.log")
    suspicious_lines = log_data["suspicious_lines"]
    pre_classified_threat = log_data["threat_type"]
    attacker_ips = log_data["attacker_ips"]

    if not suspicious_lines:
        raise HTTPException(status_code=404, detail="No suspicious lines found in log.")

    # Step 2: Send filtered lines to local Ollama
    ollama_raw = await analyze_with_ollama(suspicious_lines, fallback_threat_type=pre_classified_threat)

    # Step 3: Safely parse Ollama JSON response
    try:
        clean = ollama_raw.strip().removeprefix("```json").removesuffix("```").strip()
        ollama_data = json.loads(clean)
    except Exception:
        # Fallback: use our own classifier if Ollama returns bad JSON
        ollama_data = {
            "threat_type": pre_classified_threat,
            "bash_mitigation": ollama_raw
        }

    # Use Ollama's classification, fall back to our classifier
    threat_type = ollama_data.get("threat_type") or pre_classified_threat

    # Step 4: Send ONLY sanitized threat label to Gemini (no IPs, no raw logs)
    ciso_email = await generate_ciso_report(threat_type)

    print("\n--- OLLAMA RAW OUTPUT ---")
    print(ollama_raw)
    print("-------------------------\n")

    # Step 5: Save to Firebase Firestore
    # We create the payload we'll return and save, plus extra fields for frontend
    # the frontend mock uses standard names, let's map to them
    import uuid
    threat_payload = {
        "attackType": threat_type,
        "sourceIp": attacker_ips[0] if attacker_ips else "192.168.1.100", # default mock or from logs
        "portLabel": "22 (SSH)",
        "threatId": f"AEG-{str(uuid.uuid4())[:8].upper()}",
        "confidence": "99.9%",
        "targetNode": "EDGE-NODE-ALPHA-01",
        "mitigationScript": ollama_data.get("bash_mitigation", "# No mitigation generated"),
        "cisoReport": ciso_email,
        "ollamaRaw": ollama_raw
    }
    
    # Actually save
    from firebase_client import save_threat
    save_threat(threat_payload)

    # Step 6: Return full result to frontend
    return threat_payload

@app.get("/threats/monthly")
async def get_monthly_threats():
    """Returns threats grouped by month from Firestore."""
    try:
        data = get_threats_by_month()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))