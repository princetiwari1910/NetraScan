import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from db.session import SessionLocal
from db.models import Patient, Screening, PHC, User

def run_update():
    db = SessionLocal()
    try:
        pune_phc = db.query(PHC).filter(PHC.code == "PUNE").first()
        if not pune_phc:
            pune_phc = db.query(PHC).first()
        
        phc_id = pune_phc.id if pune_phc else 1

        # 1. Fetch reference sample images and CAMs from existing screenings
        s_top = db.query(Screening).filter(Screening.id == 66).first()
        if not s_top:
            s_top = db.query(Screening).filter(Screening.predicted_grade == 3).order_by(Screening.id.desc()).first()

        img_g3 = s_top.image_path if s_top else None
        cam_g3 = s_top.gradcam_reference if s_top else None

        s_g2 = db.query(Screening).filter(Screening.predicted_grade == 2, Screening.image_path.isnot(None)).first()
        img_g2 = s_g2.image_path if s_g2 else img_g3
        cam_g2 = s_g2.gradcam_reference if s_g2 else cam_g3

        s_g4 = db.query(Screening).filter(Screening.predicted_grade == 4, Screening.image_path.isnot(None)).first()
        img_g4 = s_g4.image_path if s_g4 else img_g3
        cam_g4 = s_g4.gradcam_reference if s_g4 else cam_g3

        s_g0 = db.query(Screening).filter(Screening.predicted_grade == 0, Screening.image_path.isnot(None)).first()
        img_g0 = s_g0.image_path if s_g0 else img_g3
        cam_g0 = s_g0.gradcam_reference if s_g0 else cam_g3

        # 2. Keep the TOP 1 Prince Tiwari screening (Screening #66) and delete all duplicate Prince Tiwari screenings
        top_prince_screening_id = s_top.id if s_top else 66
        print(f"Keeping TOP 1 Prince Tiwari screening (ID: {top_prince_screening_id})...")

        # Find all Prince Tiwari patient records
        prince_patients = db.query(Patient).filter(Patient.full_name.ilike("%Prince Tiwari%")).all()
        prince_patient_ids = [p.id for p in prince_patients]
        print(f"Found Prince Tiwari patient IDs: {prince_patient_ids}")

        # Delete other screenings for Prince Tiwari except top_prince_screening_id
        deleted_pt_screenings = (
            db.query(Screening)
            .filter(
                Screening.patient_id.in_(prince_patient_ids),
                Screening.id != top_prince_screening_id
            )
            .delete(synchronize_session=False)
        )
        print(f"Deleted {deleted_pt_screenings} duplicate screenings of Prince Tiwari.")

        # Clean up unused Prince Tiwari patient records, keeping the one linked to top_prince_screening_id
        top_patient_id = s_top.patient_id if s_top else 22
        for p in prince_patients:
            if p.id != top_patient_id:
                # Check if patient has any remaining screenings
                count = db.query(Screening).filter(Screening.patient_id == p.id).count()
                if count == 0:
                    db.delete(p)

        # 3. Clean up excessive duplicate test screenings of other repeated names (like Deepak Joshi, Aarav Deshmukh duplicates)
        deepak_screenings = db.query(Screening).join(Patient).filter(Patient.full_name.ilike("%Deepak Joshi%")).order_by(Screening.id.desc()).all()
        if len(deepak_screenings) > 1:
            for ds in deepak_screenings[1:]:
                db.delete(ds)
            print(f"Cleaned up duplicate Deepak Joshi screenings, kept 1.")

        aarav_screenings = db.query(Screening).join(Patient).filter(Patient.full_name.ilike("%Aarav Deshmukh%")).order_by(Screening.id.desc()).all()
        if len(aarav_screenings) > 1:
            for as_rec in aarav_screenings[1:]:
                db.delete(as_rec)
            print(f"Cleaned up duplicate Aarav Deshmukh screenings, kept 1.")

        db.commit()

        # 4. Insert new diverse patient records with realistic clinical data
        base_time = s_top.created_at if s_top else datetime.utcnow()
        print(f"Base time of top Prince Tiwari screening: {base_time}")

        new_patient_data = [
            {
                "full_name": "Ananya Sharma",
                "age": 48,
                "gender": "Female",
                "date_of_birth": "1978-04-12",
                "phone": "+91-9822123401",
                "email": "ananya.sharma@example.com",
                "address": "Kothrud, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "6 years",
                "medical_notes": "HbA1c 8.2%. Complaining of occasional blurry vision in left eye.",
                "grade": 2,
                "severity_label": "Moderate Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.9140,
                "referable": True,
                "examined_eye": "OS - Left Eye",
                "image_path": img_g2,
                "cam_path": cam_g2,
                "evidence": [
                    "Multiple microaneurysms and focal blot intraretinal hemorrhages identified.",
                    "Focal hard lipid exudates adjacent to macular boundary.",
                    "Moderate NPDR detected; clinical referral indicated for ophthalmological evaluation.",
                    "Follow-up examination recommended within 3 months."
                ],
                "lesions": {
                    "total_count": 14,
                    "by_type": {"MA": 6, "HE": 3, "EX": 5, "SE": 0},
                    "findings": [
                        {"id": "EX_001", "type": "EX", "name": "Hard Exudate", "confidence": 0.92, "bbox": [0.65, 0.42, 0.05, 0.05], "center": [0.67, 0.44], "area_px": 8},
                        {"id": "MA_001", "type": "MA", "name": "Microaneurysm", "confidence": 0.91, "bbox": [0.70, 0.38, 0.04, 0.04], "center": [0.72, 0.40], "area_px": 5},
                        {"id": "HE_001", "type": "HE", "name": "Intraretinal Hemorrhage", "confidence": 0.89, "bbox": [0.60, 0.48, 0.06, 0.05], "center": [0.63, 0.50], "area_px": 12}
                    ]
                },
                "delta_minutes": 5
            },
            {
                "full_name": "Rajesh Kulkarni",
                "age": 62,
                "gender": "Male",
                "date_of_birth": "1964-08-23",
                "phone": "+91-9822123402",
                "email": "rajesh.k@example.com",
                "address": "Aundh, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "14 years",
                "medical_notes": "Insulin-dependent. Severe vision fluctuation. Urgent referral required.",
                "grade": 4,
                "severity_label": "Proliferative Diabetic Retinopathy",
                "confidence": 0.9580,
                "referable": True,
                "examined_eye": "OD - Right Eye",
                "image_path": img_g4,
                "cam_path": cam_g4,
                "evidence": [
                    "Definitive neovascularization of the disc (NVD) and retina (NVE) detected.",
                    "Extensive pre-retinal hemorrhages and fibrovascular proliferation observed.",
                    "High-risk Proliferative Diabetic Retinopathy (PDR) confirmed.",
                    "Urgent vitreo-retinal surgical consultation and panretinal photocoagulation (PRP) evaluation required within 1 to 2 weeks."
                ],
                "lesions": {
                    "total_count": 32,
                    "by_type": {"MA": 12, "HE": 8, "EX": 9, "SE": 3},
                    "findings": [
                        {"id": "HE_001", "type": "HE", "name": "Intraretinal Hemorrhage", "confidence": 0.96, "bbox": [0.72, 0.45, 0.08, 0.07], "center": [0.75, 0.48], "area_px": 35},
                        {"id": "EX_001", "type": "EX", "name": "Hard Exudate", "confidence": 0.94, "bbox": [0.68, 0.35, 0.06, 0.06], "center": [0.71, 0.38], "area_px": 18}
                    ]
                },
                "delta_minutes": 10
            },
            {
                "full_name": "Meera Nair",
                "age": 55,
                "gender": "Female",
                "date_of_birth": "1971-02-17",
                "phone": "+91-9822123403",
                "email": "meera.nair@example.com",
                "address": "Baner, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "3 years",
                "medical_notes": "Diet-controlled diabetes. HbA1c 6.9%. Baseline annual checkup.",
                "grade": 1,
                "severity_label": "Mild Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.8850,
                "referable": False,
                "examined_eye": "OD - Right Eye",
                "image_path": img_g2,
                "cam_path": cam_g2,
                "evidence": [
                    "Isolated retinal microaneurysms detected in temporal quadrant.",
                    "No hard exudates, cotton wool spots, or hemorrhages present.",
                    "Mild Non-Proliferative Diabetic Retinopathy (NPDR) with low immediate progression risk.",
                    "Annual routine dilated fundus examination recommended."
                ],
                "lesions": {
                    "total_count": 4,
                    "by_type": {"MA": 4, "HE": 0, "EX": 0, "SE": 0},
                    "findings": [
                        {"id": "MA_001", "type": "MA", "name": "Microaneurysm", "confidence": 0.89, "bbox": [0.68, 0.41, 0.04, 0.04], "center": [0.70, 0.43], "area_px": 4},
                        {"id": "MA_002", "type": "MA", "name": "Microaneurysm", "confidence": 0.87, "bbox": [0.74, 0.46, 0.03, 0.03], "center": [0.75, 0.47], "area_px": 3}
                    ]
                },
                "delta_minutes": 15
            },
            {
                "full_name": "Kavita Joshi",
                "age": 42,
                "gender": "Female",
                "date_of_birth": "1984-06-30",
                "phone": "+91-9822123404",
                "email": "kavita.j@example.com",
                "address": "Hadapsar, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "2 years",
                "medical_notes": "Well controlled blood sugars. No visual complaints.",
                "grade": 0,
                "severity_label": "No Diabetic Retinopathy",
                "confidence": 0.9820,
                "referable": False,
                "examined_eye": "OS - Left Eye",
                "image_path": img_g0,
                "cam_path": cam_g0,
                "evidence": [
                    "No microaneurysms, hemorrhages, or exudates observed across all quadrants.",
                    "Normal optic disc margins and intact foveal avascular zone.",
                    "Negative for diabetic retinopathy changes.",
                    "Standard routine annual screening advised under national ophthalmology protocol."
                ],
                "lesions": {
                    "total_count": 0,
                    "by_type": {"MA": 0, "HE": 0, "EX": 0, "SE": 0},
                    "findings": []
                },
                "delta_minutes": 20
            },
            {
                "full_name": "Vikram Malhotra",
                "age": 59,
                "gender": "Male",
                "date_of_birth": "1967-11-05",
                "phone": "+91-9822123405",
                "email": "vikram.m@example.com",
                "address": "Kalyani Nagar, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "11 years",
                "medical_notes": "History of hypertension and dyslipidemia. HbA1c 9.1%.",
                "grade": 3,
                "severity_label": "Severe Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.9460,
                "referable": True,
                "examined_eye": "OD - Right Eye",
                "image_path": img_g3,
                "cam_path": cam_g3,
                "evidence": [
                    "Extensive blot hemorrhages in >20 per quadrant in 4 quadrants (4-2-1 rule).",
                    "Definite venous beading present in 2 quadrants.",
                    "Severe NPDR detected; elevated risk of rapid proliferative transition.",
                    "Urgent ophthalmologist consultation required within 2 to 4 weeks."
                ],
                "lesions": {
                    "total_count": 24,
                    "by_type": {"MA": 8, "HE": 6, "EX": 8, "SE": 2},
                    "findings": [
                        {"id": "HE_001", "type": "HE", "name": "Intraretinal Hemorrhage", "confidence": 0.95, "bbox": [0.65, 0.45, 0.07, 0.06], "center": [0.68, 0.48], "area_px": 28},
                        {"id": "EX_001", "type": "EX", "name": "Hard Exudate", "confidence": 0.93, "bbox": [0.72, 0.38, 0.05, 0.05], "center": [0.74, 0.40], "area_px": 14}
                    ]
                },
                "delta_minutes": 25
            },
            {
                "full_name": "Priya Verma",
                "age": 50,
                "gender": "Female",
                "date_of_birth": "1976-09-14",
                "phone": "+91-9822123406",
                "email": "priya.verma@example.com",
                "address": "Viman Nagar, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "7 years",
                "medical_notes": "Metformin 1000mg. Recent mild metamorphopsia.",
                "grade": 2,
                "severity_label": "Moderate Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.8970,
                "referable": True,
                "examined_eye": "OS - Left Eye",
                "image_path": img_g2,
                "cam_path": cam_g2,
                "evidence": [
                    "Multiple microaneurysms and cluster of hard lipid exudates.",
                    "Intraretinal hemorrhages confined to upper-temporal quadrant.",
                    "Moderate NPDR detected; clinical referral indicated for vitreo-retinal evaluation.",
                    "Follow-up examination recommended within 3 months."
                ],
                "lesions": {
                    "total_count": 16,
                    "by_type": {"MA": 7, "HE": 2, "EX": 7, "SE": 0},
                    "findings": [
                        {"id": "EX_001", "type": "EX", "name": "Hard Exudate", "confidence": 0.91, "bbox": [0.66, 0.40, 0.05, 0.05], "center": [0.68, 0.42], "area_px": 9}
                    ]
                },
                "delta_minutes": 30
            },
            {
                "full_name": "Amit Patel",
                "age": 64,
                "gender": "Male",
                "date_of_birth": "1962-01-20",
                "phone": "+91-9822123407",
                "email": "amit.patel@example.com",
                "address": "Pimpri-Chinchwad, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "16 years",
                "medical_notes": "Longstanding diabetes. Floaters reported in right eye.",
                "grade": 4,
                "severity_label": "Proliferative Diabetic Retinopathy",
                "confidence": 0.9630,
                "referable": True,
                "examined_eye": "OD - Right Eye",
                "image_path": img_g4,
                "cam_path": cam_g4,
                "evidence": [
                    "Definitive neovascularization of the retina (NVE) identified.",
                    "Pre-retinal hemorrhage in superior temporal arcade.",
                    "Proliferative Diabetic Retinopathy (PDR) referral threshold reached.",
                    "Urgent specialist referral required within 1 to 2 weeks for PRP therapy."
                ],
                "lesions": {
                    "total_count": 29,
                    "by_type": {"MA": 10, "HE": 9, "EX": 8, "SE": 2},
                    "findings": [
                        {"id": "HE_001", "type": "HE", "name": "Intraretinal Hemorrhage", "confidence": 0.95, "bbox": [0.70, 0.42, 0.08, 0.07], "center": [0.74, 0.45], "area_px": 30}
                    ]
                },
                "delta_minutes": 35
            },
            {
                "full_name": "Sunita Rao",
                "age": 57,
                "gender": "Female",
                "date_of_birth": "1969-05-18",
                "phone": "+91-9822123408",
                "email": "sunita.rao@example.com",
                "address": "Koregaon Park, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "4 years",
                "medical_notes": "HbA1c 7.1%. Good glycemic control. Routine diabetic screening.",
                "grade": 1,
                "severity_label": "Mild Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.8640,
                "referable": False,
                "examined_eye": "OS - Left Eye",
                "image_path": img_g2,
                "cam_path": cam_g2,
                "evidence": [
                    "Few isolated microaneurysms detected in nasal quadrant.",
                    "No hard exudates, cotton-wool spots, or hemorrhages identified.",
                    "Mild Non-Proliferative Diabetic Retinopathy (NPDR).",
                    "Annual routine screening recommended."
                ],
                "lesions": {
                    "total_count": 3,
                    "by_type": {"MA": 3, "HE": 0, "EX": 0, "SE": 0},
                    "findings": [
                        {"id": "MA_001", "type": "MA", "name": "Microaneurysm", "confidence": 0.86, "bbox": [0.62, 0.45, 0.03, 0.03], "center": [0.63, 0.46], "area_px": 3}
                    ]
                },
                "delta_minutes": 40
            },
            {
                "full_name": "Ramesh Gupta",
                "age": 68,
                "gender": "Male",
                "date_of_birth": "1958-12-04",
                "phone": "+91-9822123409",
                "email": "ramesh.gupta@example.com",
                "address": "Shivaji Nagar, District Pune, Maharashtra",
                "diabetes_status": "Type 2",
                "diabetes_duration": "13 years",
                "medical_notes": "Diabetic nephropathy comorbidity. HbA1c 8.9%.",
                "grade": 3,
                "severity_label": "Severe Non-Proliferative Diabetic Retinopathy",
                "confidence": 0.9310,
                "referable": True,
                "examined_eye": "OD - Right Eye",
                "image_path": img_g3,
                "cam_path": cam_g3,
                "evidence": [
                    "Intraretinal microvascular abnormalities (IRMA) in 2 quadrants.",
                    "Multiple blot hemorrhages and venous beading present.",
                    "Severe NPDR with imminent proliferative progression risk.",
                    "Urgent ophthalmologist consultation required within 2 to 4 weeks."
                ],
                "lesions": {
                    "total_count": 22,
                    "by_type": {"MA": 8, "HE": 6, "EX": 7, "SE": 1},
                    "findings": [
                        {"id": "HE_001", "type": "HE", "name": "Intraretinal Hemorrhage", "confidence": 0.93, "bbox": [0.67, 0.44, 0.06, 0.06], "center": [0.70, 0.47], "area_px": 22}
                    ]
                },
                "delta_minutes": 45
            }
        ]

        # Get the highest patient UID number
        existing_patients = db.query(Patient).all()
        max_pat_num = 25
        for p in existing_patients:
            if p.patient_uid and "PUN" in p.patient_uid:
                try:
                    num = int(p.patient_uid.split("-")[-1])
                    if num > max_pat_num:
                        max_pat_num = num
                except:
                    pass

        # Get highest screening UID number
        existing_screenings = db.query(Screening).all()
        max_scr_num = 66
        for s in existing_screenings:
            if s.screening_uid and "PUN" in s.screening_uid:
                try:
                    num = int(s.screening_uid.split("-")[-1])
                    if num > max_scr_num:
                        max_scr_num = num
                except:
                    pass

        print(f"Starting new patient numbers from {max_pat_num + 1} and screening numbers from {max_scr_num + 1}...")

        for data in new_patient_data:
            max_pat_num += 1
            pat_uid = f"NS-PUN-{max_pat_num:06d}"
            
            patient = Patient(
                patient_uid=pat_uid,
                phc_id=phc_id,
                full_name=data["full_name"],
                age=data["age"],
                gender=data["gender"],
                date_of_birth=data["date_of_birth"],
                phone=data["phone"],
                email=data["email"],
                address=data["address"],
                diabetes_status=data["diabetes_status"],
                diabetes_duration=data["diabetes_duration"],
                medical_notes=data["medical_notes"]
            )
            db.add(patient)
            db.flush()

            max_scr_num += 1
            scr_uid = f"SCR-PUN-{max_scr_num:06d}"
            screening_time = base_time - timedelta(minutes=data["delta_minutes"])

            probs = [0.0, 0.0, 0.0, 0.0, 0.0]
            probs[data["grade"]] = data["confidence"]
            remaining = round(1.0 - data["confidence"], 4)
            other_indices = [i for i in range(5) if i != data["grade"]]
            for oi in other_indices:
                probs[oi] = round(remaining / len(other_indices), 4)

            screening = Screening(
                screening_uid=scr_uid,
                patient_id=patient.id,
                phc_id=phc_id,
                performed_by="PHC Pune Clinical Staff",
                image_path=data["image_path"],
                examined_eye=data["examined_eye"],
                quality_status="Pass",
                laplacian_variance=145.2,
                predicted_grade=data["grade"],
                severity_label=data["severity_label"],
                confidence=data["confidence"],
                referable=data["referable"],
                model_name="NetraScan ResNet-18",
                model_version="1.0",
                inference_time_ms=185,
                gradcam_reference=data["cam_path"],
                ai_evidence={
                    "evidence": data["evidence"],
                    "lesions": data["lesions"]
                },
                class_probabilities={f"Grade_{i}": probs[i] for i in range(5)},
                doctor_verified=False,
                doctor_id=None,
                doctor_name=None,
                doctor_decision=None,
                doctor_notes=None,
                screened_at=screening_time,
                created_at=screening_time,
                updated_at=screening_time
            )
            db.add(screening)

        db.commit()
        print(" Successfully cleaned duplicate Prince Tiwari records and added diverse clinical records!")

        # Verify final list
        print("\n--- Current Top 12 Triage Queue Screenings ---")
        final_screenings = db.query(Screening).order_by(Screening.created_at.desc()).limit(12).all()
        for idx, s in enumerate(final_screenings, 1):
            p = s.patient
            print(f"{idx}. {p.full_name if p else 'N/A'} | {s.screening_uid} | Grade {s.predicted_grade} ({s.severity_label}) | Conf: {s.confidence*100:.1f}% | Created: {s.created_at}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during update: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_update()
