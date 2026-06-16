import asyncio
from src import (
    HealthcareOrchestrationRoom,
    ReceptionNavigationRoom,
    ClinicalConsultRoom,
    SummaryAgent,
    MedicineManagementAgent,
    StockManagementAgent,
    RegistrationAgent,
    PatientManagementAgent,
    PatientNavigationAgent,
)

def format_js_object(obj):
    if isinstance(obj, dict):
        if not obj:
            return "{}"
        items = [f"{repr(k)}: {format_js_object(v)}" for k, v in obj.items()]
        return f"{{ {', '.join(items)} }}"
    elif isinstance(obj, list):
        if not obj:
            return "[]"
        items = [format_js_object(x) for x in obj]
        return f"[ {', '.join(items)} ]"
    elif isinstance(obj, str):
        return repr(obj)
    return str(obj)

async def main():
    print("Initializing Band of Agents mesh...")

    # Instantiate Agents (which automatically join the room and set up listeners)
    summary_agent = SummaryAgent()
    medicine_agent = MedicineManagementAgent()
    stock_agent = StockManagementAgent()
    registration_agent = RegistrationAgent()
    patient_management_agent = PatientManagementAgent()
    patient_navigation_agent = PatientNavigationAgent()

    # Log simulation events for visibility
    original_broadcast = HealthcareOrchestrationRoom.broadcast

    def wrapped_broadcast(event: str, payload: dict):
        if event == 'REORDER_SUGGESTION':
            print(f"[SIMULATION ALERT] Reorder Suggestion Received: {payload['reason']}")
        elif event == 'STOCK_STATS_RESPONSE':
            print(f"[SIMULATION RESPONSE] Current Stock Stats:", format_js_object(payload['stats']))
        elif event == 'SUMMARY_AVAILABLE':
            print(f"[SIMULATION RESPONSE] Generated Summary for {payload['patientId']}:\n{payload['summary']}")
        elif event == 'DOCTORS_LIST_RESPONSE':
            doc_strings = [
                f"{d['name']} ({d['specialty']}) - Slots: [{', '.join(d['availableSlots'])}]" 
                for d in payload['doctors']
            ]
            print(f"[SIMULATION RESPONSE] Available Doctors list:", format_js_object(doc_strings))
        elif event == 'APPOINTMENT_CONFIRMED':
            comments_str = f" - Comments: {payload['comments']}" if payload.get('comments') else ''
            print(f"[SIMULATION ALERT] Appointment Confirmed for {payload['patientId']} with Doctor ID {payload['doctorId']} at slot {payload['slot']} (Status: {payload['status']}){comments_str}")
        elif event == 'NAVIGATION_DIRECTIONS':
            print(f"[SIMULATION RESPONSE] Navigation Directions for {payload['patientId']}:\n{payload['directions']}")
        
        return original_broadcast(event, payload)

    HealthcareOrchestrationRoom.broadcast = wrapped_broadcast

    # Log simulation events for Reception-Navigation-Room
    original_reception_broadcast = ReceptionNavigationRoom.broadcast

    def wrapped_reception_broadcast(event: str, payload: dict):
        if event == 'DOCTOR_ASSIGNED':
            print(f"[RECEPTION ALERT] Doctor Assigned for {payload['patientId']}: {payload['doctorName']} ({payload['specialty']}) at slot {payload['slot']}")
        elif event == 'NAVIGATION_DIRECTIONS':
            print(f"[RECEPTION RESPONSE] Navigation directions for {payload['patientId']}:\n{payload['directions']}")
        elif event == 'DOCTOR_ROOM_CHANGE':
            print(f"[RECEPTION INFO] Doctor clinic changed: Doctor {payload['doctorId']} moved to {payload['room']} ({payload['floor']})")
        elif event == 'NAVIGATE_TO_ROOM':
            print(f"[RECEPTION INFO] Room navigation triggered for patient {payload['patientId']} to see doctor {payload['doctorId']}")
        return original_reception_broadcast(event, payload)

    ReceptionNavigationRoom.broadcast = wrapped_reception_broadcast

    # Log simulation events for Clinical-Consult-Room
    original_clinical_broadcast = ClinicalConsultRoom.broadcast

    def wrapped_clinical_broadcast(event: str, payload: dict):
        if event == 'PATIENT_HISTORY_COMPILED':
            print(f"[CLINICAL RESPONSE] Compiled History for {payload['patientId']}:\n{payload['compiledHistory']}")
        elif event == 'PRESCRIPTION_SAFETY_PASSED':
            resolution_str = f" (via Intervention - Comments: {payload['resolution']['comments']})" if payload.get('resolution') else ''
            print(f"[CLINICAL ALERT] Prescription Safety Check passed for {payload['patientId']}: {payload['prescription']['medicine']} (Status: {payload['status']}){resolution_str}")
        return original_clinical_broadcast(event, payload)

    ClinicalConsultRoom.broadcast = wrapped_clinical_broadcast

    # Example simulation of orchestration workflow:
    print("--- Simulating Workflow ---")

    # 1. Patient data arrives, trigger summary
    HealthcareOrchestrationRoom.broadcast('GENERATE_SUMMARY', { 
        'patientId': 'P-12345', 
        'history': ['Checkup 2024', 'Vaccination 2025'],
        'tests': [
            { 'name': 'Blood Panel', 'date': '2025-11-10', 'result': 'Normal' },
            { 'name': 'X-Ray Chest', 'date': '2026-02-14', 'result': 'Clear lungs' }
        ],
        'surgeries': [
            { 'procedure': 'Appendectomy', 'date': '2020-04-12', 'outcome': 'Successful recovery' }
        ]
    })

    # 2. Prescription written for an available medicine (1st usage)
    HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
        'patientId': 'P-12345',
        'prescription': { 'medicine': 'Ibuprofen 400mg' }
    })

    # 3. Prescription written for an out-of-stock medicine (triggers Human-in-the-Loop)
    await asyncio.sleep(1)
    HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
        'patientId': 'P-12345',
        'prescription': { 'medicine': 'Rare-Antibiotic 500mg' }
    })

    # 4. Repeated prescription of the same medicine to trigger Stock Reorder Suggestion (2nd usage)
    await asyncio.sleep(1)
    print("\n--- Triggering repeated usage of Ibuprofen to test Stock Management Agent ---")
    HealthcareOrchestrationRoom.broadcast('PROCESS_PRESCRIPTION', {
        'patientId': 'P-67890',
        'prescription': { 'medicine': 'Ibuprofen 400mg' }
    })

    # 5. Query current stock stats
    await asyncio.sleep(1)
    print("\n--- Querying Stock Stats ---")
    HealthcareOrchestrationRoom.broadcast('GET_STOCK_STATS', {})

    # 6. Registration workflow: Query available doctor directory
    await asyncio.sleep(1)
    print("\n--- Querying Doctors Directory ---")
    HealthcareOrchestrationRoom.broadcast('QUERY_DOCTORS', {})

    # 7. Patient Management workflow: Request scheduling / rescheduling
    await asyncio.sleep(1)
    print("\n--- Requesting Rescheduling (Successful Flow) ---")
    HealthcareOrchestrationRoom.broadcast('RESCHEDULE_APPOINTMENT', {
        'patientId': 'P-12345',
        'doctorId': 'doc-1',
        'doctorName': 'Dr. Smith',
        'requestedSlot': '10:00'
    })

    # 8. Patient Management workflow: Request scheduling with slot conflict (triggers Human-in-the-Loop)
    await asyncio.sleep(1)
    print("\n--- Requesting Rescheduling with Slot Conflict (Human-in-the-Loop) ---")
    HealthcareOrchestrationRoom.broadcast('RESCHEDULE_APPOINTMENT', {
        'patientId': 'P-12345',
        'doctorId': 'doc-1',
        'doctorName': 'Dr. Smith',
        'requestedSlot': '11:00'
    })

    # 9. Navigation workflow: Request routing directions to see doctor
    await asyncio.sleep(1)
    print("\n--- Requesting Navigation Guidance to see Dr. Smith ---")
    HealthcareOrchestrationRoom.broadcast('REQUEST_NAVIGATION', {
        'patientId': 'P-12345',
        'doctorId': 'doc-1',
        'currentLocation': 'Main Entrance Lobby'
    })

    # Wait for human intervention response simulation to fully resolve
    await asyncio.sleep(4)

    # 10. Simulating Reception-Navigation-Room Workflow
    print("\n--- Simulating Reception-Navigation-Room Workflow ---")

    # 10.1 REQUEST_DOCTOR_MATCH
    print("\n[Simulation Step] Patient P-999 describes symptoms: 'chest pain' (expects Cardiology: Dr. Smith)")
    ReceptionNavigationRoom.broadcast('REQUEST_DOCTOR_MATCH', {
        'patientId': 'P-999',
        'symptoms': 'chest pain',
        'requestedSlot': '10:00'
    })

    # 10.2 PATIENT_CHECK_IN
    await asyncio.sleep(1)
    print("\n[Simulation Step] Patient P-999 physically arrives at the facility and checks in")
    ReceptionNavigationRoom.broadcast('PATIENT_CHECK_IN', {
        'patientId': 'P-999'
    })

    # 10.3 DOCTOR_ROOM_CHANGE (Dr. Smith relocates to Room 405 on 4th Floor)
    await asyncio.sleep(1)
    print("\n[Simulation Step] Dr. Smith clinic room is updated dynamically")
    ReceptionNavigationRoom.broadcast('DOCTOR_ROOM_CHANGE', {
        'doctorId': 'doc-1',
        'room': 'Room 405',
        'floor': '4th Floor'
    })

    # 10.4 Patient checks in again or requests navigation to see Dr. Smith again to check dynamic room route update
    await asyncio.sleep(1)
    print("\n[Simulation Step] Patient P-999 requests navigation guidance again after doctor relocation")
    ReceptionNavigationRoom.broadcast('NAVIGATE_TO_ROOM', {
        'patientId': 'P-999',
        'doctorId': 'doc-1',
        'currentLocation': 'Reception Desk'
    })

    # 11. Simulating Clinical-Consult-Room Workflow
    await asyncio.sleep(1)
    print("\n--- Simulating Clinical-Consult-Room Workflow ---")

    # 11.1 SUMMARIZE_PATIENT_HISTORY
    print("\n[Simulation Step] Doctor requests compiled history for patient P-999")
    ClinicalConsultRoom.broadcast('SUMMARIZE_PATIENT_HISTORY', {
        'patientId': 'P-999',
        'history': ['Hypertension since 2022', 'Penicillin allergy'],
        'tests': [
            { 'name': 'ECG', 'date': '2025-05-15', 'result': 'Sinus rhythm' }
        ],
        'surgeries': []
    })

    # 11.2 PRESCRIPTION_WRITTEN (Available medicine: Ibuprofen)
    await asyncio.sleep(1)
    print("\n[Simulation Step] Doctor writes prescription for available medicine: Ibuprofen 400mg")
    ClinicalConsultRoom.broadcast('PRESCRIPTION_WRITTEN', {
        'patientId': 'P-999',
        'prescription': { 'medicine': 'Ibuprofen 400mg' }
    })

    # 11.3 PRESCRIPTION_WRITTEN (Out-of-stock medicine: Rare-Antibiotic)
    await asyncio.sleep(1)
    print("\n[Simulation Step] Doctor writes prescription for out-of-stock medicine: Rare-Antibiotic 500mg")
    ClinicalConsultRoom.broadcast('PRESCRIPTION_WRITTEN', {
        'patientId': 'P-999',
        'prescription': { 'medicine': 'Rare-Antibiotic 500mg' }
    })

    # Wait for final async tasks to resolve
    await asyncio.sleep(4)

if __name__ == "__main__":
    asyncio.run(main())
