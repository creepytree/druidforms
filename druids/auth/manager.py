"""Authentication manager tying credentials, sessions and cookies together.

Instance-based (unlike the per-app singletons it was extracted from): each
:class:`~druids.core.Druids` owns one manager configured from its
``LoginSettings``. It verifies the static credential pair, mints/revokes
sessions, and answers "is this request authenticated?" from a raw cookie
header.
"""

from __future__ import annotations

from http.cookies import SimpleCookie
from secrets import compare_digest

from druids.auth.sessions import SessionStore


class AuthManager:
    def __init__(self, *, enabled: bool, user: str, password: str, ttl_seconds: int, cookie_name: str):
        self.enabled = enabled
        self.cookie_name = cookie_name
        self._user = user
        self._password = password
        self._store = SessionStore(ttl_seconds)

    @property
    def misconfigured(self) -> bool:
        """Login is requested but no usable credentials were provided."""
        return self.enabled and (not self._user or not self._password)

    def verify_credentials(self, user: str, password: str) -> bool:
        """Constant-time check of submitted credentials against the config."""
        if self.misconfigured:
            return False
        # Compare both fields unconditionally to avoid short-circuit timing hints.
        user_ok = compare_digest(user, self._user)
        password_ok = compare_digest(password, self._password)
        return user_ok and password_ok

    def login(self) -> str:
        """Create a session and return its token (cookie value)."""
        return self._store.create()

    def logout(self, token: str | None) -> None:
        self._store.destroy(token)

    def is_token_valid(self, token: str | None) -> bool:
        return self._store.validate(token)

    def token_from_cookie_header(self, cookie_header: str | None) -> str | None:
        """Extract the session token from a raw ``Cookie`` header value."""
        if not cookie_header:
            return None
        jar: SimpleCookie = SimpleCookie()
        try:
            jar.load(cookie_header)
        except Exception:
            return None
        morsel = jar.get(self.cookie_name)
        return morsel.value if morsel else None

    def is_cookie_header_authenticated(self, cookie_header: str | None) -> bool:
        """Convenience for callers that only have a raw cookie header (e.g. Socket.IO handshakes)."""
        return self.is_token_valid(self.token_from_cookie_header(cookie_header))
