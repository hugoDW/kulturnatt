# Dockerfile för profile-service
FROM python:3.12-slim

WORKDIR /app

# installera python-paket
COPY apps/profile-service/requirements.txt .
RUN pip install -r requirements.txt

# kopiera in koden
COPY apps/profile-service/ .
COPY apps/API/ ./API/

# servern lyssnar på port 8001
EXPOSE 8001

# starta uvicorn-servern
CMD ["uvicorn", "main:app", "--host", "::", "--port", "8001"]
