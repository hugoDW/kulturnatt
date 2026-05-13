# Dockerfile för matching-service
FROM python:3.12-slim

WORKDIR /app

# installera python-paket
COPY requirements.txt .
RUN pip install -r requirements.txt

# kopiera in koden
COPY . .

# servern lyssnar på port 8002
EXPOSE 8002

# starta uvicorn-servern
CMD ["uvicorn", "main:app", "--host", "::", "--port", "8002"]
