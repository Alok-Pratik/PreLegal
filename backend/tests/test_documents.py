"""Tests for the persisted-documents routes (SCRUM-8)."""

from unittest.mock import patch

from models.chat import ChatTurnResult, DocumentField


def _login(client, email="docsuser@example.com"):
    client.post("/api/auth/signup", json={"email": email, "password": "correct-horse"})


def _create_document(client) -> int:
    fake_result = ChatTurnResult(
        reply="What's the effective date?",
        document_type="Mutual Non-Disclosure Agreement",
        fields=[DocumentField(key="party1_name", label="Name", group="Party 1", value="Alice")],
        is_complete=False,
    )
    with patch("routes.chat.run_chat_turn", return_value=fake_result):
        res = client.post(
            "/api/chat/message",
            json={"message": "I'm Alice, I need an NDA", "history": [], "document_type": "", "fields": []},
        )
    return res.json()["document_id"]


def test_list_documents_requires_login(client):
    res = client.get("/api/documents")
    assert res.status_code == 401


def test_get_document_requires_login(client):
    res = client.get("/api/documents/1")
    assert res.status_code == 401


def test_list_documents_is_empty_for_new_user(client):
    _login(client)
    res = client.get("/api/documents")
    assert res.status_code == 200
    assert res.json() == []


def test_get_document_returns_404_for_unknown_id(client):
    _login(client)
    res = client.get("/api/documents/999")
    assert res.status_code == 404


def test_get_document_returns_404_for_another_users_document(client):
    _login(client, email="owner@example.com")
    document_id = _create_document(client)

    client.post("/api/auth/logout")
    _login(client, email="intruder@example.com")

    res = client.get(f"/api/documents/{document_id}")
    assert res.status_code == 404


def test_list_documents_only_includes_current_users_documents(client):
    _login(client, email="owner2@example.com")
    document_id = _create_document(client)

    client.post("/api/auth/logout")
    _login(client, email="other@example.com")

    assert client.get("/api/documents").json() == []

    client.post("/api/auth/logout")
    client.post("/api/auth/signin", json={"email": "owner2@example.com", "password": "correct-horse"})

    documents = client.get("/api/documents").json()
    assert [d["id"] for d in documents] == [document_id]
