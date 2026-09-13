"""Password hashing and signed session tokens for real authentication (SCRUM-8).

Session tokens are signed (not just a raw user id, unlike the SCRUM-5 fake
login flow) so a client can't forge or tamper with the cookie. The signing
key is generated fresh at process start rather than read from an env var:
the database itself is recreated from scratch on every container start (see
CLAUDE.md), so there is no expectation that a session survives a restart
either, and this avoids requiring a new secret to be configured.
"""

import secrets

import bcrypt
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

_SECRET_KEY = secrets.token_hex(32)
_SESSION_SALT = "prelegal-session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 days

_serializer = URLSafeTimedSerializer(_SECRET_KEY, salt=_SESSION_SALT)


def hash_password(password: str) -> str:
    """Hash a plaintext password for storage."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a stored hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_session_token(user_id: int) -> str:
    """Create a signed, tamper-proof session token for a user id."""
    return _serializer.dumps(user_id)


def read_session_token(token: str) -> int | None:
    """Return the user id encoded in a session token, or None if the token
    is missing, expired, or has been tampered with."""
    try:
        return _serializer.loads(token, max_age=SESSION_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None
