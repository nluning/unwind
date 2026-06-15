# syntax=docker/dockerfile:1
# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Vite bakes VITE_* vars into the output at build time.
# Pass them when building: docker build --build-arg VITE_API_URL=...
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
# Git SHA, passed by CI — Sentry release for source-map resolution.
ARG VITE_SENTRY_RELEASE
ENV VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE

# Copy everything Vite needs to build
COPY index.html vite.config.ts uno.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

# Build the frontend — produces static files in /app/dist.
# Uses build-only (just Vite) instead of build (Vite + type-check),
# because type-checking is a dev/CI concern, not a Docker build concern.
#
# The Sentry auth token is mounted as a BuildKit secret, not a build-arg, so it
# is exposed only to this single RUN and never written to an image layer or the
# build cache. When the secret is absent (e.g. a plain local build), the env var
# is empty and vite.config.ts skips the Sentry plugin entirely.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    npm run build-only

# ---- Stage 2: Runtime ----
# nginx serves the static files. No Node.js needed at runtime.
FROM nginx:alpine

# Replace the default nginx config with ours (API proxy + Vue Router support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built files into nginx's default serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
