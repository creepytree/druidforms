"""The Druids app shell: design assets, templates and auth for a FastAPI app.

One instance per app::

    from druids import Druids, LoginSettings

    druids = Druids(
        "Myapp",
        version="1.2.0",
        author="you",
        github_url="https://github.com/you/myapp",
        login=LoginSettings(user="me", password="secret"),
        templates_dir="myapp/templates",
    )
    druids.install(app)

``install`` mounts the framework's static bundle at ``{base_path}/druids``
(``druids.js`` with every <druid-*> element, ``druids.css`` with the tokens),
registers the login/logout routes and the session middleware. App templates
extend ``druids/base.jinja2`` and use the components as plain HTML tags.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version as pkg_version

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from jinja2 import ChoiceLoader, Environment, FileSystemLoader, select_autoescape

from druids.auth.manager import AuthManager
from druids.auth.middleware import AuthMiddleware
from druids.auth.routes import build_auth_router

_PKG_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(_PKG_DIR, "static")
TEMPLATES_DIR = os.path.join(_PKG_DIR, "templates")

try:
    FRAMEWORK_VERSION = pkg_version("druidforms")
except PackageNotFoundError:  # running from a checkout without install
    FRAMEWORK_VERSION = "dev"


@dataclass(frozen=True)
class LoginSettings:
    """Static single-user credentials; sessions expire after ``timeout_minutes`` idle."""

    user: str
    password: str
    timeout_minutes: int = 60


class Druids:
    def __init__(
        self,
        brand: str,
        *,
        slug: str | None = None,
        version: str = "",
        author: str = "",
        github_url: str = "",
        base_path: str = "",
        login: LoginSettings | None = None,
        templates_dir: str | None = None,
    ):
        self.brand = brand
        # slug namespaces the session cookie and the browser's stored accent
        self.slug = slug or "".join(c for c in brand.lower() if c.isalnum()) or "druids"
        self.version = version
        self.author = author
        self.github_url = github_url
        self.base_path = base_path.rstrip("/")

        # Clamp so a non-positive timeout cannot lock everyone out instantly.
        ttl_minutes = max(login.timeout_minutes, 1) if login else 1
        self.auth = AuthManager(
            enabled=login is not None,
            user=login.user if login else "",
            password=login.password if login else "",
            ttl_seconds=ttl_minutes * 60,
            cookie_name=f"{self.slug}_session",
        )

        # App templates first so they can shadow framework ones.
        loaders = []
        if templates_dir:
            loaders.append(FileSystemLoader(templates_dir))
        loaders.append(FileSystemLoader(TEMPLATES_DIR))
        env = Environment(loader=ChoiceLoader(loaders), autoescape=select_autoescape(["html", "jinja2"]))
        env.globals["druids"] = self
        env.globals["base_path"] = self.base_path
        self.templates = Jinja2Templates(env=env)

    @property
    def login_enabled(self) -> bool:
        return self.auth.enabled

    def install(self, app: FastAPI) -> None:
        """Mount static assets, auth routes and session middleware on the app."""
        if self.auth.misconfigured:
            raise ValueError(f"{self.brand}: login enabled but user/password missing")

        # Mounts and routes are app-relative; ``base_path`` only prefixes
        # generated URLs (templates, redirects, cookie path). Apps serving
        # under a proxy prefix strip it in their own middleware, added
        # *after* this so it runs first.
        app.mount("/druids", StaticFiles(directory=STATIC_DIR), name="druids-static")
        if self.auth.enabled:
            app.include_router(build_auth_router(self))
            app.add_middleware(AuthMiddleware, manager=self.auth, base_path=self.base_path)
