# Nginx, conceptually

## What Nginx is

Nginx (pronounced "engine-x") is a **web server**, but that label undersells
it. More precisely, it's a high-performance program that sits at the **edge
of your infrastructure**, listening on ports 80 and 443, and decides what to
do with every incoming HTTP request before any application code runs.

It typically plays three overlapping roles:

1. **Static file server** — serves `.html`, `.js`, `.css`, images directly
   from disk, faster than any app framework could.
2. **Reverse proxy** — receives a request, forwards it to a backend (e.g.
   Fastify on port 3000), waits for the response, sends it back to the
   client.
3. **TLS terminator** — handles HTTPS: decrypts incoming requests,
   re-encrypts outgoing responses. The application only ever speaks plain
   HTTP internally.

## The problem it solves for Unwind

In production, the Fastify app listens on port 3000. That alone leaves
several awkward questions unanswered:

- How does `https://unwind.yourdomain.com` (port 443) reach an app on port
  3000?
- Where does the TLS certificate live?
- How does the Vue frontend (static files built by Vite) get served?
- What serves `/api/*` vs `/` (the SPA)?
- What happens when the Node process restarts — do users see a broken page?
- How are rate limits, gzip compression, caching headers applied uniformly?

Nginx answers all of those in one config file. It's the **traffic cop** in
front of the app.

## Request flow

```
Browser                    Nginx (VPS, port 443)              Fastify (port 3000)
   |  GET /api/chat             |                                    |
   |--------------------------->|                                    |
   |                            | terminates TLS                     |
   |                            | matches location /api/             |
   |                            | forwards to localhost:3000         |
   |                            |----------------------------------->|
   |                            |                                    | runs handler
   |                            |<-----------------------------------|
   |                            | adds gzip, headers                 |
   |                            | re-encrypts with TLS               |
   |<---------------------------|                                    |
```

For a frontend request (`GET /`), Nginx skips the backend step and serves
`index.html` straight off disk — Fastify never sees it.

## Why Nginx specifically

