"""Tests for ai_service's field-merging safety net (SCRUM-6).

Mocks litellm.completion (the actual external call) so run_chat_turn's own
merge logic is exercised for real.
"""

from unittest.mock import MagicMock, patch

from models.chat import ChatTurnResult, MutualNdaFields, Party
from services.ai_service import run_chat_turn


def _mock_completion_returning(result: ChatTurnResult):
    response = MagicMock()
    response.choices[0].message.content = result.model_dump_json()
    return response


def test_llm_blank_field_does_not_erase_previously_known_value():
    previous_fields = MutualNdaFields(
        purpose="Evaluating a partnership",
        party1=Party(name="Alice", title="CEO", company="Acme", notice_address="alice@acme.com"),
    )
    # The LLM "forgets" purpose and party1.title on this turn, but supplies a new field.
    llm_result = ChatTurnResult(
        reply="What's the effective date?",
        fields=MutualNdaFields(
            purpose="",
            effective_date="Today",
            party1=Party(name="Alice", title="", company="Acme", notice_address="alice@acme.com"),
        ),
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], previous_fields, "It should start today")

    assert result.fields.purpose == "Evaluating a partnership"
    assert result.fields.party1.title == "CEO"
    assert result.fields.effective_date == "Today"


def test_llm_new_value_overrides_previous_value():
    previous_fields = MutualNdaFields(governing_law="Delaware")
    llm_result = ChatTurnResult(reply="Got it.", fields=MutualNdaFields(governing_law="California"))

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], previous_fields, "Actually let's use California law")

    assert result.fields.governing_law == "California"
