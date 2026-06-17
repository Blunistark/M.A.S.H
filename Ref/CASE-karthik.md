# Auto-create Patient Profiles during Booking and Prescribing

This plan addresses the issue where booking an appointment or writing a prescription for a patient not present in the database (e.g. "Kartik") fallback to "John Doe" or fails, rather than registering the new patient profile dynamically.

## Proposed Changes

### Agents Backend

#### [MODIFY] [supabase_tools.py](file:///C:/Users/Kirran%20Kumar/OneDrive/Desktop/M.A.S.H/Agents/src/supabase_tools.py)
- **`book_appointment_in_supabase`**: If the patient profile query yields no results, perform a `POST http://127.0.0.1:3000/api/profiles` request with the patient's full name, and use the newly generated patient UUID to book the appointment.
- **`create_prescription_in_supabase`**: If the patient cannot be resolved by full or partial name match, perform the same `POST http://127.0.0.1:3000/api/profiles` request to register the profile before creating the prescription.

## Verification Plan

### Manual Verification
1. Run the backend, frontend, and agent servers.
2. Ask the Voice Orb: *"Book an appointment for Kartik at 11:00"*
3. **Expectation**: The backend log should show it creating a new profile for "Kartik", and the queue dashboard should refresh to show "Kartik" at 11:00 AM instead of "John Doe".
