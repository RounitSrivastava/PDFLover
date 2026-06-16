# Use Ubuntu with LibreOffice pre-installed
FROM node:20-slim

# Install LibreOffice and required fonts
RUN apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy server code
COPY server.js ./

# Expose port (Railway sets PORT env automatically)
EXPOSE 4000

# Start
CMD ["node", "server.js"]
