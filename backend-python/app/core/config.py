import os
from pathlib import Path
from dotenv import load_dotenv

# Find `.env` file in workspace
env_path = None
cwd = Path.cwd()
candidates = [
    cwd / ".env",
    cwd.parent / ".env",
    cwd.parent.parent / ".env",
]

for candidate in candidates:
    if candidate.exists():
        env_path = candidate
        break

if env_path:
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "IPD Legal Document Classification API")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./deberta-v2-xlarge/deberta-v2-xlarge")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()
