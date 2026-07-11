"""
Face Search Router — /api/search
Core AI endpoint: upload photo → extract embedding → match against DB
"""

import uuid, shutil, asyncio
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, MissingPersonCase, FoundPersonCase, Alert, AlertType
from schemas import FaceSearchResponse, FaceMatchResult, FoundPersonCreate
from security import get_current_user
from ml_service import face_service
from config import settings

router = APIRouter()


@router.post("/", response_model=FaceSearchResponse)
async def search_face(
    file: UploadFile = File(..., description="Photo of found/unidentified person"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Core face search endpoint:
    1. Accept uploaded photo
    2. Extract 512-dim FaceNet embedding
    3. Compare cosine similarity against all case embeddings in DB
    4. Return ranked matches
    5. Auto-create alert if high-confidence match found
    """

    # ── Validate file ─────────────────────────────────────────────────────────
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WEBP accepted")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")

    # ── Save temp file ────────────────────────────────────────────────────────
    tmp_dir  = Path(settings.UPLOAD_DIR) / "search_temp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"search_{uuid.uuid4().hex[:12]}{Path(file.filename).suffix}"

    with open(tmp_path, "wb") as f:
        f.write(contents)

    try:
        # ── Extract embedding ─────────────────────────────────────────────────
        embedding = await asyncio.get_event_loop().run_in_executor(
            None, face_service.extract_embedding, str(tmp_path)
        )

        if not embedding:
            raise HTTPException(
                status_code=422,
                detail="No face detected in the uploaded image. Please upload a clear, well-lit photo."
            )

        # ── Search database ───────────────────────────────────────────────────
        matches, total_scanned, elapsed_ms = await face_service.search_database(
            query_embedding = embedding,
            db              = db,
            threshold       = settings.FACE_MATCH_THRESHOLD,
        )

        # ── Build response ────────────────────────────────────────────────────
        results = []
        for m in matches:
            case: MissingPersonCase = m["case"]
            results.append(FaceMatchResult(
                case_id            = case.id,
                case_number        = case.case_number,
                full_name          = case.full_name,
                age                = case.age,
                gender             = case.gender,
                last_seen_location = case.last_seen_location,
                date_missing       = case.date_missing,
                status             = case.status,
                similarity         = m["similarity"],
                confidence         = m["confidence"],
                photo_path         = case.photo_path,
            ))

        # ── Auto-alert for high-confidence matches ────────────────────────────
        if results and results[0].similarity >= settings.AUTO_ALERT_THRESHOLD * 100:
            top = results[0]
            alert = Alert(
                type             = AlertType.MATCH,
                message          = (
                    f"High confidence match found for {top.case_number} "
                    f"({top.full_name}) — {top.similarity}% similarity. "
                    f"Review required."
                ),
                similarity_score = top.similarity,
                case_id          = top.case_id,
                user_id          = current_user.id,
            )
            db.add(alert)
            await db.flush()

        return FaceSearchResponse(
            matches       = results,
            total_scanned = total_scanned,
            scan_time_ms  = elapsed_ms,
            model_used    = settings.ML_MODEL,
        )

    finally:
        # Clean up temp file
        if tmp_path.exists():
            tmp_path.unlink()


@router.post("/report-found", status_code=201)
async def report_found_person(
    payload: FoundPersonCreate,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Report a found/unidentified person.
    Saves their details + photo + embedding, and triggers a face search.
    """
    # Save photo
    upload_dir = Path(settings.UPLOAD_DIR) / "found"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path  = upload_dir / f"found_{uuid.uuid4().hex[:8]}.jpg"

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract embedding
    embedding = await asyncio.get_event_loop().run_in_executor(
        None, face_service.extract_embedding, str(file_path)
    )

    # Create found case
    found_case = FoundPersonCase(
        case_number     = f"FP-{uuid.uuid4().hex[:8].upper()}",
        photo_path      = str(file_path),
        face_embedding  = embedding,
        embedding_model = settings.ML_MODEL,
        reported_by     = current_user.id,
        **payload.model_dump(),
    )
    db.add(found_case)
    await db.flush()

    return {
        "message":        "Found person reported. AI matching in progress.",
        "found_case_id":  found_case.id,
        "embedding_status": "extracted" if embedding else "face_not_detected",
    }
