"""
Pydantic Schemas — request/response validation
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ─── ENUMS ────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    POLICE  = "police"
    FAMILY  = "family"
    ADMIN   = "admin"

class CaseStatus(str, Enum):
    ACTIVE   = "active"
    MATCHED  = "matched"
    REUNITED = "reunited"
    CLOSED   = "closed"

class Gender(str, Enum):
    MALE   = "Male"
    FEMALE = "Female"
    OTHER  = "Other"


# ─── AUTH ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email:      EmailStr
    password:   str = Field(min_length=8)
    full_name:  str = Field(min_length=2)
    role:       UserRole = UserRole.FAMILY
    badge_id:   Optional[str] = None
    department: Optional[str] = None
    region:     Optional[str] = None

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         UserRole
    user_id:      str
    full_name:    str

class UserOut(BaseModel):
    id:         str
    email:      str
    full_name:  str
    role:       UserRole
    department: Optional[str]
    region:     Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── MISSING PERSON CASE ──────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    full_name:            str = Field(min_length=2)
    age:                  int = Field(ge=0, le=120)
    gender:               Gender
    nationality:          Optional[str] = None
    id_number:            Optional[str] = None
    date_missing:         date
    last_seen_location:   str
    last_seen_state:      Optional[str] = None
    circumstances:        Optional[str] = None
    height_cm:            Optional[int] = Field(None, ge=30, le=250)
    weight_kg:            Optional[int] = Field(None, ge=1, le=300)
    eye_color:            Optional[str] = None
    hair_color:           Optional[str] = None
    distinguishing_marks: Optional[str] = None
    last_worn_clothing:   Optional[str] = None
    contact_name:         Optional[str] = None
    contact_phone:        Optional[str] = None
    contact_email:        Optional[EmailStr] = None

class CaseUpdate(BaseModel):
    status:             Optional[CaseStatus] = None
    circumstances:      Optional[str] = None
    contact_phone:      Optional[str] = None

class CaseOut(BaseModel):
    id:                   str
    case_number:          str
    full_name:            str
    age:                  int
    gender:               Gender
    date_missing:         date
    last_seen_location:   str
    last_seen_state:      Optional[str]
    status:               CaseStatus
    photo_path:           Optional[str]
    similarity_score:     Optional[float]
    contact_name:         Optional[str]
    contact_phone:        Optional[str]
    created_at:           datetime

    class Config:
        from_attributes = True

class CaseListResponse(BaseModel):
    total:   int
    page:    int
    size:    int
    cases:   List[CaseOut]


# ─── FOUND PERSON ─────────────────────────────────────────────────────────────

class FoundPersonCreate(BaseModel):
    approx_age:     Optional[int] = None
    gender:         Optional[Gender] = None
    found_location: str
    found_date:     date
    found_state:    Optional[str] = None
    condition:      Optional[str] = None
    description:    Optional[str] = None

class FoundPersonOut(BaseModel):
    id:             str
    case_number:    str
    found_location: str
    found_date:     date
    is_identified:  bool
    photo_path:     Optional[str]
    created_at:     datetime

    class Config:
        from_attributes = True


# ─── FACE SEARCH ──────────────────────────────────────────────────────────────

class FaceMatchResult(BaseModel):
    case_id:         str
    case_number:     str
    full_name:       str
    age:             int
    gender:          str
    last_seen_location: str
    date_missing:    date
    status:          CaseStatus
    similarity:      float          # percentage 0-100
    confidence:      str            # High / Medium / Low
    photo_path:      Optional[str]

class FaceSearchResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    matches:         List[FaceMatchResult]
    total_scanned:   int
    scan_time_ms:    float
    model_used:      str
    found_case_id:   Optional[str] = None


# ─── ALERTS ───────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id:               str
    type:             str
    message:          str
    similarity_score: Optional[float]
    is_read:          bool
    is_actioned:      bool
    case_id:          Optional[str]
    created_at:       datetime

    class Config:
        from_attributes = True


# ─── ANALYTICS ────────────────────────────────────────────────────────────────

class RegionStat(BaseModel):
    region:   str
    total:    int
    active:   int
    matched:  int
    reunited: int

class AnalyticsResponse(BaseModel):
    total_cases:        int
    active_cases:       int
    matched_cases:      int
    reunited_cases:     int
    match_rate_percent: float
    avg_resolution_days: float
    cases_today:        int
    by_region:          List[RegionStat]
    by_gender:          dict
    by_age_group:       dict
