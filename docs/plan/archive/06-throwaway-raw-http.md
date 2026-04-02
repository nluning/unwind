# Throwaway exercise — Raw Node.js HTTP server

## Purpose

Build a tiny HTTP server using only Node's built-in `http` module — no Fastify,
no Express, no libraries. The goal is to understand what Fastify does for you by
doing it yourself once. This is a learning exercise, not part of Unwind. Build it
in a separate folder or a throwaway branch, then delete it.

## When to do this

Anytime before or during Stage 1. It's a half-day exercise. Don't let it block
your progress on the actual app.

---

## Steps

### Step 1: A server that responds to one route

Create a single file. Use `http.createServer()` to start a server on port 3000.
When a request comes in, check `req.url` and `req.method` manually:

- `GET /health` → respond with `{ "status": "ok" }` (set the Content-Type header
  to `application/json`)
- Anything else → respond with 404

**What you'll notice:** you have to manually set status codes, headers, and
`JSON.stringify` your response. Fastify does all of this behind `reply.send()`.

### Step 2: Add a second route with a URL parameter

Add `GET /hello/:name` that responds with `{ "message": "Hello, [name]" }`.

**The catch:** Node's `http` module doesn't have route parameters. You'll need to
parse `req.url` yourself (split on `/`, extract the part you need). This is what
a router does — and why every framework has one.

### Step 3: Handle a POST with a JSON body

Add `POST /echo` that reads the request body and sends it back.

**The catch:** the request body doesn't arrive all at once. It comes in chunks.
You'll need to listen for `data` events on the request, collect the chunks, and
`JSON.parse` the result when the `end` event fires. This is what Fastify's body
parser does automatically.

### Step 4: Add basic error handling

What happens when someone sends invalid JSON to your POST endpoint? Add a
try/catch around `JSON.parse` and return a 400 error.

What happens when your code throws an unexpected error? Wrap your route handling
in a try/catch and return a 500. Without this, Node crashes the process.

---

## What you should take away

After this exercise, you should be able to explain:

- What `http.createServer()` gives you (a raw request and response object)
- Why routing libraries exist (matching URLs and methods is tedious and
  error-prone by hand)
- Why body parsing libraries exist (reading chunked request streams is annoying)
- Why frameworks set Content-Type and status codes for you (it's easy to forget)

You should also feel good about using Fastify — not because you can't do it
without, but because you've *seen* what it replaces and it's not worth doing
by hand every time.

---

## Rules

- One file, no dependencies (no `npm init` even)
- Run it with `node server.mjs` (use `.mjs` for ESM import syntax)
- Delete it when you're done — this is not production code
