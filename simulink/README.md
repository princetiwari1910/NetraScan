# NetraScan Simulink / SimEvents District Triage Simulation

This directory contains MATLAB and Simulink discrete-event models (SimEvents) simulating patient flows, tele-ophthalmology triage queues, and district hospital capacity planning.

---

## 📊 Modules

1. **`models/`**:
   - `tele_ophthalmology_queue.slx`: Simulink/SimEvents model modeling rural Primary Health Center (PHC) patient arrival rates, automated NetraScan AI triage latency, and referral queue dynamics at tertiary eye hospitals.
2. **`scripts/`**:
   - `patient_queue_sim.m`: MATLAB script computing waiting times, queue backlogs, and doctor utilization rates based on screening volume.
3. **`data/`**:
   - `district_hospital_triage_log.csv`: Baseline empirical and simulated triage logs.

---

## 🚀 How to Run

1. Open MATLAB (R2023b or later) with **Simulink** and **SimEvents** toolboxes installed.
2. Run `scripts/patient_queue_sim.m` to simulate a 30-day screening drive across 5 district PHCs.
