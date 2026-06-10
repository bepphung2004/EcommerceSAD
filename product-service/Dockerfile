FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "python manage.py makemigrations core --skip-checks && until python manage.py migrate --fake-initial --skip-checks; do echo 'Waiting for product-db...'; sleep 2; done && python manage.py runserver 0.0.0.0:8001 --skip-checks"]
