import os
import json
import httpx
from typing import Dict, Any, List

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_ANON_KEY or "",
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}" if SUPABASE_ANON_KEY else ""
    }

async def fetch_doctors_from_supabase() -> List[Dict[str, Any]]:
    """Fetch active doctors and their details from Supabase."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return []
    
    url = f"{SUPABASE_URL}/rest/v1/doctor_details?select=doctor_id,specialty,room_number,is_available,profiles(full_name)"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=get_headers())
            if response.status_code == 200:
                data = response.json()
                doctors = []
                for item in data:
                    profile = item.get("profiles") or {}
                    doctors.append({
                        "id": item.get("doctor_id"),
                        "name": profile.get("full_name") or "Unknown Doctor",
                        "specialty": item.get("specialty"),
                        "room": item.get("room_number") or "Unknown Room",
                        "availableSlots": ["09:00", "10:00", "14:00"] if item.get("is_available") else []
                    })
                return doctors
    except Exception as e:
        print(f"[Supabase Tool Warning] Failed to fetch doctors: {e}")
    return []

async def fetch_medical_records_from_supabase(patient_id: str) -> List[Dict[str, Any]]:
    """Fetch medical records for a patient from Supabase."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return []
    
    url = f"{SUPABASE_URL}/rest/v1/medical_records?patient_id=eq.{patient_id}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=get_headers())
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"[Supabase Tool Warning] Failed to fetch medical records: {e}")
    return []

async def fetch_medicine_stock_from_supabase(medicine_name: str) -> Dict[str, Any]:
    """Fetch inventory and stock details for a medicine from Supabase."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return {}
    
    # Check for exact match first, or fallback to partial match
    url = f"{SUPABASE_URL}/rest/v1/medicine_inventory?medicine_name=ilike.*{medicine_name.split()[0]}*"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=get_headers())
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0]
    except Exception as e:
        print(f"[Supabase Tool Warning] Failed to fetch stock: {e}")
    return {}

async def update_medicine_stock_in_supabase(medicine_name: str, current_stock: int) -> bool:
    """Update stock details for a medicine in Supabase."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return False
    
    # Find the matching medicine ID first
    med_info = await fetch_medicine_stock_from_supabase(medicine_name)
    if not med_info:
        return False
    
    med_id = med_info.get("id")
    url = f"{SUPABASE_URL}/rest/v1/medicine_inventory?id=eq.{med_id}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(url, headers=get_headers(), json={
                "current_stock": current_stock,
                "last_updated": "now()"
            })
            return response.status_code in (200, 204)
    except Exception as e:
        print(f"[Supabase Tool Warning] Failed to update stock: {e}")
    return False

async def save_patient_summary_to_supabase(patient_id: str, summary: str) -> bool:
    """Save or update the compiled clinical summary in the medical_records table."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return False
    
    # Check if an AI summary already exists for this patient
    check_url = f"{SUPABASE_URL}/rest/v1/medical_records?patient_id=eq.{patient_id}&record_type=eq.ai_summary"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(check_url, headers=get_headers())
            if response.status_code == 200:
                data = response.json()
                if data:
                    # Update existing summary record
                    record_id = data[0].get("id")
                    update_url = f"{SUPABASE_URL}/rest/v1/medical_records?id=eq.{record_id}"
                    update_response = await client.patch(update_url, headers=get_headers(), json={
                        "description": summary,
                        "record_date": "now()"
                    })
                    return update_response.status_code in (200, 204)
                else:
                    # Insert new summary record
                    insert_url = f"{SUPABASE_URL}/rest/v1/medical_records"
                    insert_response = await client.post(insert_url, headers=get_headers(), json={
                        "patient_id": patient_id,
                        "record_type": "ai_summary",
                        "description": summary,
                        "record_date": "now()",
                        "doctor_id": "22222222-2222-2222-2222-222222222222" # Default to Dr. Anita Desai
                    })
                    return insert_response.status_code in (200, 201)
    except Exception as e:
        print(f"[Supabase Tool Warning] Failed to save clinical summary: {e}")
    return False

