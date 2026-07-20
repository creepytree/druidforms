"""Live styleguide: every druids component and token on one page.

Run with ``python -m druids.preview`` (add ``--login`` to exercise the auth
flow with user/password ``druid``/``druid``).
"""

from __future__ import annotations

import os

from fastapi import FastAPI, Request

from druids import FRAMEWORK_VERSION, Druids, LoginSettings

_TEMPLATES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")


def create_app(login: bool = False) -> FastAPI:
    app = FastAPI(title="druids preview")

    druids = Druids(
        "Druids",
        version=FRAMEWORK_VERSION,
        author="bitdruid",
        github_url="https://github.com/bitdruid",
        login=LoginSettings(user="druid", password="druid") if login else None,
        templates_dir=_TEMPLATES,
    )
    druids.install(app)

    @app.get("/")
    async def preview(request: Request):
        return druids.templates.TemplateResponse(request, "preview.jinja2", {})

    @app.get("/api/log")
    async def sample_log():
        """Static sample entries so <druid-log-view> has something to render."""
        return [
            {
                "time": "2026-07-18 09:00:01",
                "level": "DEBUG",
                "source": "app.startup",
                "message": "loading configuration",
            },
            {
                "time": "2026-07-18 09:00:01",
                "level": "INFO",
                "source": "app.startup",
                "message": "druids preview started",
            },
            {
                "time": "2026-07-18 09:04:12",
                "level": "INFO",
                "source": "auth.login",
                "message": "user 'druid' signed in",
            },
            {
                "time": "2026-07-18 09:05:40",
                "level": "WARNING",
                "source": "store.session",
                "message": "session near expiry, sliding window extended",
            },
            {
                "time": "2026-07-18 09:07:02",
                "level": "ERROR",
                "source": "api.fetch",
                "message": "upstream request failed: connection refused",
            },
            {
                "time": "2026-07-18 09:07:02",
                "level": "CRITICAL",
                "source": "api.fetch",
                "message": "giving up after 3 retries",
            },
            {"message": "raw line without the standard format spans the full row"},
        ]

    return app
