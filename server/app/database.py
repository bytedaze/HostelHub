"""MongoDB connection setup."""

import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


# Load the project-level .env file. The fallback keeps the current local setup
# working because its existing environment file is inside server/venv.
project_env = Path(__file__).resolve().parents[1] / ".env"
fallback_env = Path(__file__).resolve().parents[1] / "venv" / ".env"
load_dotenv(project_env if project_env.exists() else fallback_env)

mongo_uri = os.getenv("MONGO_URI")
database_name = os.getenv("DB_NAME")

if not mongo_uri or not database_name:
    raise RuntimeError("MONGO_URI and DB_NAME must be set in the environment")

client = AsyncIOMotorClient(mongo_uri)
db = client[database_name]
