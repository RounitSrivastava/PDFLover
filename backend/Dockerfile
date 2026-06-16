FROM node:20-slim

# Install Python, pip, LibreOffice (for Word→PDF), and fonts
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libreoffice \
    libgl1 \
    libglib2.0-0 \
    fonts-liberation \
    fonts-dejavu \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pdf2docx in a venv (avoids "externally managed" error on newer Debian)
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir pdf2docx

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY convert.py ./

EXPOSE 4000

CMD ["node", "server.js"]
