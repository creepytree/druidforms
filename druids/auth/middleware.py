"""ASGI middleware enforcing the session cookie on protected routes.

When login is disabled it is a transparent pass-through. Unauthenticated API
requests get a machine-readable 401; browsers are redirected to the login
page. If the host app strips a public base path in its own middleware, add
druids *inside* that so it only ever sees app-relative paths.
"""

from __future__ import annotations

from druids.auth.manager import AuthManager

# App-relative paths reachable without a session.
_PUBLIC_PREFIXES = ("/static/", "/druids/")
_PUBLIC_PATHS = {"/login", "/logout", "/favicon.ico"}


class AuthMiddleware:
    def __init__(self, app, manager: AuthManager, base_path: str = ""):
        self.app = app
        self._manager = manager
        self._login_url = f"{base_path}/login"

    async def __call__(self, scope, receive, send):
        if not self._manager.enabled or scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if self._is_public(path) or self._is_authenticated(scope):
            await self.app(scope, receive, send)
            return

        await self._reject(scope, receive, send, path)

    def _is_public(self, path: str) -> bool:
        return path in _PUBLIC_PATHS or path.startswith(_PUBLIC_PREFIXES)

    def _is_authenticated(self, scope) -> bool:
        cookie_header = self._header(scope, b"cookie")
        return self._manager.is_cookie_header_authenticated(cookie_header)

    async def _reject(self, scope, receive, send, path: str) -> None:
        if path.startswith("/api"):
            await self._send_plain(send, 401, b'{"detail":"Authentication required"}', b"application/json")
            return

        await send(
            {
                "type": "http.response.start",
                "status": 303,
                "headers": [(b"location", self._login_url.encode("latin-1"))],
            }
        )
        await send({"type": "http.response.body", "body": b""})

    @staticmethod
    async def _send_plain(send, status: int, body: bytes, content_type: bytes) -> None:
        await send(
            {
                "type": "http.response.start",
                "status": status,
                "headers": [
                    (b"content-type", content_type),
                    (b"content-length", str(len(body)).encode("latin-1")),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})

    @staticmethod
    def _header(scope, name: bytes) -> str | None:
        for key, value in scope.get("headers", []):
            if key == name:
                return value.decode("latin-1")
        return None
