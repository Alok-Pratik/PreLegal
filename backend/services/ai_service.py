"""AI chat service for extracting Mutual NDA fields from a conversation.

Uses LiteLLM via OpenRouter with Cerebras as the inference provider, per
CLAUDE.md's AI design guidance.
"""

from litellm import completion

from models.chat import ChatMessage, ChatTurnResult, MutualNdaFields, Party

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a friendly legal assistant helping a user draft a \
Mutual Non-Disclosure Agreement (NDA) through conversation, instead of a form.

Ask the user conversational questions to gather these cover page fields, one \
or a few at a time (don't overwhelm them with a long list at once):
- purpose: how the confidential information may be used (default assumption \
if the user doesn't have one in mind: "Evaluating whether to enter into a \
business relationship with the other party.")
- effective_date: when the NDA starts (default to "today" if not specified)
- mnda_term: how long the NDA itself lasts, e.g. "1 year" or "until terminated"
- confidentiality_term: how long confidential info stays protected after \
that, e.g. "1 year" or "in perpetuity"
- governing_law: which state/jurisdiction's law governs the agreement
- jurisdiction: where legal disputes would be handled, e.g. a city and state
- party1 and party2: each needs name, title, company, and notice_address \
(email or postal address). party1 is the user themselves; party2 is the \
other party they're entering the NDA with.

Always return the full, merged set of fields you know so far (carry forward \
anything already known; only change a field if the user gives new \
information for it). Leave a field as an empty string until you learn it.

Once every field above is filled in, tell the user their NDA is ready and \
they can review the preview and download it. Keep replies concise and warm."""


def _build_messages(history: list[ChatMessage], fields: MutualNdaFields, user_message: str) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append(
        {
            "role": "user",
            "content": (
                f"Fields known so far (JSON): {fields.model_dump_json()}\n\n"
                f"User's new message: {user_message}"
            ),
        }
    )
    return messages


def _merge_party(previous: Party, new: Party) -> Party:
    return Party(**{key: getattr(new, key) or getattr(previous, key) for key in Party.model_fields})


def _merge_fields(previous: MutualNdaFields, new: MutualNdaFields) -> MutualNdaFields:
    """Keep a previously known value for any field the LLM returned blank.

    LLMs aren't perfectly consistent about echoing back everything they were
    told to carry forward, so this is a defensive backstop against losing
    already-gathered information on a later turn.
    """
    scalar_fields = {
        key: getattr(new, key) or getattr(previous, key)
        for key in MutualNdaFields.model_fields
        if key not in ("party1", "party2")
    }
    return MutualNdaFields(
        **scalar_fields,
        party1=_merge_party(previous.party1, new.party1),
        party2=_merge_party(previous.party2, new.party2),
    )


def run_chat_turn(history: list[ChatMessage], fields: MutualNdaFields, user_message: str) -> ChatTurnResult:
    """Send the conversation to the LLM and get back a reply plus updated fields."""
    messages = _build_messages(history, fields, user_message)
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=ChatTurnResult,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    result_json = response.choices[0].message.content
    result = ChatTurnResult.model_validate_json(result_json)
    return ChatTurnResult(reply=result.reply, fields=_merge_fields(fields, result.fields))


def get_greeting() -> str:
    """A canned opening message; no LLM call needed to start the conversation."""
    return (
        "Hi! I'll help you put together a Mutual NDA. "
        "To start, who are the two parties entering into this agreement?"
    )
