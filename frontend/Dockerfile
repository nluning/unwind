# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Vite bakes VITE_API_URL into the output at build time.
# Pass it when building: docker build --build-arg VITE_API_URL=https://yourdomain.com/api
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy everything Vite needs to build
COPY index.html vite.config.ts uno.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

# Build the frontend — produces static files in /app/dist.
# Uses build-only (just Vite) instead of build (Vite + type-check),
# because type-checking is a dev/CI concern, not a Docker build concern.
RUN npm run build-only

# ---- Stage 2: Runtime ----
# nginx serves the static files. No Node.js needed at runtime.
FROM nginx:alpine

# Replace the default nginx config with ours (API proxy + Vue Router support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built files into nginx's default serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
