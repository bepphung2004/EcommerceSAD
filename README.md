# Ecom Final - Microservices (Django REST + React/Vite)

He thong thuong mai dien tu da nganh duoc xay dung theo kien truc microservices:

- user-service (Django REST)
- product-service (Django REST)
- cart-service (Django REST)
- order-service (Django REST)
- payment-service (Django REST)
- shipping-service (Django REST)
- ai-service (FastAPI)
- gateway (FastAPI API Gateway, JWT stateless + RBAC)
- nginx (reverse proxy entrypoint for UI + API)
- frontend (React/Vite SPA)

## Toi uu hieu nang da ap dung

1. Database connection pooling:
   - Tat ca Django services dat `CONN_MAX_AGE=60` trong `DATABASES`.
   - Giam overhead tao/dong ket noi DB tren moi request.
2. Stateless authentication:
   - Khong su dung `SessionMiddleware` trong tat ca Django services.
   - Gateway verify JWT signature tren RAM bang `JWT_SECRET_KEY`, khong truy van DB session state.
3. Pure REST gateway + SPA:
   - Frontend tach rieng thanh React SPA.
   - Gateway tap trung routing, auth, JSON parsing/proxy.

## Quick Start

1. Sao chep file env:

   - `cp .env.example .env` (Linux/macOS)
   - tren Windows, tao `.env` tu `.env.example`

2. Khoi dong he thong:

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

Hoac dung script local (co kem seed data):

```bash
./local-dev.sh up
```

PowerShell:

```powershell
.\local-dev.ps1 up
```

3. Truy cap:

- Nginx entrypoint (khuyen dung): http://localhost
- Frontend direct: http://localhost:3000
- Gateway API direct: http://localhost:8080

## Seed Data

Script local se tu dong seed user va product. Neu can seed lai:

```bash
./local-dev.sh seed
```

Tai khoan test:

- admin / admin123
- staff / staff123
- customer / customer123

## Huong dan test chuc nang

Xem chi tiet tai TESTING_GUIDE.md

## API Through Gateway

Khuyen dung qua Nginx:

- POST `http://localhost/api/auth/register`
- POST `http://localhost/api/auth/login`
- GET `http://localhost/api/products/`
- POST `http://localhost/api/cart/add`
- GET `http://localhost/api/cart/`
- POST `http://localhost/api/orders/`
- POST `http://localhost/api/payment/pay`
- POST `http://localhost/api/shipping/create`
- GET `http://localhost/api/recommend?user_id=1`
- POST `http://localhost/api/chatbot`

Direct qua gateway (debug):

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/products/`
- POST `/api/cart/add`
- GET `/api/cart/`
- POST `/api/orders/`
- POST `/api/payment/pay`
- POST `/api/shipping/create`
- GET `/api/recommend?user_id=1`
- POST `/api/chatbot`

## Domain Product

- Book: author, publisher, isbn
- Electronics: brand, warranty
- Fashion: size, color
