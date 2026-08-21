from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.documents import router as documents_router
from backend.app.api.eligibility import router as eligibility_router
from backend.app.api.forms import router as forms_router
from backend.app.api.assistant import router as assistant_router
from backend.app.api.vault import router as vault_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Bilingual Form Assistant API with Document Intelligence, Eligibility Copilot, Form Readiness Kit, and Bilingual Explainer",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Module Routers
app.include_router(documents_router)
app.include_router(eligibility_router)
app.include_router(forms_router)
app.include_router(assistant_router)
app.include_router(vault_router)


@app.get("/health", tags=["System"])
def health_check():
    """System health check and API readiness check."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
