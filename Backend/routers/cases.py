"""
Cases Router — /api/cases
CRUD for missing person cases + photo upload with face embedding
"""

import uuid, os, shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from database import get_db
from models import User, MissingPersonCase, CaseStatus
from schemas import CaseCreate, CaseUpdate, CaseOut, CaseListResponse
from security import get_current_user, require_police
from ml_service import face_service
from config import settings

router = APIRouter()


def generate_case_number() -> str:
    from datetime import date
    year = date.today().year
    rand = str(uuid.uuid4().int)[:4].zfill(4)
    return f"MP-{year}-{rand}"


@router.post("/", response_model=CaseOut, status_code=201)
async def create_case(
    payload: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = MissingPersonCase(
        case_number         = generate_case_number(),
        reported_by         = current_user.id,
        **payload.model_dump(),
    )
    db.add(case)
    await db.flush()
    await db.refresh(case)
    return case


@router.get("/", response_model=CaseListResponse)
async def list_cases(
    page:    int   = Query(1, ge=1),
    size:    int   = Query(20, ge=1, le=100),
    status:  str   = Query(None),
    region:  str   = Query(None),
    search:  str   = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(MissingPersonCase)

    if status:
        query = query.where(MissingPersonCase.status == status)
    if region:
        query = query.where(MissingPersonCase.last_seen_state.ilike(f"%{region}%"))
    if search:
        query = query.where(
            or_(
                MissingPersonCase.full_name.ilike(f"%{search}%"),
                MissingPersonCase.case_number.ilike(f"%{search}%"),
                MissingPersonCase.last_seen_location.ilike(f"%{search}%"),
            )
        )

    # Total count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar()

    # Paginate
    query = query.order_by(MissingPersonCase.created_at.desc())
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    cases = result.scalars().all()

    return CaseListResponse(total=total, page=page, size=size, cases=cases)


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MissingPersonCase).where(MissingPersonCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=CaseOut)
async def update_case(
    case_id: str,
    payload: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_police),
):
    result = await db.execute(
        select(MissingPersonCase).where(MissingPersonCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    case.updated_at = datetime.utcnow()
    return case


@router.post("/{case_id}/photo")
async def upload_case_photo(
    case_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a photo for a case. Triggers face embedding extraction."""
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WEBP images accepted")

    result = await db.execute(
        select(MissingPersonCase).where(MissingPersonCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Save file
    upload_dir = Path(settings.UPLOAD_DIR) / "cases" / case_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"photo_{uuid.uuid4().hex[:8]}{Path(file.filename).suffix}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract face embedding (runs in thread pool to avoid blocking)
    import asyncio
    embedding = await asyncio.get_event_loop().run_in_executor(
        None, face_service.extract_embedding, str(file_path)
    )

    case.photo_path      = str(file_path)
    case.face_embedding  = embedding
    case.embedding_model = settings.ML_MODEL
    case.updated_at      = datetime.utcnow()

    return {
        "message":          "Photo uploaded successfully",
        "photo_path":       str(file_path),
        "embedding_status": "extracted" if embedding else "face_not_detected",
    }


@router.delete("/{case_id}", status_code=204)
async def delete_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_police),
):
    result = await db.execute(
        select(MissingPersonCase).where(MissingPersonCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    await db.delete(case)
