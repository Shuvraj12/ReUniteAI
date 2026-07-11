"""Alerts Router — /api/alerts"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from database import get_db
from models import User, Alert
from schemas import AlertOut
from security import get_current_user, require_police

router = APIRouter()


@router.get("/", response_model=list[AlertOut])
async def get_alerts(
    unread_only: bool = Query(False),
    limit: int        = Query(50, le=200),
    db: AsyncSession  = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Alert).order_by(Alert.created_at.desc()).limit(limit)
    if unread_only:
        query = query.where(Alert.is_read == False)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{alert_id}/read")
async def mark_read(
    alert_id: str,
    db: AsyncSession   = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(Alert).where(Alert.id == alert_id).values(is_read=True)
    )
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(
    db: AsyncSession   = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(update(Alert).values(is_read=True))
    return {"message": "All alerts marked as read"}
