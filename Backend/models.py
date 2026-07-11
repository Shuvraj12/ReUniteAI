"""
Database Models — SQLAlchemy ORM
"""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime,
    Text, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum

from database import Base


def gen_uuid():
    return str(uuid.uuid4())


# ─── ENUMS ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    POLICE    = "police"
    FAMILY    = "family"
    ADMIN     = "admin"

class CaseStatus(str, enum.Enum):
    ACTIVE    = "active"
    MATCHED   = "matched"
    REUNITED  = "reunited"
    CLOSED    = "closed"

class Gender(str, enum.Enum):
    MALE      = "Male"
    FEMALE    = "Female"
    OTHER     = "Other"

class AlertType(str, enum.Enum):
    MATCH     = "match"
    NEW_CASE  = "new_case"
    REUNITED  = "reunited"
    SYSTEM    = "system"


# ─── USER ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name     = Column(String(255), nullable=False)
    role          = Column(SAEnum(UserRole), nullable=False, default=UserRole.FAMILY)
    badge_id      = Column(String(100), nullable=True)       # police badge
    department    = Column(String(255), nullable=True)
    region        = Column(String(255), nullable=True)
    is_active     = Column(Boolean, default=True)
    is_verified   = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
    last_login    = Column(DateTime, nullable=True)

    cases         = relationship("MissingPersonCase", back_populates="reported_by_user")
    alerts        = relationship("Alert", back_populates="user")


# ─── MISSING PERSON CASE ──────────────────────────────────────────────────────

class MissingPersonCase(Base):
    __tablename__ = "missing_person_cases"

    id                = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    case_number       = Column(String(50), unique=True, nullable=False, index=True)

    # Personal details
    full_name         = Column(String(255), nullable=False, index=True)
    age               = Column(Integer, nullable=False)
    gender            = Column(SAEnum(Gender), nullable=False)
    nationality       = Column(String(100), nullable=True)
    id_number         = Column(String(100), nullable=True)    # Aadhaar / passport

    # Disappearance details
    date_missing      = Column(Date, nullable=False)
    last_seen_location = Column(String(500), nullable=False)
    last_seen_state   = Column(String(100), nullable=True)
    circumstances     = Column(Text, nullable=True)

    # Physical description
    height_cm         = Column(Integer, nullable=True)
    weight_kg         = Column(Integer, nullable=True)
    eye_color         = Column(String(50), nullable=True)
    hair_color        = Column(String(50), nullable=True)
    distinguishing_marks = Column(Text, nullable=True)
    last_worn_clothing = Column(Text, nullable=True)

    # Photo & AI
    photo_path        = Column(String(500), nullable=True)
    face_embedding    = Column(JSON, nullable=True)           # stored as list of floats
    embedding_model   = Column(String(100), nullable=True)

    # Status
    status            = Column(SAEnum(CaseStatus), default=CaseStatus.ACTIVE, index=True)
    matched_case_id   = Column(UUID(as_uuid=False), ForeignKey("found_person_cases.id"), nullable=True)
    similarity_score  = Column(Float, nullable=True)

    # Reporter
    reported_by       = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    contact_name      = Column(String(255), nullable=True)
    contact_phone     = Column(String(50), nullable=True)
    contact_email     = Column(String(255), nullable=True)

    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reported_by_user  = relationship("User", back_populates="cases")
    matched_found     = relationship("FoundPersonCase", back_populates="matched_missing")
    alerts            = relationship("Alert", back_populates="case")


# ─── FOUND PERSON CASE ────────────────────────────────────────────────────────

class FoundPersonCase(Base):
    __tablename__ = "found_person_cases"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    case_number     = Column(String(50), unique=True, nullable=False, index=True)

    # Found person details
    approx_age      = Column(Integer, nullable=True)
    gender          = Column(SAEnum(Gender), nullable=True)
    found_location  = Column(String(500), nullable=False)
    found_date      = Column(Date, nullable=False)
    found_state     = Column(String(100), nullable=True)
    condition       = Column(String(255), nullable=True)
    description     = Column(Text, nullable=True)

    # Photo & AI
    photo_path      = Column(String(500), nullable=True)
    face_embedding  = Column(JSON, nullable=True)
    embedding_model = Column(String(100), nullable=True)

    # Match result
    is_identified   = Column(Boolean, default=False)
    reported_by     = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    matched_missing = relationship("MissingPersonCase", back_populates="matched_found")


# ─── ALERT ────────────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    type            = Column(SAEnum(AlertType), nullable=False)
    message         = Column(Text, nullable=False)
    similarity_score = Column(Float, nullable=True)
    is_read         = Column(Boolean, default=False)
    is_actioned     = Column(Boolean, default=False)

    user_id         = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    case_id         = Column(UUID(as_uuid=False), ForeignKey("missing_person_cases.id"), nullable=True)
    found_case_id   = Column(UUID(as_uuid=False), ForeignKey("found_person_cases.id"), nullable=True)

    created_at      = Column(DateTime, default=datetime.utcnow)

    user            = relationship("User", back_populates="alerts")
    case            = relationship("MissingPersonCase", back_populates="alerts")
