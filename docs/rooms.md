# Band of Agents Room Architecture

M.A.S.H (Medical Assistant & Services Hub) leverages a multi-room orchestration design based on the Band of Agents SDK (`BandSDK`). By segmenting agents into distinct, specialized virtual rooms, the system prevents event congestion, maintains privacy boundaries, and ensures secure, asynchronous data transmission.

Below is an overview of the core room structure and planned specialized rooms.

---

## 1. Central Orchestration Room
### `Healthcare-Orchestration-Room`
* **Purpose**: The primary event bus where all high-level system workflows are initiated and cross-room workflows are coordinated.
* **Participating Agents**: All agents (Registration, Patient Management, Patient Navigation, Patient Summary, Medicine/Prescription Management, Stock Management, Telemetry).
* **Key Events**:
  - `GENERATE_SUMMARY` (Initial check-in trigger)
  - `PROCESS_PRESCRIPTION` (Clinical outcome trigger)

---

## 2. Specialized Sub-Rooms (Planned Expansion)

To scale the network and segment specific workflows, the M.A.S.H ecosystem will be split into three core specialized rooms.

### A. Reception & Location Room (`Reception-Navigation-Room`)
* **Purpose**: Coordinates remote patient registrations, symptom-based appointment scheduling, doctor matching, and physical in-facility navigation.
* **Participating Agents**:
  - **Registration Agent**: Automatically matches patients' symptoms with doctors' specialties and manages room lists.
  - **Patient Management Agent**: Receives remote bookings from anywhere and manages the active patient queue.
  - **Patient Navigation Agent**: Manages doctor-room maps and tracks locations.
* **Key Events**:
  - `REQUEST_DOCTOR_MATCH`: Triggered when a patient remotely books and describes symptoms.
  - `DOCTOR_ASSIGNED`: Confirms the doctor matching output based on specialty and availability.
  - `PATIENT_CHECK_IN`: Dispatched by the patient's mobile app on physical arrival.
  - `NAVIGATE_TO_ROOM`: Broadcasts active room-to-room navigation prompts.
  - `DOCTOR_ROOM_CHANGE`: Updates doctor clinic directories dynamically.

### B. Clinical Consultation Room (`Clinical-Consult-Room`)
* **Purpose**: Coordinates diagnostic reviews and handles high-security patient medical history compilation during visits.
* **Participating Agents**:
  - **Patient Summary Agent**: Pulls historical conditions, lab tests, and vitals from Supabase.
  - **Medicine/Prescription Management Agent**: Evaluates written clinical options.
* **Key Events**:
  - `SUMMARIZE_PATIENT_HISTORY`: Requests extraction of historical patient profiles.
  - `PRESCRIPTION_WRITTEN`: Initiates safety reviews and starts the medication routing process.

### C. Pharmacy & Inventory Room (`Pharmacy-Inventory-Room`)
* **Purpose**: Automates order routing, checks inventory stocks, and coordinates stock reorders.
* **Participating Agents**:
  - **Medicine/Prescription Management Agent**: Translates clinician orders into logistics tasks.
  - **Stock Management Agent**: Audits stock levels and triggers reorder warnings.
* **Key Events**:
  - `CHECK_MEDICINE_AVAILABILITY`: Asks if specific medicine doses are in stock.
  - `ROUTE_TO_PHARMACY`: Sends verified orders to the incoming pharmacist queue.
  - `REQUEST_HUMAN_INTERVENTION`: Pauses flow to prompt doctors for out-of-stock alternative orders.
  - `TRIGGER_REORDER`: Automates restocking requests for high-frequency items.

---

## 3. Global Auditing Channel
### `Telemetry-Audit-Room`
* **Purpose**: A dedicated read-only room where the **Telemetry Agent** captures state updates, agent join events, and human-in-the-loop approvals for clinic audit reports.
* **Key Events**:
  - `AGENT_JOINED`
  - `STATE_UPDATED`
  - `HUMAN_INTERVENTION_REQUESTED` / `RESOLVED`
