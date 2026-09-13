"""Tests for ai_service's catalog loading and field-merging safety net (SCRUM-7).

Mocks litellm.completion (the actual external call) so run_chat_turn's own
merge logic is exercised for real.
"""

import json
from unittest.mock import MagicMock, patch

from models.chat import ChatTurnResult, DocumentField
from services.ai_service import CATALOG, CATALOG_LISTING, SYSTEM_PROMPT, _clean_reply, run_chat_turn


def _mock_completion_returning(result: ChatTurnResult):
    response = MagicMock()
    response.choices[0].message.content = result.model_dump_json()
    return response


def test_catalog_loaded_from_catalog_json():
    names = {t["name"] for t in CATALOG}
    assert "Mutual Non-Disclosure Agreement" in names
    assert "Business Associate Agreement" in names
    assert len(CATALOG) == 11


def test_catalog_listing_is_in_the_system_prompt():
    for template in CATALOG:
        assert template["name"] in CATALOG_LISTING
    assert CATALOG_LISTING in SYSTEM_PROMPT


def test_llm_blank_field_does_not_erase_previously_known_value():
    previous_fields = [
        DocumentField(key="purpose", label="Purpose", value="Evaluating a partnership"),
        DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice"),
    ]
    # The LLM "forgets" purpose on this turn, but supplies a new field.
    llm_result = ChatTurnResult(
        reply="What's the effective date?",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[
            DocumentField(key="purpose", label="Purpose", value=""),
            DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice"),
            DocumentField(key="effective_date", label="Effective Date", value="Today"),
        ],
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Mutual Non-Disclosure Agreement", previous_fields, "It starts today")

    by_key = {f.key: f for f in result.fields}
    assert by_key["purpose"].value == "Evaluating a partnership"
    assert by_key["effective_date"].value == "Today"


def test_llm_dropping_a_field_entirely_carries_it_forward():
    previous_fields = [DocumentField(key="governing_law", label="Governing Law", value="Delaware")]
    llm_result = ChatTurnResult(reply="Got it.", document_type="Mutual Non-Disclosure Agreement", fields=[])

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Mutual Non-Disclosure Agreement", previous_fields, "ok")

    assert len(result.fields) == 1
    assert result.fields[0].value == "Delaware"


def test_llm_new_value_overrides_previous_value():
    previous_fields = [DocumentField(key="governing_law", label="Governing Law", value="Delaware")]
    llm_result = ChatTurnResult(
        reply="Got it.",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="governing_law", label="Governing Law", value="California")],
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Mutual Non-Disclosure Agreement", previous_fields, "Actually California")

    assert result.fields[0].value == "California"


def test_document_type_carries_forward_when_llm_leaves_it_blank():
    llm_result = ChatTurnResult(reply="What's next?", document_type="", fields=[])

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Mutual Non-Disclosure Agreement", [], "ok")

    assert result.document_type == "Mutual Non-Disclosure Agreement"


def test_is_complete_is_forced_false_if_a_field_is_still_blank():
    llm_result = ChatTurnResult(
        reply="All set!",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[
            DocumentField(key="purpose", label="Purpose", value="Evaluating a deal"),
            DocumentField(key="governing_law", label="Governing Law", value=""),
        ],
        is_complete=True,
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Mutual Non-Disclosure Agreement", [], "ok")

    assert result.is_complete is False


def test_is_complete_is_forced_false_if_there_are_no_fields_yet():
    llm_result = ChatTurnResult(
        reply="What document do you need?", document_type="", fields=[], is_complete=True
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "", [], "hi")

    assert result.is_complete is False


def test_is_complete_is_true_when_llm_says_so_and_all_fields_are_filled():
    llm_result = ChatTurnResult(
        reply="All set!",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="purpose", label="Purpose", value="Evaluating a deal")],
        is_complete=True,
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Mutual Non-Disclosure Agreement", [], "ok")

    assert result.is_complete is True


def test_clean_reply_strips_html_br_tags():
    assert _clean_reply("Line one<br>Line two<br/>Line three<br />end") == (
        "Line one\nLine two\nLine three\nend"
    )


def test_reply_html_br_tags_are_stripped_end_to_end():
    llm_result = ChatTurnResult(reply="Option A<br>Option B", document_type="", fields=[])

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "", [], "what can you make?")

    assert result.reply == "Option A\nOption B"


def test_follow_up_question_is_appended_when_llm_trails_off_without_asking():
    llm_result = ChatTurnResult(
        reply="Great choice! Let's start gathering the details.",
        document_type="Pilot Agreement",
        fields=[
            DocumentField(key="effective_date", label="Effective Date", value=""),
            DocumentField(key="product", label="Product/Service", value=""),
        ],
        is_complete=False,
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "", [], "Let's do a Pilot Agreement")

    assert result.reply.endswith("What is the effective date?")


def test_follow_up_question_is_not_appended_when_llm_already_asked_one():
    llm_result = ChatTurnResult(
        reply="What's the effective date?",
        document_type="Pilot Agreement",
        fields=[DocumentField(key="effective_date", label="Effective Date", value="")],
        is_complete=False,
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Pilot Agreement", [], "ok")

    assert result.reply == "What's the effective date?"


def test_follow_up_question_is_not_appended_when_document_type_still_undecided():
    llm_result = ChatTurnResult(
        reply="Let me look into what I can offer.", document_type="", fields=[], is_complete=False
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "", [], "I need something unusual")

    assert result.reply == "Let me look into what I can offer."


def test_follow_up_question_is_not_appended_when_document_is_complete():
    llm_result = ChatTurnResult(
        reply="All set, ready to download!",
        document_type="Pilot Agreement",
        fields=[DocumentField(key="effective_date", label="Effective Date", value="Today")],
        is_complete=True,
    )

    with patch("services.ai_service.completion", return_value=_mock_completion_returning(llm_result)):
        result = run_chat_turn([], "Pilot Agreement", [], "ok")

    assert result.reply == "All set, ready to download!"
