"""Tests for real authentication: sign up, sign in, sign out (SCRUM-8)."""


def test_me_without_session_is_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_signup_creates_user_and_sets_session_cookie(client):
    res = client.post("/api/auth/signup", json={"email": "alice@example.com", "password": "correct-horse"})

    assert res.status_code == 200
    body = res.json()
    assert body["user"]["email"] == "alice@example.com"
    assert isinstance(body["user"]["id"], int)
    assert "session_token" in res.cookies


def test_signup_rejects_duplicate_email(client):
    client.post("/api/auth/signup", json={"email": "bob@example.com", "password": "correct-horse"})
    second = client.post("/api/auth/signup", json={"email": "bob@example.com", "password": "another-password"})

    assert second.status_code == 409


def test_signup_rejects_short_password(client):
    res = client.post("/api/auth/signup", json={"email": "short@example.com", "password": "short"})
    assert res.status_code == 422


def test_signup_rejects_password_over_bcrypt_limit(client):
    # bcrypt hard-errors past 72 bytes rather than truncating; this must be a
    # clean validation error, not an unhandled 500.
    res = client.post("/api/auth/signup", json={"email": "long@example.com", "password": "a" * 73})
    assert res.status_code == 422


def test_signin_rejects_password_over_bcrypt_limit(client):
    res = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "a" * 73})
    assert res.status_code == 422


def test_signup_rejects_invalid_email(client):
    res = client.post("/api/auth/signup", json={"email": "not-an-email", "password": "correct-horse"})
    assert res.status_code == 422


def test_me_returns_current_user_after_signup(client):
    client.post("/api/auth/signup", json={"email": "carol@example.com", "password": "correct-horse"})

    res = client.get("/api/auth/me")

    assert res.status_code == 200
    assert res.json()["email"] == "carol@example.com"


def test_signin_with_correct_password_succeeds(client):
    client.post("/api/auth/signup", json={"email": "dave@example.com", "password": "correct-horse"})
    client.post("/api/auth/logout")

    res = client.post("/api/auth/signin", json={"email": "dave@example.com", "password": "correct-horse"})

    assert res.status_code == 200
    assert res.json()["user"]["email"] == "dave@example.com"
    assert "session_token" in res.cookies


def test_signin_with_wrong_password_is_rejected(client):
    client.post("/api/auth/signup", json={"email": "erin@example.com", "password": "correct-horse"})

    res = client.post("/api/auth/signin", json={"email": "erin@example.com", "password": "wrong-password"})

    assert res.status_code == 401


def test_signin_with_unknown_email_is_rejected(client):
    res = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "correct-horse"})
    assert res.status_code == 401


def test_logout_clears_session(client):
    client.post("/api/auth/signup", json={"email": "frank@example.com", "password": "correct-horse"})
    assert client.get("/api/auth/me").status_code == 200

    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    assert client.get("/api/auth/me").status_code == 401
