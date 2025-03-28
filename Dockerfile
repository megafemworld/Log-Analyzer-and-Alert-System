FROM node:20-slim AS node-base
WORKDIR /app

# Install Python
FROM node-base AS node-python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    gcc

# Install C dependencies
FROM node-python AS build-base
WORKDIR /app
COPY processor/Makefile processor/
COPY processor/src/ processor/src/
COPY processor/include/ processor/include/
RUN mkdir -p processor/build && cd processor && make

# Build Node.js app
FROM build-base AS node-build
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/

# Install Python dependencies
FROM node-build AS python-build
WORKDIR /app
COPY analyzer/requirements.txt ./analyzer/
RUN pip3 install --no-cache-dir -r analyzer/requirements.txt
COPY analyzer/ ./analyzer/

# Create data directory
RUN mkdir -p data/logs

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "server/index.js"]