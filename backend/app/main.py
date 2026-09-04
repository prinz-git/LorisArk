from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.migrations import (
    ensure_bundling_schema,
    ensure_inventory_schema,
    ensure_superadmin_user,
    ensure_user_role_column,
)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    static_dir = Path(__file__).resolve().parent / "static"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

    @app.get("/", include_in_schema=False)
    def ui() -> FileResponse:
        return FileResponse(static_dir / "index.html")

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.on_event("startup")
    def _create_tables() -> None:
        Base.metadata.create_all(bind=engine)
        ensure_user_role_column(engine)
        ensure_inventory_schema(engine)
        ensure_bundling_schema(engine)
        ensure_superadmin_user(SessionLocal)

    return app


app = create_app()
