"""Tests for the AI chat / document field extraction routes (SCRUM-7).

The LLM call itself is mocked out so these tests don't hit the real API.
"""

from unittest.mock import patch

from models.chat import ChatTurnResult, DocumentField


def _login(client, email="chatuser@example.com"):
    client.post("/api/auth/login", json={"email": email})


def test_greeting_requires_login(client):
    res = client.get("/api/chat/greeting")
    assert res.status_code == 401


def test_greeting_returns_opening_message_with_no_document_type_yet(client):
    _login(client)

    res = client.get("/api/chat/greeting")

    assert res.status_code == 200
    body = res.json()
    assert body["reply"]
    assert body["document_type"] == ""
    assert body["fields"] == []


def test_message_requires_login(client):
    res = client.post(
        "/api/chat/message",
        json={"message": "hi", "history": [], "document_type": "", "fields": []},
    )
    assert res.status_code == 401


def test_message_returns_llm_reply_and_updated_state(client):
    _login(client)

    fake_result = ChatTurnResult(
        reply="Got it, what's the effective date?",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice")],
        is_complete=False,
    )

    with patch("routes.chat.run_chat_turn", return_value=fake_result) as mock_run:
        res = client.post(
            "/api/chat/message",
            json={
                "message": "I'm Alice, I need an NDA",
                "history": [],
                "document_type": "",
                "fields": [],
            },
        )

    assert res.status_code == 200
    body = res.json()
    assert body["reply"] == "Got it, what's the effective date?"
    assert body["document_type"] == "Mutual Non-Disclosure Agreement"
    assert body["fields"] == [
        {"key": "party1_name", "label": "Name", "value": "Alice", "group": "Party 1"}
    ]
    assert body["is_complete"] is False
    mock_run.assert_called_once()


def test_message_returns_clean_error_when_llm_call_fails(client):
    _login(client)

    with patch("routes.chat.run_chat_turn", side_effect=RuntimeError("upstream boom")):
        res = client.post(
            "/api/chat/message",
            json={"message": "hi", "history": [], "document_type": "", "fields": []},
        )

    assert res.status_code == 503
    assert "temporarily unavailable" in res.json()["detail"]
