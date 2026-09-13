"""Tests for the fake V1 login flow (see SCRUM-5: no real authentication yet)."""


def test_me_without_session_is_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_login_creates_user_and_sets_session_cookie(client):
    res = client.post("/api/auth/login", json={"email": "alice@example.com"})

    assert res.status_code == 200
    body = res.json()
    assert body["user"]["email"] == "alice@example.com"
    assert isinstance(body["user"]["id"], int)
    assert "session_user_id" in res.cookies


def test_login_is_idempotent_for_same_email(client):
    first = client.post("/api/auth/login", json={"email": "bob@example.com"}).json()
    second = client.post("/api/auth/login", json={"email": "bob@example.com"}).json()

    assert first["user"]["id"] == second["user"]["id"]


def test_me_returns_current_user_after_login(client):
    client.post("/api/auth/login", json={"email": "carol@example.com"})

    res = client.get("/api/auth/me")

    assert res.status_code == 200
    assert res.json()["email"] == "carol@example.com"


def test_login_rejects_invalid_email(client):
    res = client.post("/api/auth/login", json={"email": "not-an-email"})
    assert res.status_code == 422


def test_logout_clears_session(client):
    client.post("/api/auth/login", json={"email": "dave@example.com"})
    assert client.get("/api/auth/me").status_code == 200

    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    assert client.get("/api/auth/me").status_code == 401
