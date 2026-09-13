"""AI chat service for extracting document fields from a conversation.

Uses LiteLLM via OpenRouter, on a free-tier model (no OpenRouter credits
required), per CLAUDE.md's AI design guidance.

Note: OpenRouter's `openrouter/openrouter/free` auto-router was tried first,
but it routes across many different underlying free models and doesn't
reliably honor `response_format` — it can return plain prose instead of the
structured JSON this service depends on. Pinning to a single free model that
declares `structured_outputs` support in OpenRouter's model list avoids that.
This model doesn't support `reasoning_effort`, unlike gpt-oss-120b via
Cerebras, so that parameter is not passed.
"""

import json
import re
from pathlib import Path

from litellm import completion

from models.chat import ChatMessage, ChatTurnResult, DocumentField

MODEL = "openrouter/nvidia/nemotron-3-super-120b-a12b:free"

CATALOG_PATH = Path(__file__).resolve().parent.parent.parent / "catalog.json"
_ALL_TEMPLATES = json.loads(CATALOG_PATH.read_text())["templates"]
# The cover page is a companion piece to the Mutual NDA, not a document a
# user would ask for on its own, so it's excluded from the selectable list.
CATALOG = [t for t in _ALL_TEMPLATES if t["filename"] != "Mutual-NDA-coverpage.md"]
CATALOG_LISTING = "\n".join(f"- {t['name']}: {t['description']}" for t in CATALOG)

SYSTEM_PROMPT = f"""You are a friendly legal assistant helping a user draft a legal \
document through conversation, instead of a form.

You can only generate the following document types:
{CATALOG_LISTING}

Figuring out the document type:
- If the user's request clearly matches one of the document types above, set \
document_type to that document's exact name and start gathering its fields.
- If the user asks for something not in the list (e.g. a document type we \
don't support), do NOT set document_type yet. Explain we can't generate \
that exact document, then suggest whichever document above is the closest \
fit and ask if that would work instead. Only set document_type once the \
user agrees to a document from the list above.
- If the user's request is ambiguous, ask a clarifying question before \
picking a document_type.

Gathering fields, once document_type is set:
- Decide which fields this document type needs (e.g. a Mutual NDA needs \
purpose, effective date, term, governing law, and each party's name, \
title, company, and notice address; a two-party commercial agreement \
typically needs each party's details, an effective date, term/renewal, \
fees/payment terms, and governing law — use your judgment for the \
specific document type).
- Ask the user conversational questions to gather these fields, one or a \
few at a time (don't overwhelm them with a long list at once).
- Group related fields under a short `group` label (e.g. "Party 1", \
"Party 2"); leave `group` as "" for top-level fields that aren't part of \
a party.
- Always return the full, merged set of fields you know so far (carry \
forward anything already known; only change a field if the user gives new \
information for it). Leave a field's value as an empty string until you \
learn it.
- IMPORTANT: as long as document_type is set and any field still has an \
empty value, your reply MUST end by asking about at least one specific \
missing field. Never leave the user without a next question unless the \
document is complete.
- Set is_complete to true only once every field you've defined has a \
non-empty value, and tell the user their document is ready to preview and \
download. Keep replies concise and warm.

Formatting: replies are shown as plain text, not HTML or Markdown. Use \
actual line breaks between items (e.g. in a list of questions or options), \
never HTML tags like <br>."""


def _build_messages(
    history: list[ChatMessage], document_type: str, fields: list[DocumentField], user_message: str
) -> list[dict]:
    fields_json = json.dumps([f.model_dump() for f in fields])
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append(
        {
            "role": "user",
            "content": (
                f"Document type so far: {document_type or '(not yet decided)'}\n"
                f"Fields known so far (JSON): {fields_json}\n\n"
                f"User's new message: {user_message}"
            ),
        }
    )
    return messages


def _merge_fields(previous: list[DocumentField], new: list[DocumentField]) -> list[DocumentField]:
    """Keep a previously known value for any field the LLM returned blank.

    LLMs aren't perfectly consistent about echoing back everything they were
    told to carry forward, so this is a defensive backstop against losing
    already-gathered information on a later turn. Merges by field `key`,
    preferring the new field's label/group (in case the model refines them)
    but never letting a non-empty value be blanked out.
    """
    previous_by_key = {f.key: f for f in previous}
    merged: list[DocumentField] = []
    seen_keys = set()

    for field in new:
        prior = previous_by_key.get(field.key)
        merged.append(
            DocumentField(
                key=field.key,
                label=field.label or (prior.label if prior else ""),
                group=field.group or (prior.group if prior else ""),
                value=field.value or (prior.value if prior else ""),
            )
        )
        seen_keys.add(field.key)

    # Carry forward any previously known field the LLM dropped entirely.
    for field in previous:
        if field.key not in seen_keys:
            merged.append(field)

    return merged


_BR_TAG = re.compile(r"<br\s*/?>", re.IGNORECASE)


def _clean_reply(reply: str) -> str:
    """Replies are rendered as plain text, so strip stray HTML line breaks
    the model sometimes emits despite the prompt instruction against it."""
    return _BR_TAG.sub("\n", reply)


def _ensure_follow_up_question(reply: str, document_type: str, fields: list[DocumentField], is_complete: bool) -> str:
    """Deterministic backstop for the "always ask a follow-up question"
    requirement: prompting the model to do this isn't reliably enough (it
    sometimes trails off, e.g. "...to set up the agreement:" with no actual
    question), so append one naming the first still-empty field if needed.
    """
    if is_complete or not document_type or "?" in reply:
        return reply

    missing = next((f for f in fields if not f.value), None)
    if not missing:
        return reply

    return f"{reply.rstrip()} What is the {missing.label.lower()}?"


def run_chat_turn(
    history: list[ChatMessage],
    document_type: str,
    fields: list[DocumentField],
    user_message: str,
) -> ChatTurnResult:
    """Send the conversation to the LLM and get back a reply plus updated state."""
    messages = _build_messages(history, document_type, fields, user_message)
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=ChatTurnResult,
    )
    result_json = response.choices[0].message.content
    result = ChatTurnResult.model_validate_json(result_json)
    merged_fields = _merge_fields(fields, result.fields)
    merged_document_type = result.document_type or document_type
    # Defensive backstop: never trust the LLM's is_complete on its own, in
    # case it says true while a field is still blank.
    is_complete = result.is_complete and bool(merged_fields) and all(f.value for f in merged_fields)
    reply = _clean_reply(result.reply)
    reply = _ensure_follow_up_question(reply, merged_document_type, merged_fields, is_complete)
    return ChatTurnResult(
        reply=reply,
        document_type=merged_document_type,
        fields=merged_fields,
        is_complete=is_complete,
    )


def get_greeting() -> str:
    """A canned opening message; no LLM call needed to start the conversation."""
    return "Hi! I can help you draft a legal document. What kind of document do you need?"
