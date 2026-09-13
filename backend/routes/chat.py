"""Chat routes for the AI-driven document field extraction flow."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from database import User
from core.dependencies import get_current_user
from models.chat import ChatMessageRequest, ChatTurnResult, GreetingResponse
from services.ai_service import get_greeting, run_chat_turn

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/greeting", response_model=GreetingResponse)
async def greeting(current_user: User = Depends(get_current_user)):
    """Get the opening AI message to start a conversation."""
    return GreetingResponse(reply=get_greeting())


@router.post("/message", response_model=ChatTurnResult)
async def message(request: ChatMessageRequest, current_user: User = Depends(get_current_user)):
    """Send a chat message and get back the AI's reply plus updated document state."""
    try:
        return run_chat_turn(request.history, request.document_type, request.fields, request.message)
    except Exception:
        logger.exception("Chat turn failed")
        raise HTTPException(status_code=503, detail="AI assistant is temporarily unavailable. Please try again.")
