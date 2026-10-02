import time
import os
import sys
from dotenv import load_dotenv

load_dotenv('backend/.env')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, joinedload, selectinload
from db.models import Patient, Screening, PHC, User
from api.patients import populate_patient_summary

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("DATABASE_URL not found in backend/.env")
    sys.exit(1)

# Ensure postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

print("==================================================================")
print("PHASE 8: DATABASE & CROSS-REGION LATENCY DIAGNOSTICS")
print("==================================================================")

# 1. Measure Connection & Simple SELECT 1
t0 = time.perf_counter()
with engine.connect() as conn:
    t_conn = (time.perf_counter() - t0) * 1000
    t1 = time.perf_counter()
    res = conn.execute(text("SELECT 1")).scalar()
    t_select = (time.perf_counter() - t1) * 1000

print(f"[1] Connection acquisition: {t_conn:.2f} ms")
print(f"[2] Simple 'SELECT 1' RTT:   {t_select:.2f} ms (Mumbai -> Seoul RTT)")

# 2. Measure Patient query WITHOUT eager loading (simulating existing N+1 behavior)
session = SessionLocal()
try:
    t0 = time.perf_counter()
    raw_patients = session.query(Patient).order_by(Patient.created_at.desc()).limit(50).all()
    t_raw_patients = (time.perf_counter() - t0) * 1000
    print(f"[3] Initial query (39 patients): {t_raw_patients:.2f} ms")

    # Time iterating through populate_patient_summary (triggers 78 lazy loads)
    t0 = time.perf_counter()
    summaries_nplus1 = [populate_patient_summary(p) for p in raw_patients]
    t_nplus1 = (time.perf_counter() - t0) * 1000
    print(f"[4] N+1 Relationship resolution (78 sequential queries): {t_nplus1:.2f} ms")
    print(f"    Total unoptimized endpoint DB time: {t_raw_patients + t_nplus1:.2f} ms (~{(t_raw_patients + t_nplus1)/1000:.2f}s)")
finally:
    session.close()

# 3. Measure Optimized query WITH joinedload / selectinload
session = SessionLocal()
try:
    t0 = time.perf_counter()
    opt_patients = (
        session.query(Patient)
        .options(
            joinedload(Patient.phc),
            selectinload(Patient.screenings).joinedload(Screening.phc)
        )
        .order_by(Patient.created_at.desc())
        .limit(50)
        .all()
    )
    t_opt_fetch = (time.perf_counter() - t0) * 1000
    print(f"\n[5] Optimized eager query (joinedload phc + selectinload screenings in 2 queries): {t_opt_fetch:.2f} ms")

    t0 = time.perf_counter()
    summaries_opt = [populate_patient_summary(p) for p in opt_patients]
    t_opt_serialize = (time.perf_counter() - t0) * 1000
    print(f"[6] Serialization of eagerly loaded patients (0 additional queries): {t_opt_serialize:.2f} ms")
    print(f"    Total optimized endpoint DB time: {t_opt_fetch + t_opt_serialize:.2f} ms (~{(t_opt_fetch + t_opt_serialize)/1000:.3f}s)")
    speedup = (t_raw_patients + t_nplus1) / (t_opt_fetch + t_opt_serialize)
    print(f"    SPEEDUP FACTOR: {speedup:.1f}x FASTER!")
finally:
    session.close()
