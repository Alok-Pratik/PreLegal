"""Tests for the AI chat / Mutual NDA field extraction routes (SCRUM-6).

The LLM call itself is mocked out so these tests don't hit the real API.
"""

from unittest.mock import patch

from models.chat import ChatTurnResult, MutualNdaFields, Party


def _login(client, email="chatuser@example.com"):
    client.post("/api/auth/login", json={"email": email})


def test_greeting_requires_login(client):
    res = client.get("/api/chat/greeting")
    assert res.status_code == 401


def test_greeting_returns_opening_message_and_empty_fields(client):
    _login(client)

    res = client.get("/api/chat/greeting")

    assert res.status_code == 200
    body = res.json()
    assert body["reply"]
    assert body["fields"] == MutualNdaFields().model_dump()


def test_message_requires_login(client):
    res = client.post("/api/chat/message", json={"message": "hi", "history": [], "fields": {}})
    assert res.status_code == 401


def test_message_returns_llm_reply_and_updated_fields(client):
    _login(client)

    fake_result = ChatTurnResult(
        reply="Got it, what's the effective date?",
        fields=MutualNdaFields(
            party1=Party(name="Alice", title="CEO", company="Acme", notice_address="alice@acme.com")
        ),
    )

    with patch("routes.chat.run_chat_turn", return_value=fake_result) as mock_run:
        res = client.post(
            "/api/chat/message",
            json={
                "message": "I'm Alice, CEO of Acme, alice@acme.com",
                "history": [],
                "fields": {},
            },
        )

    assert res.status_code == 200
    body = res.json()
    assert body["reply"] == "Got it, what's the effective date?"
    assert body["fields"]["party1"]["name"] == "Alice"
    mock_run.assert_called_once()


def test_message_returns_clean_error_when_llm_call_fails(client):
    _login(client)

    with patch("routes.chat.run_chat_turn", side_effect=RuntimeError("upstream boom")):
        res = client.post(
            "/api/chat/message",
            json={"message": "hi", "history": [], "fields": {}},
        )

    assert res.status_code == 503
    assert "temporarily unavailable" in res.json()["detail"]
