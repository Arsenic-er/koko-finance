FROM python:3.11-slim

WORKDIR /app

# HuggingFace model cache lives in the mounted ./cache volume -> survives rebuilds
ENV HF_HOME=/app/cache/hf

# CPU-only torch first (own layer, cached; avoids multi-GB CUDA wheels)
RUN pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu

# System deps kept minimal; layer-cached install of python deps
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/

EXPOSE 8000
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
