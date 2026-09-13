"""Pydantic models for persisted documents (SCRUM-8)."""

from datetime import datetime

from pydantic import BaseModel, Field

from models.chat import ChatMessage, DocumentField


class DocumentSummary(BaseModel):
    """One row of the "my documents" list: enough to render a card without
    pulling every field/message."""

    id: int
    document_type: str
    is_complete: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(DocumentSummary):
    """A single document's full state, including its chat history so a
    conversation can be resumed."""

    fields: list[DocumentField] = Field(default_factory=list)
    messages: list[ChatMessage] = Field(default_factory=list)
