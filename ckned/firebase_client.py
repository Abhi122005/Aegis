import firebase_admin
from firebase_admin import credentials, firestore
import uuid
import datetime

# Initialize Firebase app
cred = credentials.Certificate("firebase-credentials.json")
# Prevent initializing multiple times in development with hot reload
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def save_threat(threat_data: dict) -> str:
    """
    Saves a threat analysis to the Firestore 'threats' collection.
    Appends a timestamp and a unique ID.
    Returns the document ID.
    """
    threats_ref = db.collection("threats")
    doc_ref = threats_ref.document()
    
    # Merge existing data with metadata
    data_to_save = {
        "id": doc_ref.id,
        "detected_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        **threat_data
    }
    
    doc_ref.set(data_to_save)
    return doc_ref.id

def get_threats_by_month():
    """
    Retrieves all threats, grouped by Year-Month string (e.g. '2023-10').
    Returns a dictionary mapping 'YYYY-MM' -> List[dict].
    """
    threats_ref = db.collection("threats")
    # Order by detection time descending (newest first)
    docs = threats_ref.order_by("detected_at", direction=firestore.Query.DESCENDING).stream()
    
    grouped = {}
    for doc in docs:
        t_data = doc.to_dict()
        detected_at = t_data.get("detected_at")
        
        # Default to current month if timestamp is missing or malformed
        month_key = "Unknown"
        if detected_at:
            try:
                # Assuming detected_at is an ISO format string like '2023-10-04T12:00:00+00:00'
                # Just slice the first 7 chars 'YYYY-MM'
                month_key = detected_at[:7]
            except Exception:
                pass
        
        if month_key not in grouped:
            grouped[month_key] = []
        grouped[month_key].append(t_data)
        
    return grouped
