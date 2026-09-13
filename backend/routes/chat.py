"""Chat routes for the AI-driven document field extraction flow."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import User, get_db
from core.dependencies import get_current_user
from models.chat import ChatMessage, ChatMessageRequest, ChatMessageResponse, GreetingResponse
from services.ai_service import get_greeting, run_chat_turn
from services.document_service import DocumentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/greeting", response_model=GreetingResponse)
async def greeting(current_user: User = Depends(get_current_user)):
    """Get the opening AI message to start a new conversation."""
    return GreetingResponse(reply=get_greeting())


@router.post("/message", response_model=ChatMessageResponse)
async def message(
    request: ChatMessageRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Send a chat message and get back the AI's reply plus updated document state.

    Once the AI has decided a document_type, the turn is persisted so it
    shows up in the user's document list and can be resumed later.
    """
    try:
        result = run_chat_turn(request.history, request.document_type, request.fields, request.message)
    except Exception:
        logger.exception("Chat turn failed")
        raise HTTPException(status_code=503, detail="AI assistant is temporarily unavailable. Please try again.")

    document_id = request.document_id
    if result.document_type:
        history = request.history + [
            ChatMessage(role="user", content=request.message),
            ChatMessage(role="assistant", content=result.reply),
        ]
        document = DocumentService(db).save_turn(
            user_id=current_user.id,
            document_id=document_id,
            document_type=result.document_type,
            fields=result.fields,
            history=history,
            is_complete=result.is_complete,
        )
        document_id = document.id

    return ChatMessageResponse(**result.model_dump(), document_id=document_id)
