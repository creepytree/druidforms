"""Optional static single-user login shared by druids apps."""

from druids.auth.manager import AuthManager
from druids.auth.middleware import AuthMiddleware
from druids.auth.routes import build_auth_router
from druids.auth.sessions import SessionStore

__all__ = ["AuthManager", "AuthMiddleware", "SessionStore", "build_auth_router"]
