"""Initial NetraScan PostgreSQL Schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-22 00:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create phcs table
    op.create_table(
        'phcs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('contact_number', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_phcs_id', 'phcs', ['id'], unique=False)
    op.create_index('ix_phcs_code', 'phcs', ['code'], unique=True)

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('phc_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['phc_id'], ['phcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_phc_id', 'users', ['phc_id'], unique=False)

    # 3. Create patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('patient_uid', sa.String(length=100), nullable=False),
        sa.Column('phc_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('date_of_birth', sa.String(length=50), nullable=True),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(length=20), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('diabetes_status', sa.String(length=50), server_default='Type 2', nullable=False),
        sa.Column('diabetes_duration', sa.String(length=50), nullable=True),
        sa.Column('medical_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['phc_id'], ['phcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_uid')
    )
    op.create_index('ix_patients_id', 'patients', ['id'], unique=False)
    op.create_index('ix_patients_patient_uid', 'patients', ['patient_uid'], unique=True)
    op.create_index('ix_patients_phc_id', 'patients', ['phc_id'], unique=False)
    op.create_index('ix_patients_full_name', 'patients', ['full_name'], unique=False)

    # 4. Create screenings table
    op.create_table(
        'screenings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('screening_uid', sa.String(length=100), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('phc_id', sa.Integer(), nullable=False),
        sa.Column('performed_by', sa.String(length=255), nullable=True),
        sa.Column('image_path', sa.Text(), nullable=True),
        sa.Column('examined_eye', sa.String(length=50), server_default='OD - Right Eye', nullable=False),
        sa.Column('quality_status', sa.String(length=50), server_default='Pass', nullable=False),
        sa.Column('laplacian_variance', sa.Float(), nullable=False),
        sa.Column('predicted_grade', sa.Integer(), nullable=False),
        sa.Column('severity_label', sa.String(length=100), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('referable', sa.Boolean(), nullable=False),
        sa.Column('model_name', sa.String(length=100), server_default='NetraScan ResNet-18', nullable=False),
        sa.Column('model_version', sa.String(length=50), server_default='1.0', nullable=False),
        sa.Column('inference_time_ms', sa.Integer(), server_default='0', nullable=False),
        sa.Column('gradcam_reference', sa.Text(), nullable=True),
        sa.Column('ai_evidence', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('class_probabilities', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('doctor_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=True),
        sa.Column('doctor_name', sa.String(length=255), nullable=True),
        sa.Column('doctor_decision', sa.Integer(), nullable=True),
        sa.Column('doctor_notes', sa.Text(), nullable=True),
        sa.Column('screened_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['phc_id'], ['phcs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('screening_uid')
    )
    op.create_index('ix_screenings_id', 'screenings', ['id'], unique=False)
    op.create_index('ix_screenings_screening_uid', 'screenings', ['screening_uid'], unique=True)
    op.create_index('ix_screenings_patient_id', 'screenings', ['patient_id'], unique=False)
    op.create_index('ix_screenings_phc_id', 'screenings', ['phc_id'], unique=False)
    op.create_index('idx_screenings_doctor_id', 'screenings', ['doctor_id'], unique=False)
    op.create_index('idx_screenings_doctor_verified', 'screenings', ['doctor_verified'], unique=False)
    op.create_index('idx_screenings_screened_at', 'screenings', ['screened_at'], unique=False)
    op.create_index('idx_screenings_created_at', 'screenings', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('screenings')
    op.drop_table('patients')
    op.drop_table('users')
    op.drop_table('phcs')
