import os
from typing import Dict, Optional

import httpx
import jwt
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Ecom API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

SERVICE_MAP: Dict[str, str] = {
    "auth": os.getenv("USER_SERVICE_URL", "http://user-service:8000"),
    "users": os.getenv("USER_SERVICE_URL", "http://user-service:8000"),
    "products": os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8001"),
    "categories": os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8001"),
    "cart": os.getenv("CART_SERVICE_URL", "http://cart-service:8002"),
    "orders": os.getenv("ORDER_SERVICE_URL", "http://order-service:8003"),
    "payment": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004"),
    "shipping": os.getenv("SHIPPING_SERVICE_URL", "http://shipping-service:8005"),
    "recommend": os.getenv("AI_SERVICE_URL", "http://ai-service:8006"),
    "chatbot": os.getenv("AI_SERVICE_URL", "http://ai-service:8006"),
}

ROLE_RULES = {
    "admin": {"*"},
    "staff": {"products", "categories", "orders", "payment", "shipping", "users"},
    "customer": {"products", "categories", "cart", "orders", "payment", "shipping", "recommend", "chatbot"},
}


def get_token_payload(token: str) -> Dict:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


def is_public(method: str, prefix: str, path: str) -> bool:
    if prefix in {"products", "categories"} and method == "GET":
        return True
    if prefix == "auth" and path in {"register", "login"} and method == "POST":
        return True
    return False


def check_rbac(role: str, prefix: str) -> bool:
    allowed = ROLE_RULES.get(role, set())
    return "*" in allowed or prefix in allowed


async def proxy_request(request: Request, target_base_url: str, downstream_path: str):
    query = str(request.url.query)
    upstream_url = f"{target_base_url}/{downstream_path}"
    if query:
        upstream_url = f"{upstream_url}?{query}"

    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host", "content-length"}}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.request(request.method, upstream_url, content=body, headers=headers)

    if not response.content:
        return JSONResponse(status_code=response.status_code, content={})

    try:
        payload = response.json()
    except ValueError:
        payload = {"detail": response.text}

    return JSONResponse(status_code=response.status_code, content=payload)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def route_request(full_path: str, request: Request):
    segments = [seg for seg in full_path.split("/") if seg]
    if not segments:
        raise HTTPException(status_code=404, detail="No route")

    prefix = segments[0]
    downstream_path = full_path.lstrip("/")
    service_url: Optional[str] = SERVICE_MAP.get(prefix)
    if not service_url:
        raise HTTPException(status_code=404, detail="Service not found")

    current_path = segments[1] if len(segments) > 1 else ""
    if not is_public(request.method, prefix, current_path):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Bearer token")
        token = auth_header.split(" ", 1)[1]
        payload = get_token_payload(token)
        role = payload.get("role", "customer")
        if not check_rbac(role, prefix):
            raise HTTPException(status_code=403, detail="Forbidden")

    return await proxy_request(request, service_url, downstream_path)
