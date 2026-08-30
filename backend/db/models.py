import json
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from db.session import Base


class PHC(Base):
    __tablename__ = "phcs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    contact_number = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="phc", cascade="all, delete-orphan")
    patients = relationship("Patient", back_populates="phc", cascade="all, delete-orphan")
    screenings = relationship("Screening", back_populates="phc", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phc_id = Column(Integer, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # SUPER_ADMIN, DOCTOR, STAFF
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    phc = relationship("PHC", back_populates="users")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_uid = Column(String(100), unique=True, index=True, nullable=False)
    phc_id = Column(Integer, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    diabetes_status = Column(String(50), default="Type 2", nullable=False)
    diabetes_duration = Column(String(50), nullable=True)
    medical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    phc = relationship("PHC", back_populates="patients")
    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan", order_by="desc(Screening.created_at)")


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    screening_uid = Column(String(100), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    phc_id = Column(Integer, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    performed_by = Column(String(255), nullable=True)
    image_path = Column(Text, nullable=True)
    examined_eye = Column(String(50), default="OD - Right Eye", nullable=False)

    # AI Quality Gate Metric
    quality_status = Column(String(50), default="Pass", nullable=False)
    laplacian_variance = Column(Float, nullable=False)

    # AI Prediction
    predicted_grade = Column(Integer, nullable=False)
    severity_label = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    referable = Column(Boolean, nullable=False)
    model_name = Column(String(100), default="NetraScan ResNet-18", nullable=False)
    model_version = Column(String(50), default="1.0", nullable=False)
    inference_time_ms = Column(Integer, default=0, nullable=False)

    # Explainability & Evidence
    gradcam_reference = Column(Text, nullable=True)
    ai_evidence = Column(JSON, nullable=True)
    class_probabilities = Column(JSON, nullable=True)

    # Human-in-the-Loop Doctor Verification
    doctor_verified = Column(Boolean, default=False, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    doctor_name = Column(String(255), nullable=True)
    doctor_decision = Column(Integer, nullable=True)  # Final verified grade (0 to 4)
    doctor_notes = Column(Text, nullable=True)

    # Timestamps
    screened_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="screenings")
    phc = relationship("PHC", back_populates="screenings")
