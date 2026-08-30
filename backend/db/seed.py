"""
NetraScan Database Seeding Module
Initializes production/development database with default PHCs, hierarchical users, and sample patient records.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from db.session import SessionLocal, Base, engine
from db.models import PHC, User, Patient, Screening
from core.security import hash_password


def init_db():
    """Creates all database tables defined in SQLAlchemy metadata."""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables verified/created successfully.")


def seed_data(db: Session = None):
    """Populates development seed data if database is empty."""
    init_db()
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 1. Seed PHCs
        if db.query(PHC).count() == 0:
            print("🌱 Seeding PHC centres...")
            pune = PHC(
                name="Primary Health Centre Pune",
                code="PUNE",
                city="Pune",
                state="Maharashtra",
                address="Shivaji Nagar, District Pune",
                contact_number="+91-20-25531234",
                email="phc.pune@netrascan.org",
                is_active=True
            )
            mumbai = PHC(
                name="Primary Health Centre Mumbai",
                code="MUM",
                city="Mumbai",
                state="Maharashtra",
                address="Andheri East, Mumbai Suburban",
                contact_number="+91-22-26845678",
                email="phc.mumbai@netrascan.org",
                is_active=True
            )
            delhi = PHC(
                name="Primary Health Centre Delhi",
                code="DEL",
                city="Delhi",
                state="Delhi",
                address="Pahar Ganj, Central Delhi",
                contact_number="+91-11-23589012",
                email="phc.delhi@netrascan.org",
                is_active=True
            )
            hyderabad = PHC(
                name="Primary Health Centre Hyderabad",
                code="HYD",
                city="Hyderabad",
                state="Telangana",
                address="Secunderabad, Hyderabad",
                contact_number="+91-40-27803456",
                email="phc.hyd@netrascan.org",
                is_active=True
            )
            db.add_all([pune, mumbai, delhi, hyderabad])
            db.commit()
            print("✅ 4 PHCs seeded.")

        pune = db.query(PHC).filter(PHC.code == "PUNE").first()
        mumbai = db.query(PHC).filter(PHC.code == "MUM").first()

        # 2. Seed Users
        if db.query(User).count() == 0:
            print("🌱 Seeding hierarchical users...")
            admin = User(
                phc_id=None,
                name="Super Administrator",
                email="admin@netrascan.org",
                password_hash=hash_password("NetraScan@Admin2026"),
                role="SUPER_ADMIN",
                phone="+91-9876543210",
                is_active=True
            )
            doc_pune = User(
                phc_id=pune.id,
                name="Dr. Anjali Deshmukh",
                email="doctor.pune@netrascan.org",
                password_hash=hash_password("Doctor@Pune123"),
                role="DOCTOR",
                phone="+91-9822012345",
                is_active=True
            )
            staff_pune = User(
                phc_id=pune.id,
                name="Suresh Shinde",
                email="staff.pune@netrascan.org",
                password_hash=hash_password("Staff@Pune123"),
                role="STAFF",
                phone="+91-9822054321",
                is_active=True
            )
            # Backward-compatible Pune PHC Login identifier
            phc_pune_login = User(
                phc_id=pune.id,
                name="PHC Pune Clinical Staff",
                email="PHC-PUNE-001",
                password_hash=hash_password("NetraScan@123"),
                role="STAFF",
                phone="+91-20-25531234",
                is_active=True
            )
            doc_mumbai = User(
                phc_id=mumbai.id,
                name="Dr. Rajesh Mehta",
                email="doctor.mumbai@netrascan.org",
                password_hash=hash_password("Doctor@Mumbai123"),
                role="DOCTOR",
                phone="+91-9819012345",
                is_active=True
            )
            staff_mumbai = User(
                phc_id=mumbai.id,
                name="Priya Sawant",
                email="staff.mumbai@netrascan.org",
                password_hash=hash_password("Staff@Mumbai123"),
                role="STAFF",
                phone="+91-9819054321",
                is_active=True
            )
            db.add_all([admin, doc_pune, staff_pune, phc_pune_login, doc_mumbai, staff_mumbai])
            db.commit()
            print("✅ Users seeded.")

        # 3. Seed Initial Patients
        if db.query(Patient).count() == 0:
            print("🌱 Seeding initial patients...")
            p1 = Patient(
                patient_uid="NS-PUN-000001",
                phc_id=pune.id,
                full_name="Rahul Sharma",
                date_of_birth="1968-05-14",
                age=58,
                gender="Male",
                phone="+91-9823112233",
                email="rahul.sharma@example.com",
                address="Kothrud, Pune, Maharashtra",
                diabetes_status="Type 2",
                diabetes_duration="8 years",
                medical_notes="History of moderate hypertension. Regular metformin."
            )
            p2 = Patient(
                patient_uid="NS-PUN-000002",
                phc_id=pune.id,
                full_name="Sunita Patil",
                date_of_birth="1974-11-20",
                age=52,
                gender="Female",
                phone="+91-9823445566",
                email="sunita.patil@example.com",
                address="Aundh, Pune, Maharashtra",
                diabetes_status="Type 2",
                diabetes_duration="4 years",
                medical_notes="Recent HbA1c 7.8%. Baseline screening."
            )
            p3 = Patient(
                patient_uid="NS-MUM-000001",
                phc_id=mumbai.id,
                full_name="Vikram Merchant",
                date_of_birth="1960-03-10",
                age=66,
                gender="Male",
                phone="+91-9820998877",
                email="vikram.m@example.com",
                address="Bandra West, Mumbai",
                diabetes_status="Type 2",
                diabetes_duration="15 years",
                medical_notes="Insulin dependent. Reported mild blurred vision."
            )
            db.add_all([p1, p2, p3])
            db.commit()
            print("✅ Initial patients seeded.")

    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_data()
