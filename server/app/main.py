"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.complaint import router as complaint_router
from app.routes.fee import router as fee_router
from app.routes.room import router as room_router
from app.routes.user import router as user_router
from app.routes.visitor import router as visitor_router

app = FastAPI(title="Hostel Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(complaint_router)
app.include_router(fee_router)
app.include_router(room_router)
app.include_router(user_router)
app.include_router(visitor_router)


@app.get("/")
async def health_check() -> dict[str, str]:
    """Confirm that the API is running."""

    return {"status": "Hostel Management System API running"}
