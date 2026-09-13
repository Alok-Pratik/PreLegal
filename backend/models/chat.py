"""Pydantic models for the AI chat / document field extraction flow.

Fields are modeled generically (key/label/value/group) rather than with a
dedicated schema per document type: the 11 templates in catalog.json vary
widely in their variable terms, and only Mutual NDA has a clean, separate
list of cover-page fields to draw a dedicated schema from. The AI decides
which fields a given document type needs, grouping related ones (e.g. two
parties' details) under a shared `group` label for display.
"""

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    """A single turn in the chat history."""

    role: Role
    content: str


class DocumentField(BaseModel):
    """One field of the document being drafted."""

    key: str
    label: str
    value: str = ""
    group: str = ""  # e.g. "Party 1"; "" for an ungrouped, top-level field


class ChatTurnResult(BaseModel):
    """Structured output the LLM returns for each chat turn."""

    reply: str
    document_type: str = ""  # a catalog.json template name, or "" if not yet decided
    fields: list[DocumentField] = Field(default_factory=list)
    is_complete: bool = False


class ChatMessageRequest(BaseModel):
    """Request body for POST /api/chat/message."""

    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    document_type: str = ""
    fields: list[DocumentField] = Field(default_factory=list)
    # Set once a document has been persisted (see routes/chat.py), so later
    # turns update the same row instead of creating a new one; None for a
    # brand-new conversation, or while document_type is still undecided.
    document_id: int | None = None


class ChatMessageResponse(ChatTurnResult):
    """Response body for POST /api/chat/message: the LLM turn result plus
    the id of the document row it was persisted to, if any."""

    document_id: int | None = None


class GreetingResponse(BaseModel):
    """Response body for GET /api/chat/greeting."""

    reply: str
    document_type: str = ""
    fields: list[DocumentField] = Field(default_factory=list)
    is_complete: bool = False
