"""Login and logout page routes, built per Druids instance."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from fastapi import APIRouter, Form, Request
from fastapi.responses import RedirectResponse

if TYPE_CHECKING:
    from druids.core import Druids

logger = logging.getLogger("druids.auth")


def build_auth_router(druids: Druids) -> APIRouter:
    router = APIRouter()
    manager = druids.auth
    base_path = druids.base_path

    # Session cookie (no max-age): the browser drops it on close while the
    # server enforces the real sliding idle timeout via the session store.
    cookie_path = f"{base_path}/" if base_path else "/"

    def home_redirect() -> RedirectResponse:
        return RedirectResponse(url=f"{base_path}/", status_code=303)

    def request_token(request: Request) -> str | None:
        return request.cookies.get(manager.cookie_name)

    @router.get("/login")
    async def login_page(request: Request):
        """Render the login form, or bounce home when login is off/already valid."""
        if not manager.enabled or manager.is_token_valid(request_token(request)):
            return home_redirect()

        return druids.templates.TemplateResponse(request, "druids/login.jinja2", {"error": None})

    @router.post("/login")
    async def login_submit(request: Request, username: str = Form(""), password: str = Form("")):
        """Validate credentials and start a session on success."""
        if not manager.enabled:
            return home_redirect()

        if not manager.verify_credentials(username, password):
            logger.warning(f"Failed login attempt for user '{username}'")
            return druids.templates.TemplateResponse(
                request,
                "druids/login.jinja2",
                {"error": "Invalid username or password."},
                status_code=401,
            )

        token = manager.login()
        # Single static user: the session id snippet is more useful than the name.
        logger.info(f"User logged in with session {token[:8]}")
        response = home_redirect()
        response.set_cookie(
            key=manager.cookie_name,
            value=token,
            path=cookie_path,
            httponly=True,
            samesite="lax",
        )
        return response

    @router.get("/logout")
    @router.post("/logout")
    async def logout(request: Request):
        """Destroy the current session and clear the cookie."""
        token = request_token(request)
        if token:
            logger.info(f"Session {token[:8]} logged out")
        manager.logout(token)
        response = RedirectResponse(url=f"{base_path}/login", status_code=303)
        response.delete_cookie(key=manager.cookie_name, path=cookie_path)
        return response

    return router
