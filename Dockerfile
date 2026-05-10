FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy all project files
COPY . .

# Set the working directory to backend because main.py expects frontend at ../frontend relative to itself
WORKDIR /app/backend

# The PORT environment variable is injected by Cloud Run (defaults to 8080)
ENV PORT=8080
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'
