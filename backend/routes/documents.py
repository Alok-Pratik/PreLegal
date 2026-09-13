"""Routes for listing and viewing a user's persisted documents (SCRUM-8)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import User, get_db
from models.documents import DocumentResponse, DocumentSummary
from services.document_service import DocumentService

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[DocumentSummary])
async def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List the current user's documents, most recently updated first."""
    return DocumentService(db).list_for_user(current_user.id)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get one of the current user's documents, including its chat history."""
    return DocumentService(db).get_for_user(current_user.id, document_id)
