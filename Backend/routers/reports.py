"""Reports Router — /api/reports — Case status updates & reunification"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from database import get_db
from models import User, MissingPersonCase, Alert, AlertType, CaseStatus
from security import require_police

router = APIRouter()


@router.post("/{case_id}/reunite")
async def mark_reunited(
    case_id: str,
    db: AsyncSession   = Depends(get_db),
    current_user: User = Depends(require_police),
):
    """Mark a missing person case as reunited."""
    result = await db.execute(
        select(MissingPersonCase).where(MissingPersonCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status     = CaseStatus.REUNITED
    case.updated_at = datetime.utcnow()

    alert = Alert(
        type    = AlertType.REUNITED,
        message = f"Case {case.case_number} ({case.full_name}) has been marked as Reunited by {current_user.full_name}.",
        case_id = case.id,
    )
    db.add(alert)
    return {"message": "Case marked as reunited", "case_number": case.case_number}


@router.post("/{case_id}/close")
async def close_case(
    case_id: str,
    db: AsyncSession   = Depends(get_db),
    current_user: User = Depends(require_police),
):
    result = await db.execute(
        select(MissingPersonCase).where(MissingPersonCase.id == case_id)
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status     = CaseStatus.CLOSED
    case.updated_at = datetime.utcnow()
    return {"message": "Case closed", "case_number": case.case_number}
