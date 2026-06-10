# Testing Guide (Local)

## 1) Start system + seed

### Bash (Git Bash / WSL)

```bash
cd "c:/Users/Admin/OneDrive - ptit.edu.vn/Desktop/SAD/ecom-final"
./local-dev.sh up
```

If script is not executable yet:

```bash
chmod +x local-dev.sh
./local-dev.sh up
```

### PowerShell

```powershell
cd "c:\Users\Admin\OneDrive - ptit.edu.vn\Desktop\SAD\ecom-final"
.\local-dev.ps1 up
```

After startup:

- Frontend: http://localhost:3000
- Gateway API: http://localhost:8080

Seeded users:

- admin / admin123
- staff / staff123
- customer / customer123

## 2) Web test scenarios

Open http://localhost:3000 and run tests below.

### A. Authentication

1. Confirm username/password default is `customer / customer123`.
2. Click Login.
3. Expected: message shows login success, cart section available.

Optional register test:

1. Enter new username/password.
2. Click Register.
3. Click Login with the same account.
4. Expected: account created and login works.

### B. Product catalog

1. Scroll to Products.
2. Expected: seeded items from Book/Electronics/Fashion appear.
3. Verify product cards show domain, price, stock.

### C. Cart

1. Click Add to Cart on 2-3 products.
2. Scroll to Cart.
3. Expected: cart lists added product IDs and quantities.

### D. Order -> Payment -> Shipping flow

1. In Cart section, click Create Order.
2. Expected: message `Order #<id> created`.
3. Backend flow expectation:
   - order-service creates order.
   - order-service calls payment-service.
   - if payment success, order-service calls shipping-service.

### E. AI features

1. Login first.
2. Check AI Recommendation section:
   - Expected seeded recommendation IDs are displayed.
3. Enter text in chatbot input (example: `toi can laptop gia re`).
4. Click Ask Chatbot.
5. Expected: chatbot returns product advice text.

## 3) Quick API checks (optional)

### Health check

```bash
curl http://localhost:8080/health
```

Expected:

```json
{"status":"ok"}
```

### Login API

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"customer123"}'
```

Expected: response has `access` and `refresh` token.

## 4) Useful local commands

Re-seed data only:

```bash
./local-dev.sh seed
```

Show running services:

```bash
./local-dev.sh ps
```

View logs:

```bash
./local-dev.sh logs
```

Stop everything:

```bash
./local-dev.sh down
```
