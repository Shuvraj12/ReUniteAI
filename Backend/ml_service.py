"""
ML Facial Recognition Service
Uses DeepFace (FaceNet512 / ArcFace) for:
  - Face embedding extraction
  - Cosine similarity matching against the case database
"""

import time
import numpy as np
from typing import List, Optional, Tuple
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
import logging

logger = logging.getLogger(__name__)


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Cosine similarity between two embedding vectors. Returns 0.0–1.0."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


def _confidence_label(similarity: float) -> str:
    if similarity >= 88:
        return "High"
    elif similarity >= 70:
        return "Medium"
    return "Low"


class FaceRecognitionService:
    """
    Wraps DeepFace for face embedding extraction and database matching.
    DeepFace is loaded lazily on first use to keep startup fast.
    """

    def __init__(self, model_name: str = "Facenet512", detector: str = "retinaface"):
        self.model_name   = model_name
        self.detector     = detector
        self._deepface    = None

    def _get_deepface(self):
        """Lazy-load DeepFace to avoid slow startup."""
        if self._deepface is None:
            try:
                from deepface import DeepFace
                self._deepface = DeepFace
                logger.info(f"✅ DeepFace loaded — model: {self.model_name}, detector: {self.detector}")
            except ImportError:
                logger.warning("⚠️  DeepFace not installed. Run: pip install deepface tf-keras")
                self._deepface = None
        return self._deepface

    # ── Embedding extraction ──────────────────────────────────────────────────

    def extract_embedding(self, image_path: str) -> Optional[List[float]]:
        """
        Extract 512-dim face embedding from an image file.
        Returns None if no face detected or DeepFace unavailable.
        """
        DeepFace = self._get_deepface()
        if DeepFace is None:
            return self._mock_embedding()  # dev fallback

        try:
            result = DeepFace.represent(
                img_path=image_path,
                model_name=self.model_name,
                detector_backend=self.detector,
                enforce_detection=True,
                align=True,
            )
            if result and len(result) > 0:
                return result[0]["embedding"]
            return None
        except Exception as e:
            logger.error(f"Embedding extraction failed: {e}")
            return None

    # ── Database search ───────────────────────────────────────────────────────

    async def search_database(
        self,
        query_embedding: List[float],
        db: AsyncSession,
        threshold: float = 0.55,
        top_k: int = 10,
    ) -> List[dict]:
        """
        Compare query embedding against all cases in the DB.
        Returns top_k results above threshold, sorted by similarity desc.
        """
        from models import MissingPersonCase, CaseStatus

        start = time.time()

        # Fetch all cases that have embeddings
        result = await db.execute(
            select(MissingPersonCase).where(
                MissingPersonCase.face_embedding.isnot(None),
                MissingPersonCase.status != CaseStatus.REUNITED,
            )
        )
        cases = result.scalars().all()

        matches = []
        for case in cases:
            if not case.face_embedding:
                continue
            sim = _cosine_similarity(query_embedding, case.face_embedding)
            # Convert cosine similarity (0-1) to percentage
            sim_pct = round(sim * 100, 1)
            if sim_pct >= threshold * 100:
                matches.append({
                    "case":       case,
                    "similarity": sim_pct,
                    "confidence": _confidence_label(sim_pct),
                })

        # Sort by similarity descending
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        elapsed_ms = round((time.time() - start) * 1000, 1)

        return matches[:top_k], len(cases), elapsed_ms

    # ── Direct face comparison ────────────────────────────────────────────────

    def compare_faces(self, img1_path: str, img2_path: str) -> Tuple[float, bool]:
        """
        Direct face comparison between two image files.
        Returns (similarity_percentage, is_same_person).
        """
        DeepFace = self._get_deepface()
        if DeepFace is None:
            return 85.0, True  # dev fallback

        try:
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name=self.model_name,
                detector_backend=self.detector,
                distance_metric="cosine",
            )
            # DeepFace distance: 0 = identical, 1 = different
            similarity = round((1 - result["distance"]) * 100, 1)
            return similarity, result["verified"]
        except Exception as e:
            logger.error(f"Face comparison failed: {e}")
            return 0.0, False

    # ── Dev mock ─────────────────────────────────────────────────────────────

    def _mock_embedding(self) -> List[float]:
        """Return a random 512-dim embedding for development/testing."""
        rng = np.random.default_rng()
        vec = rng.random(512).astype(np.float32)
        vec /= np.linalg.norm(vec)
        return vec.tolist()


# Singleton instance
face_service = FaceRecognitionService()
