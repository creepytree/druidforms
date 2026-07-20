"""In-memory session store with sliding expiry.

Sessions live in a plain dict guarded by a lock; nothing is persisted. A token
stays valid as long as it is used at least once per ``ttl_seconds`` window, so
active users are not forced to re-authenticate mid-session while idle sessions
expire on their own.
"""

from __future__ import annotations

import secrets
import threading
import time


class SessionStore:
    def __init__(self, ttl_seconds: int):
        self._ttl = ttl_seconds
        self._expiry: dict[str, float] = {}
        self._lock = threading.Lock()

    def create(self) -> str:
        """Create a new session and return its opaque token."""
        token = secrets.token_urlsafe(32)
        now = time.monotonic()
        with self._lock:
            self._prune(now)
            self._expiry[token] = now + self._ttl
        return token

    def validate(self, token: str | None) -> bool:
        """Return whether the token is live, refreshing its expiry if so."""
        if not token:
            return False

        now = time.monotonic()
        with self._lock:
            expiry = self._expiry.get(token)
            if expiry is None:
                return False
            if expiry <= now:
                del self._expiry[token]
                return False
            # Sliding window: extend on every successful use.
            self._expiry[token] = now + self._ttl
            return True

    def destroy(self, token: str | None) -> None:
        if not token:
            return
        with self._lock:
            self._expiry.pop(token, None)

    def _prune(self, now: float) -> None:
        """Drop expired tokens. Caller must hold the lock."""
        expired = [token for token, expiry in self._expiry.items() if expiry <= now]
        for token in expired:
            del self._expiry[token]
