"""Tests for the AI chat / document field extraction routes (SCRUM-7).

The LLM call itself is mocked out so these tests don't hit the real API.
"""

from unittest.mock import patch

from models.chat import ChatTurnResult, DocumentField


def _login(client, email="chatuser@example.com"):
    client.post("/api/auth/signup", json={"email": email, "password": "correct-horse"})


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


def test_message_persists_document_once_document_type_is_known(client):
    _login(client)

    fake_result = ChatTurnResult(
        reply="Got it, what's the effective date?",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice")],
        is_complete=False,
    )

    with patch("routes.chat.run_chat_turn", return_value=fake_result):
        res = client.post(
            "/api/chat/message",
            json={"message": "I'm Alice, I need an NDA", "history": [], "document_type": "", "fields": []},
        )

    document_id = res.json()["document_id"]
    assert document_id is not None

    list_res = client.get("/api/documents")
    assert list_res.status_code == 200
    assert [d["id"] for d in list_res.json()] == [document_id]

    get_res = client.get(f"/api/documents/{document_id}")
    assert get_res.status_code == 200
    body = get_res.json()
    assert body["document_type"] == "Mutual Non-Disclosure Agreement"
    assert body["fields"] == [
        {"key": "party1_name", "label": "Name", "value": "Alice", "group": "Party 1"}
    ]
    assert body["messages"] == [
        {"role": "user", "content": "I'm Alice, I need an NDA"},
        {"role": "assistant", "content": "Got it, what's the effective date?"},
    ]


def test_message_does_not_persist_before_document_type_is_decided(client):
    _login(client)

    fake_result = ChatTurnResult(reply="What kind of document do you need?", document_type="", fields=[], is_complete=False)

    with patch("routes.chat.run_chat_turn", return_value=fake_result):
        res = client.post(
            "/api/chat/message",
            json={"message": "hi", "history": [], "document_type": "", "fields": []},
        )

    assert res.json()["document_id"] is None
    assert client.get("/api/documents").json() == []


def test_message_updates_same_document_across_turns(client):
    _login(client)

    first_result = ChatTurnResult(
        reply="What's the effective date?",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice")],
        is_complete=False,
    )
    with patch("routes.chat.run_chat_turn", return_value=first_result):
        first_res = client.post(
            "/api/chat/message",
            json={"message": "I'm Alice, I need an NDA", "history": [], "document_type": "", "fields": []},
        )
    document_id = first_res.json()["document_id"]

    second_result = ChatTurnResult(
        reply="Great, your document is ready!",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice")],
        is_complete=True,
    )
    with patch("routes.chat.run_chat_turn", return_value=second_result):
        second_res = client.post(
            "/api/chat/message",
            json={
                "message": "That's everything",
                "history": [{"role": "user", "content": "I'm Alice, I need an NDA"}],
                "document_type": "Mutual Non-Disclosure Agreement",
                "fields": [{"key": "party1_name", "label": "Name", "value": "Alice", "group": "Party 1"}],
                "document_id": document_id,
            },
        )

    assert second_res.json()["document_id"] == document_id

    documents = client.get("/api/documents").json()
    assert len(documents) == 1
    assert documents[0]["id"] == document_id
    assert documents[0]["is_complete"] is True


def test_message_returns_clean_error_when_llm_call_fails(client):
    _login(client)

    with patch("routes.chat.run_chat_turn", side_effect=RuntimeError("upstream boom")):
        res = client.post(
            "/api/chat/message",
            json={"message": "hi", "history": [], "document_type": "", "fields": []},
        )

    assert res.status_code == 503
    assert "temporarily unavailable" in res.json()["detail"]
