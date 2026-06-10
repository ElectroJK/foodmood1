from fastapi import Header, HTTPException
from typing import Optional
from .config import settings


def verify_internal_key(x_internal_key: Optional[str] = Header(None)) -> None:
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal key")
