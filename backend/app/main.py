import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.exceptions import AppException
from app.core.middleware import logging_middleware, register_middlewares
from app.domain.auth.router import router as auth_router
from app.domain.users.router import router as users_router

from app.domain.strategic_perspective.router import router as strategic_perspective_router
from app.domain.strategic_objective.router import router as strategic_objective_router
from app.domain.strategic_initiative.router import router as initiative_router
from app.domain.key_result.router import router as key_result_router
from app.domain.action_plan_step.router import router as action_plan_step_router
from app.domain.delay_justification.router import router as justification_router
from app.domain.strategic_map.router import router as strategic_map_router
from app.domain.import_spreadsheet.router import router as import_router

logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

TAGS_METADATA = [
    {"name": "Users", "description": "Gerenciamento de usuarios"},
    {"name": "ARPE - Mapa Estratégico", "description": "Gestão da cascata estratégica"},
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger("arpe-map")
    logger.info("ARPE-MAP - API iniciada")

    from app.database.session import async_session_maker
    from seed import seed_admin

    try:
        async with async_session_maker() as session:
            await seed_admin(session)
            await session.commit()
    except Exception as exc:
        logger.error("Erro no seed inicial: %s", exc, exc_info=True)

    yield
    logger.info("ARPE-MAP - API encerrada")


def create_app() -> FastAPI:
    app = FastAPI(
        title="ARPE-MAP - API",
        version="1.0.0",
        debug=settings.app_debug,
        lifespan=lifespan,
        openapi_tags=TAGS_METADATA,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    register_middlewares(app)
    app.middleware("http")(logging_middleware)
    
    app.include_router(auth_router)
    app.include_router(users_router)
    
    app.include_router(strategic_perspective_router)
    app.include_router(strategic_objective_router)
    app.include_router(initiative_router)
    app.include_router(key_result_router)
    app.include_router(action_plan_step_router)
    app.include_router(justification_router)
    app.include_router(strategic_map_router)
    app.include_router(import_router)

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(status_code=exc.code, content={"detail": exc.message})

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "env": settings.app_env}

    return app

app = create_app()