Its defining technical choice is **event-driven, non-blocking I/O**. One
Nginx worker can hold tens of thousands of concurrent connections because
each connection is just an entry in an event loop, not a thread. Old-school
web servers (Apache's prefork mode) spawned one process/thread per
connection — fine for 100 users, expensive for 10,000.

Node.js uses the same event-loop model internally, so Nginx and Fastify are
philosophically similar. They're used together because they specialize:

- **Nginx** is written in C, battle-tested for two decades, excellent at
  low-level HTTP, TLS, and disk I/O.
- **Fastify** is where the *business logic* lives — routing to handlers,
  calling Claude, hitting Postgres.

Letting Nginx handle the boring-but-critical edge concerns keeps app code
focused.

## Typical Unwind `nginx.conf` sketch

```nginx
server {
    listen 443 ssl http2;
    server_name unwind.example.nl;

    ssl_certificate     /etc/letsencrypt/live/unwind.example.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/unwind.example.nl/privkey.pem;

    # API requests go to Fastify
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Everything else: serve the built Vue SPA
    location / {
        root /var/www/unwind/dist;
        try_files $uri $uri/ /index.html;   # SPA fallback
    }
}
```

Things worth noticing:

- `try_files ... /index.html` is how an SPA works behind Nginx: any URL that
  doesn't match a file falls back to `index.html`, letting Vue Router handle
  it client-side.
- `proxy_pass` is the whole reverse proxy. One line.
- The `ssl_certificate` paths come from **Let's Encrypt** via `certbot`,
  which automates getting and renewing free TLS certs.

## Where it sits in deployment

```
┌─────────── VPS ───────────┐
│                           │
│  Nginx (host or container)│  ← :80, :443
│       │                   │
│       ├─→ Fastify container (:3000)
│       │        │
│       │        └─→ Postgres container (:5432)
│       │
│       └─→ /var/www/unwind/dist (Vue build output)
│                           │
└───────────────────────────┘
```

Nginx is either a separate container (networked to the backend) or runs on
the host directly. Both are defensible.

## What Nginx is not

- **Not a framework.** It has no concept of routes, data models, or users.
  Only paths, headers, and upstream servers.
- **Not where auth logic lives.** It can check a cookie's presence, but
  actual session validation belongs in Fastify.
- **Not magic for performance.** If Fastify is slow, Nginx won't save you.
  It optimizes the *edge*, not the app.

## SSE and the buffering trap

By default, Nginx **buffers** the backend's response — holds it in memory
until "enough" has arrived (or it's complete), then flushes it in one go.
Great for normal HTTP: lets Nginx apply gzip, set `Content-Length`, and
insulate slow clients from tying up Fastify workers.

For Server-Sent Events, it's fatal. The whole point of SSE is that the
backend writes `data: {...}\n\n`, Fastify flushes it, and the browser's
`EventSource` receives it *immediately*. If Nginx buffers, the user sees
nothing for 10 seconds and then gets the whole conversation in one burst.

Fix on the streaming location:

```nginx
location /api/chat/stream {
    proxy_pass http://localhost:3000/chat/stream;
    proxy_buffering off;       # the key one — send bytes through as they arrive
    proxy_cache off;           # don't try to cache a stream
    proxy_read_timeout 24h;    # streams can be long-lived; don't kill them
    proxy_set_header Connection '';
    proxy_http_version 1.1;    # keepalive + chunked encoding
}
```

Or, cleaner: set `X-Accel-Buffering: no` on the response from Fastify, so
the endpoint declares "don't buffer me" itself:

```ts
reply.raw.setHeader('X-Accel-Buffering', 'no')
reply.raw.setHeader('Content-Type', 'text/event-stream')
reply.raw.setHeader('Cache-Control', 'no-cache')
```

### Chunking vs buffering — the core distinction

- **Chunked encoding** = *cutting* the response into pieces (the mechanism).
- **Buffering** = *collecting* those pieces before forwarding them (the
  policy).

Sharper framing that generalizes:

> **Chunking is about framing. Buffering is about timing.**

- *Framing*: how is a stream divided into units? (chunks, packets, messages,
  rows)
- *Timing*: when does each unit move forward to the next consumer?
  (immediately, on flush, when a buffer fills, when the stream closes)

Every streaming system — SSE, WebSockets, TCP itself, Kafka, database
cursors — has both dimensions. A latency bug usually reduces to "framing is
fine, timing is wrong," or vice versa.

### Where this distinction will keep mattering

1. **Anthropic's streaming API.** The SDK in `routes/chat.ts` receives
   chunks from Anthropic. Anthropic frames as SSE; Unwind decides when to
   flush onward to the browser. Two buffering layers to think about:
   theirs → yours, yours → client.
2. **Postgres `COPY` and cursors.** Chunking is `fetch N rows at a time`;
   buffering is whether `pg` hands each batch over immediately or
   accumulates.
3. **Node.js streams in general.** `.pipe()` is chunking + backpressure.
   `highWaterMark` is the buffer size. When a stream underperforms: "where's
   the buffer, and what's it waiting for?"

## Insights

- The reason frontend and backend can share a single domain (`unwind.nl` for
  both the SPA and the API) is Nginx's `location` blocks doing path-based
  routing. Without it, CORS, separate subdomains, or both would be needed —
  visible immediately in `@fastify/cors` getting much more complicated.
- Nginx's reverse-proxy role is what makes **zero-downtime deploys**
  possible: start a new Fastify container on port 3001, flip Nginx's
  `proxy_pass` to the new port, reload Nginx (which keeps existing
  connections alive), then stop the old container. The app doesn't need to
  know anything about this.
- The trust boundary matters: because Nginx terminates TLS, Fastify sees
  `http://` requests internally. `req.ip` will be *Nginx's IP* unless
  Fastify is configured to trust `X-Forwarded-For` from Nginx. Easy to miss,
  and it breaks rate limiting by IP — exactly what `createRateLimiter`
  depends on.
- Proxies apply policies (buffering, caching, compression, timeouts) that
  are sensible defaults for *most* traffic but wrong for *specific* traffic.
  Streaming, WebSockets, and long-polling are all examples where the
  proxy's "helpful" behavior becomes harmful. Learning to recognize these
  mismatches is a large part of operating web infrastructure.
- `gzip` compression has the same pitfall as buffering: compressing an SSE
  stream would *also* buffer it (can't gzip a stream of unknown length
  without accumulating bytes first). So `gzip off` is usually set alongside
  `proxy_buffering off` for streaming endpoints.
- The `proxy_read_timeout` default (60s) is another silent killer. A chat
  conversation that pauses while the model thinks for 65 seconds would get
  dropped at the Nginx layer with a 504 — and Fastify logs would show
  nothing wrong because the backend is still working happily.
- The chunking/buffering metaphor maps exactly onto TCP internals:
  "segmentation" (cutting) vs "Nagle's algorithm" (a buffering policy that
  collects small segments before sending, to reduce overhead). `TCP_NODELAY`
  disables Nagle — the exact same pattern as `proxy_buffering off`, one
  layer down the stack.
- Once framing and timing are separated conceptually, any streaming config
  reads faster: which knobs control framing, which control timing? For
  Nginx: `chunked_transfer_encoding` controls framing; `proxy_buffering`,
  `proxy_buffer_size`, `proxy_busy_buffers_size` control timing.
