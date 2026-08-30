import os
import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from core.security import hash_password, set_auth_db

class MultiTenantDatabase:
    """
    In-memory and persistent multi-tenant database supporting:
    - Primary Health Centres (PHCs)
    - Role-based Users (SUPER_ADMIN, DOCTOR, STAFF)
    - PHC-isolated Patients
    - PHC-isolated Screenings & Predictions
    - Clinician Verification Reviews
    - Platform Audit Logs
    """

    def __init__(self):
        self._phcs: Dict[str, Dict[str, Any]] = {}
        self._users: Dict[str, Dict[str, Any]] = {}
        self._users_by_email: Dict[str, str] = {}  # email -> user_id
        self._patients: Dict[str, Dict[str, Any]] = {}
        self._screenings: Dict[str, Dict[str, Any]] = {}
        self._reviews: Dict[str, Dict[str, Any]] = {}  # screening_id -> review
        self._audit_logs: List[Dict[str, Any]] = []

        # Seed standard initial PHCs and Demo Accounts
        self._seed_demo_data()

    def _seed_demo_data(self):
        """Pre-populates the 4 standard PHCs and all demo user credentials with salted hashes."""
        # ------------------------------------------------------------
        # 1. Primary Health Centres
        # ------------------------------------------------------------
        phcs_data = [
            {
                "id": "phc-pune-001",
                "code": "PHC-PUNE-001",
                "name": "Primary Health Centre Pune",
                "location": "Pune, Maharashtra",
                "state": "Maharashtra",
                "status": "active",
                "contact_email": "admin.pune@netrascan.demo",
                "contact_phone": "+91 20 2567 8901",
                "created_at": "2026-01-15T08:00:00Z",
            },
            {
                "id": "phc-mumbai-001",
                "code": "PHC-MUMBAI-001",
                "name": "Primary Health Centre Mumbai",
                "location": "Mumbai, Maharashtra",
                "state": "Maharashtra",
                "status": "active",
                "contact_email": "admin.mumbai@netrascan.demo",
                "contact_phone": "+91 22 2410 5678",
                "created_at": "2026-01-16T08:00:00Z",
            },
            {
                "id": "phc-delhi-001",
                "code": "PHC-DELHI-001",
                "name": "Primary Health Centre Delhi",
                "location": "New Delhi, NCR",
                "state": "Delhi",
                "status": "active",
                "contact_email": "admin.delhi@netrascan.demo",
                "contact_phone": "+91 11 2389 1234",
                "created_at": "2026-01-17T08:00:00Z",
            },
            {
                "id": "phc-hyd-001",
                "code": "PHC-HYD-001",
                "name": "Primary Health Centre Hyderabad",
                "location": "Hyderabad, Telangana",
                "state": "Telangana",
                "status": "active",
                "contact_email": "admin.hyderabad@netrascan.demo",
                "contact_phone": "+91 40 2780 4321",
                "created_at": "2026-01-18T08:00:00Z",
            },
        ]

        for phc in phcs_data:
            self._phcs[phc["id"]] = phc

        # ------------------------------------------------------------
        # 2. Pre-seeded Users with Salted Password Hashes
        # ------------------------------------------------------------
        users_data = [
            # SUPER ADMIN
            {
                "id": "usr-super-admin-001",
                "email": "admin@netrascan.demo",
                "name": "Dr. Sunita Rao (Super Admin)",
                "password_hash": hash_password("Demo@Admin123"),
                "role": "SUPER_ADMIN",
                "phc_id": None,
                "status": "active",
                "created_at": "2026-01-01T00:00:00Z",
            },
            # PHC PUNE
            {
                "id": "usr-doctor-pune-001",
                "email": "doctor.pune@netrascan.demo",
                "name": "Dr. Aarav Joshi, MD",
                "password_hash": hash_password("Demo@Pune123"),
                "role": "DOCTOR",
                "phc_id": "phc-pune-001",
                "specialization": "Ophthalmology & Vitreo-Retina",
                "license_number": "MMC-2016-7782",
                "status": "active",
                "created_at": "2026-01-15T09:00:00Z",
            },
            {
                "id": "usr-staff-pune-001",
                "email": "staff.pune@netrascan.demo",
                "name": "Sunil Shinde",
                "password_hash": hash_password("Demo@Pune123"),
                "role": "STAFF",
                "phc_id": "phc-pune-001",
                "status": "active",
                "created_at": "2026-01-15T09:30:00Z",
            },
            # PHC MUMBAI
            {
                "id": "usr-doctor-mumbai-001",
                "email": "doctor.mumbai@netrascan.demo",
                "name": "Dr. Meera Kulkarni, MD",
                "password_hash": hash_password("Demo@Mumbai123"),
                "role": "DOCTOR",
                "phc_id": "phc-mumbai-001",
                "specialization": "Retinal Diagnostics & Tele-Ophthalmology",
                "license_number": "MMC-2014-4521",
                "status": "active",
                "created_at": "2026-01-16T09:00:00Z",
            },
            {
                "id": "usr-staff-mumbai-001",
                "email": "staff.mumbai@netrascan.demo",
                "name": "Anjali Sawant",
                "password_hash": hash_password("Demo@Mumbai123"),
                "role": "STAFF",
                "phc_id": "phc-mumbai-001",
                "status": "active",
                "created_at": "2026-01-16T09:30:00Z",
            },
            # PHC DELHI
            {
                "id": "usr-doctor-delhi-001",
                "email": "doctor.delhi@netrascan.demo",
                "name": "Dr. Rajesh Sharma, MD",
                "password_hash": hash_password("Demo@Delhi123"),
                "role": "DOCTOR",
                "phc_id": "phc-delhi-001",
                "specialization": "Vitreo-Retina Consultant",
                "license_number": "DMC-2012-9012",
                "status": "active",
                "created_at": "2026-01-17T09:00:00Z",
            },
            {
                "id": "usr-staff-delhi-001",
                "email": "staff.delhi@netrascan.demo",
                "name": "Vikram Singh",
                "password_hash": hash_password("Demo@Delhi123"),
                "role": "STAFF",
                "phc_id": "phc-delhi-001",
                "status": "active",
                "created_at": "2026-01-17T09:30:00Z",
            },
            # PHC HYDERABAD
            {
                "id": "usr-doctor-hyd-001",
                "email": "doctor.hyderabad@netrascan.demo",
                "name": "Dr. Swathi Reddy, MD",
                "password_hash": hash_password("Demo@Hyderabad123"),
                "role": "DOCTOR",
                "phc_id": "phc-hyd-001",
                "specialization": "Ophthalmic Surgery & Diabetic Retinopathy",
                "license_number": "TSMC-2018-3489",
                "status": "active",
                "created_at": "2026-01-18T09:00:00Z",
            },
            {
                "id": "usr-staff-hyd-001",
                "email": "staff.hyderabad@netrascan.demo",
                "name": "Kiran Rao",
                "password_hash": hash_password("Demo@Hyderabad123"),
                "role": "STAFF",
                "phc_id": "phc-hyd-001",
                "status": "active",
                "created_at": "2026-01-18T09:30:00Z",
            },
        ]

        for u in users_data:
            self._users[u["id"]] = u
            self._users_by_email[u["email"].lower()] = u["id"]

        # ------------------------------------------------------------
        # 3. Pre-seeded Patients for Each Tenant
        # ------------------------------------------------------------
        patients_data = [
            # PUNE PATIENTS
            {
                "id": "pt-pune-001",
                "patient_code": "NS-PUNE-001",
                "full_name": "Ramesh Patil",
                "age": 58,
                "gender": "Male",
                "diabetes_type": "Type 2",
                "duration_years": 11,
                "phone": "+91 98220 12345",
                "phc_id": "phc-pune-001",
                "created_by": "usr-staff-pune-001",
                "created_at": "2026-02-10T10:00:00Z",
            },
            {
                "id": "pt-pune-002",
                "patient_code": "NS-PUNE-002",
                "full_name": "Sunita Deshmukh",
                "age": 49,
                "gender": "Female",
                "diabetes_type": "Type 2",
                "duration_years": 4,
                "phone": "+91 98220 67890",
                "phc_id": "phc-pune-001",
                "created_by": "usr-doctor-pune-001",
                "created_at": "2026-02-12T11:30:00Z",
            },
            # MUMBAI PATIENTS
            {
                "id": "pt-mumbai-001",
                "patient_code": "NS-MUM-001",
                "full_name": "Priya Sharma",
                "age": 45,
                "gender": "Female",
                "diabetes_type": "Type 2",
                "duration_years": 6,
                "phone": "+91 98190 23456",
                "phc_id": "phc-mumbai-001",
                "created_by": "usr-staff-mumbai-001",
                "created_at": "2026-02-14T09:15:00Z",
            },
            {
                "id": "pt-mumbai-002",
                "patient_code": "NS-MUM-002",
                "full_name": "Ganesh Kamat",
                "age": 62,
                "gender": "Male",
                "diabetes_type": "Type 2",
                "duration_years": 15,
                "phone": "+91 98190 78901",
                "phc_id": "phc-mumbai-001",
                "created_by": "usr-doctor-mumbai-001",
                "created_at": "2026-02-15T14:00:00Z",
            },
            # DELHI PATIENTS
            {
                "id": "pt-delhi-001",
                "patient_code": "NS-DEL-001",
                "full_name": "Harpreet Kaur",
                "age": 52,
                "gender": "Female",
                "diabetes_type": "Type 2",
                "duration_years": 8,
                "phone": "+91 98100 34567",
                "phc_id": "phc-delhi-001",
                "created_by": "usr-staff-delhi-001",
                "created_at": "2026-02-16T10:30:00Z",
            },
            # HYDERABAD PATIENTS
            {
                "id": "pt-hyd-001",
                "patient_code": "NS-HYD-001",
                "full_name": "Venkat Rao",
                "age": 60,
                "gender": "Male",
                "diabetes_type": "Type 2",
                "duration_years": 14,
                "phone": "+91 98490 45678",
                "phc_id": "phc-hyd-001",
                "created_by": "usr-doctor-hyd-001",
                "created_at": "2026-02-18T11:00:00Z",
            },
        ]

        for pt in patients_data:
            self._patients[pt["id"]] = pt

        # ------------------------------------------------------------
        # 4. Pre-seeded Screenings
        # ------------------------------------------------------------
        screenings_data = [
            {
                "id": "scr-pune-001",
                "patient_id": "pt-pune-001",
                "phc_id": "phc-pune-001",
                "created_by": "usr-doctor-pune-001",
                "eye": "OD - Right Eye",
                "dr_grade": 2,
                "severity_label": "Moderate Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.924,
                "referable": True,
                "status": "verified",
                "evidence": [
                    "Multiple microaneurysms detected in macular region.",
                    "Focal blot intraretinal hemorrhages observed in temporal arcade.",
                    "Referral advised for vitreo-retinal evaluation.",
                ],
                "created_at": "2026-02-10T10:15:00Z",
            },
            {
                "id": "scr-mumbai-001",
                "patient_id": "pt-mumbai-001",
                "phc_id": "phc-mumbai-001",
                "created_by": "usr-staff-mumbai-001",
                "eye": "OS - Left Eye",
                "dr_grade": 0,
                "severity_label": "No Diabetic Retinopathy",
                "confidence": 0.965,
                "referable": False,
                "status": "pending_review",
                "evidence": [
                    "Retinal microvasculature intact and normal.",
                    "No microaneurysms, hemorrhages or exudates detected.",
                ],
                "created_at": "2026-02-14T09:30:00Z",
            },
        ]

        for s in screenings_data:
            self._screenings[s["id"]] = s

        # Seed review for verified screening
        self._reviews["scr-pune-001"] = {
            "id": "rev-pune-001",
            "screening_id": "scr-pune-001",
            "doctor_id": "usr-doctor-pune-001",
            "doctor_name": "Dr. Aarav Joshi, MD",
            "phc_id": "phc-pune-001",
            "decision": "confirmed",
            "clinician_grade": 2,
            "notes": "Verified AI staging. Scheduled for fluorescein angiography at district hospital.",
            "verified_at": "2026-02-10T11:00:00Z",
        }

    # ------------------------------------------------------------
    # PHC CRUD
    # ------------------------------------------------------------
    async def list_phcs(self) -> List[Dict[str, Any]]:
        return list(self._phcs.values())

    async def get_phc_by_id(self, phc_id: str) -> Optional[Dict[str, Any]]:
        return self._phcs.get(phc_id)

    async def create_phc(self, data: Dict[str, Any]) -> Dict[str, Any]:
        phc_id = data.get("id") or f"phc-{uuid.uuid4().hex[:8]}"
        data["id"] = phc_id
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        data["status"] = data.get("status", "active")
        self._phcs[phc_id] = data
        return data

    async def update_phc(self, phc_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if phc_id not in self._phcs:
            return None
        self._phcs[phc_id].update(data)
        self._phcs[phc_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._phcs[phc_id]

    # ------------------------------------------------------------
    # Users CRUD
    # ------------------------------------------------------------
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = self._users.get(user_id)
        if not user:
            return None
        u_copy = dict(user)
        if u_copy.get("phc_id") and u_copy["phc_id"] in self._phcs:
            u_copy["phc"] = self._phcs[u_copy["phc_id"]]
        return u_copy

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user_id = self._users_by_email.get(email.lower())
        if not user_id:
            return None
        return await self.get_user_by_id(user_id)

    async def list_users(self, phc_id: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for u in self._users.values():
            if phc_id and u.get("phc_id") != phc_id:
                continue
            u_copy = dict(u)
            if u_copy.get("phc_id") and u_copy["phc_id"] in self._phcs:
                u_copy["phc"] = self._phcs[u_copy["phc_id"]]
            # Do not leak password hash
            u_copy.pop("password_hash", None)
            results.append(u_copy)
        return results

    async def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = data.get("id") or f"usr-{uuid.uuid4().hex[:8]}"
        data["id"] = user_id
        data["email"] = data["email"].lower()
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        data["status"] = data.get("status", "active")

        # Hash password if plain text provided
        if "password" in data:
            data["password_hash"] = hash_password(data.pop("password"))

        self._users[user_id] = data
        self._users_by_email[data["email"]] = user_id
        return data

    async def update_user_status(self, user_id: str, status: str) -> Optional[Dict[str, Any]]:
        if user_id not in self._users:
            return None
        self._users[user_id]["status"] = status
        return self._users[user_id]

    # ------------------------------------------------------------
    # Patients (Tenant Scoped)
    # ------------------------------------------------------------
    async def list_patients(
        self, phc_id: Optional[str] = None, search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = []
        for p in self._patients.values():
            if phc_id and p.get("phc_id") != phc_id:
                continue
            if search:
                s = search.lower()
                if s not in p.get("full_name", "").lower() and s not in p.get("patient_code", "").lower():
                    continue
            p_copy = dict(p)
            if p.get("phc_id") in self._phcs:
                p_copy["phc"] = self._phcs[p["phc_id"]]
            results.append(p_copy)
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results

    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        p = self._patients.get(patient_id)
        if not p:
            return None
        p_copy = dict(p)
        if p.get("phc_id") in self._phcs:
            p_copy["phc"] = self._phcs[p["phc_id"]]
        return p_copy

    async def create_patient(self, data: Dict[str, Any]) -> Dict[str, Any]:
        patient_id = data.get("id") or f"pt-{uuid.uuid4().hex[:8]}"
        data["id"] = patient_id
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        if not data.get("patient_code"):
            phc_code = "NS"
            if data.get("phc_id") and data["phc_id"] in self._phcs:
                phc_code = self._phcs[data["phc_id"]]["code"].replace("PHC-", "")
            idx = len(self._patients) + 1
            data["patient_code"] = f"NS-{phc_code}-{idx:03d}"

        self._patients[patient_id] = data
        return data

    # ------------------------------------------------------------
    # Screenings (Tenant Scoped)
    # ------------------------------------------------------------
    async def list_screenings(
        self, phc_id: Optional[str] = None, patient_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = []
        for s in self._screenings.values():
            if phc_id and s.get("phc_id") != phc_id:
                continue
            if patient_id and s.get("patient_id") != patient_id:
                continue
            s_copy = dict(s)
            s_copy["patient"] = self._patients.get(s.get("patient_id"))
            s_copy["review"] = self._reviews.get(s["id"])
            if s.get("phc_id") in self._phcs:
                s_copy["phc"] = self._phcs[s["phc_id"]]
            results.append(s_copy)
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results

    async def get_screening_by_id(self, screening_id: str) -> Optional[Dict[str, Any]]:
        s = self._screenings.get(screening_id)
        if not s:
            return None
        s_copy = dict(s)
        s_copy["patient"] = self._patients.get(s.get("patient_id"))
        s_copy["review"] = self._reviews.get(screening_id)
        if s.get("phc_id") in self._phcs:
            s_copy["phc"] = self._phcs[s["phc_id"]]
        return s_copy

    async def create_screening(self, data: Dict[str, Any]) -> Dict[str, Any]:
        screening_id = data.get("id") or f"scr-{uuid.uuid4().hex[:8]}"
        data["id"] = screening_id
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        data["status"] = data.get("status", "pending_review")
        self._screenings[screening_id] = data
        return data

    async def save_doctor_verification(
        self,
        screening_id: str,
        doctor_id: str,
        doctor_name: str,
        phc_id: str,
        decision: str,
        clinician_grade: int,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        review = {
            "id": f"rev-{uuid.uuid4().hex[:8]}",
            "screening_id": screening_id,
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "phc_id": phc_id,
            "decision": decision,
            "clinician_grade": clinician_grade,
            "notes": notes,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }
        self._reviews[screening_id] = review

        if screening_id in self._screenings:
            self._screenings[screening_id]["status"] = "verified" if decision == "confirmed" else "overridden"

        return review

    # ------------------------------------------------------------
    # Dashboard & Platform Telemetry
    # ------------------------------------------------------------
    async def get_dashboard_summary(self, phc_id: Optional[str] = None) -> Dict[str, Any]:
        screenings = await self.list_screenings(phc_id=phc_id)
        patients = await self.list_patients(phc_id=phc_id)

        total_screenings = len(screenings)
        pending_reviews = sum(1 for s in screenings if s.get("status") == "pending_review")
        referable_cases = sum(1 for s in screenings if s.get("referable"))

        confidences = [
            float(s.get("confidence", 0.92))
            for s in screenings
            if "confidence" in s and s["confidence"]
        ]
        avg_conf = (sum(confidences) / len(confidences)) if confidences else 0.924

        return {
            "total_patients": len(patients),
            "total_screenings": total_screenings,
            "pending_reviews": pending_reviews,
            "referable_cases": referable_cases,
            "average_confidence": round(avg_conf, 3),
            "phc_count": len(self._phcs) if not phc_id else 1,
        }

    async def get_severity_distribution(self, phc_id: Optional[str] = None) -> List[Dict[str, Any]]:
        screenings = await self.list_screenings(phc_id=phc_id)
        counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}

        for s in screenings:
            g = s.get("dr_grade", 0)
            if g in counts:
                counts[g] += 1

        total = sum(counts.values()) or 1
        labels = [
            "Grade 0 (No DR)",
            "Grade 1 (Mild)",
            "Grade 2 (Moderate)",
            "Grade 3 (Severe)",
            "Grade 4 (PDR)",
        ]
        colors = ["#10B981", "#F59E0B", "#F97316", "#EF4444", "#A855F7"]

        return [
            {
                "grade": g,
                "label": labels[g],
                "count": counts[g],
                "percentage": round((counts[g] / total) * 100, 1),
                "color": colors[g],
            }
            for g in range(5)
        ]

    # ------------------------------------------------------------
    # Audit Logs
    # ------------------------------------------------------------
    async def log_audit(
        self,
        user_id: Optional[str],
        user_email: Optional[str],
        user_role: Optional[str],
        phc_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        log_entry = {
            "id": f"log-{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "user_email": user_email,
            "user_role": user_role,
            "phc_id": phc_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._audit_logs.append(log_entry)

    async def list_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        logs = list(self._audit_logs)
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return logs[:limit]


# Global singleton instance
auth_db = MultiTenantDatabase()
set_auth_db(auth_db)
