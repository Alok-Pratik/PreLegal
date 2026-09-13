"""Pydantic models for the AI chat / Mutual NDA field extraction flow."""

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    """A single turn in the chat history."""

    role: Role
    content: str


class Party(BaseModel):
    """One party's details on the NDA cover page."""

    name: str = ""
    title: str = ""
    company: str = ""
    notice_address: str = ""
    date: str = ""


class MutualNdaFields(BaseModel):
    """Mutual NDA cover page fields the AI extracts from the conversation."""

    purpose: str = ""
    effective_date: str = ""
    mnda_term: str = ""
    confidentiality_term: str = ""
    governing_law: str = ""
    jurisdiction: str = ""
    party1: Party = Field(default_factory=Party)
    party2: Party = Field(default_factory=Party)


class ChatTurnResult(BaseModel):
    """Structured output the LLM returns for each chat turn."""

    reply: str
    fields: MutualNdaFields


class ChatMessageRequest(BaseModel):
    """Request body for POST /api/chat/message."""

    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    fields: MutualNdaFields = Field(default_factory=MutualNdaFields)


class GreetingResponse(BaseModel):
    """Response body for GET /api/chat/greeting."""

    reply: str
    fields: MutualNdaFields
