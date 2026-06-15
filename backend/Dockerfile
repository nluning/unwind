# ---- Stage 1: Build ----
# Start from a Node.js image that has everything we need to compile TypeScript.
# "alpine" is a tiny Linux distribution — keeps the image small.
FROM node:22-alpine AS builder

# Set the working directory inside the container.
# All subsequent commands run from here.
WORKDIR /app

# Copy package files first, BEFORE copying source code.
# Docker caches each layer — if package.json hasn't changed, it skips
# "npm install" entirely on rebuilds. This makes rebuilds much faster.
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies like typescript and tsx)
# because we need them to compile. The --ignore-scripts flag skips postinstall
# hooks that might fail in a container environment.
RUN npm ci

# Now copy the rest of the source code.
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript. The output goes to /app/dist
# (as defined in tsconfig.json "outDir": "dist").
RUN npx tsc

# ---- Stage 2: Runtime ----
# Start from a fresh, clean Node.js image. Nothing from the builder stage
# carries over unless we explicitly COPY it. This means no TypeScript compiler,
# no devDependencies, no source .ts files — just compiled JS.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# Install only production dependencies. --omit=dev skips TypeScript, tsx,
# vitest, etc. The runtime image is much smaller as a result.
RUN npm ci --omit=dev

# Copy the compiled JavaScript from the builder stage.
COPY --from=builder /app/dist ./dist

# Copy migration and seed files — we need these to set up the database.
COPY src/db/migrations ./dist/db/migrations
COPY src/db/seed.sql ./dist/db/seed.sql

# Git SHA of this build, passed by CI. Read by instrument.ts as the Sentry
# release so each issue can be traced to the deploy that introduced it.
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Don't run the container as root. Create a non-root user and switch to it.
# If the app gets compromised, the attacker has limited permissions.
USER node

# Tell Docker which port this container listens on.
# This is documentation — it doesn't actually open the port.
EXPOSE 3000

# The command that runs when the container starts.
# "node dist/server.js" runs the compiled JavaScript directly — no tsx needed.
CMD ["node", "dist/server.js"]
