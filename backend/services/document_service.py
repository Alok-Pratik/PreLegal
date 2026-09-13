"""Business logic for persisting and retrieving documents (SCRUM-8).

A document row is created once the AI decides a document_type (see
routes/chat.py), then updated on every subsequent chat turn. Fields and chat
history are stored as JSON text (see database.Document) and converted to/from
the Pydantic shapes here, at the service boundary.
"""

import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import Document
from models.chat import ChatMessage, DocumentField
from models.documents import DocumentResponse, DocumentSummary


def _to_response(document: Document) -> DocumentResponse:
    return DocumentResponse(
        id=document.id,
        document_type=document.document_type,
        is_complete=document.is_complete,
        created_at=document.created_at,
        updated_at=document.updated_at,
        fields=[DocumentField(**f) for f in json.loads(document.fields_json)],
        messages=[ChatMessage(**m) for m in json.loads(document.history_json)],
    )


class DocumentService:
    """Handles document persistence business logic."""

    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: int) -> list[DocumentSummary]:
        """List a user's documents, most recently updated first."""
        documents = (
            self.db.query(Document).filter(Document.user_id == user_id).order_by(Document.updated_at.desc()).all()
        )
        return [DocumentSummary.model_validate(doc) for doc in documents]

    def get_for_user(self, user_id: int, document_id: int) -> DocumentResponse:
        """Get one of a user's documents. Raises 404 if missing or not owned."""
        document = self._get_owned(user_id, document_id)
        return _to_response(document)

    def save_turn(
        self,
        user_id: int,
        document_id: int | None,
        document_type: str,
        fields: list[DocumentField],
        history: list[ChatMessage],
        is_complete: bool,
    ) -> Document:
        """Create or update the document backing a chat turn.

        Raises 404 if `document_id` is given but doesn't belong to this user.
        """
        fields_json = json.dumps([f.model_dump() for f in fields])
        history_json = json.dumps([m.model_dump() for m in history])

        if document_id is not None:
            document = self._get_owned(user_id, document_id)
            document.document_type = document_type
            document.fields_json = fields_json
            document.history_json = history_json
            document.is_complete = is_complete
        else:
            document = Document(
                user_id=user_id,
                document_type=document_type,
                fields_json=fields_json,
                history_json=history_json,
                is_complete=is_complete,
            )
            self.db.add(document)

        self.db.commit()
        self.db.refresh(document)
        return document

    def _get_owned(self, user_id: int, document_id: int) -> Document:
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document or document.user_id != user_id:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
