# Fastify, conceptually

## What Fastify is

Fastify is a web framework for Node.js. Its job is to turn the raw, low-level
HTTP server that Node ships with into something you can actually build an API
on without reinventing the wheel every time.

## The problem it solves

Node.js has a built-in `http` module. You can write a server with it in about
10 lines — but you get *nothing* on top: no routing (matching `GET /activities`
to a function), no body parsing (turning a JSON request body into an object),
no way to organize code across files, no structured logging, no error handling
conventions. Everything is a raw `(req, res)` callback where you manually read
bytes off a stream.

A framework fills that gap. Fastify's specific bet is: **be fast, and be
structured around plugins.**

## The two ideas that define Fastify

### 1. Plugins and encapsulation

Look at `backend/src/app.ts` — almost every line is `fastify.register(...)`. A
plugin is just an async function that receives a Fastify instance and adds
things to it (routes, decorators, hooks). Encapsulation means: a plugin has
its own scope. If plugin A registers a hook or decorator, it doesn't leak into
plugin B unless explicitly marked as shared. This is how you keep a growing
app from becoming a global-state mess. `authRoutes`, `chatRoutes`,
`memoryRoutes` are all plugins — each self-contained, each registered with
one line.

### 2. Schema-driven validation and serialization

Fastify expects you to describe request/response shapes with JSON Schema. It
uses those schemas both to *validate* incoming data (reject bad requests
early) and to *compile* a fast serializer for outgoing responses (much faster
than `JSON.stringify` on unknown objects). This is where the "fast" in
Fastify mostly comes from — not some magic runtime, but code generation at
registration time.

## How it compares

- Like **Express**, but opinionated about plugins, async/await, and
  performance. Express is older, more permissive, and slower.
- Like **Laravel**, but far thinner. Laravel gives you routing, ORM, auth,
  queues, mail, templates, everything. Fastify gives you routing + plugins +
  schemas, and you bolt on the rest yourself. That's *why* it was chosen
  for Unwind: to expose the moving parts rather than hide them.

## How it shows up in Unwind

```ts
fastify.register(cookie)      // adds req.cookies + reply.setCookie
fastify.register(dbPlugin)    // adds fastify.db (pg Pool)
fastify.register(authRoutes)  // mounts POST /login, /logout, etc.
```

Each `register` call is a seam. `dbPlugin` decorates the instance with a
database handle; route plugins read `fastify.db` off that instance.

## What a Fastify "instance" is

When you write `const fastify = Fastify({ logger: true })` in
`backend/src/app.ts`, that variable is the instance. Conceptually, it's an
object that represents your whole web application — one live JavaScript
object that holds:

- the routing table (every URL → handler mapping)
- the list of registered plugins
- shared resources decorated onto it (like `fastify.db`)
- lifecycle hooks
- the logger
- eventually, the underlying HTTP server once `.listen()` is called

Think of it as the app itself, as a value you can pass around, rather than
a collection of globals scattered across files.

### Why instance, not globals

1. **Testability.** You can call `buildApp()` twice and get two independent
   apps with different config. Globals would leak state between tests.
2. **Encapsulation.** When a plugin registers, Fastify creates a *child*
   instance scoped to it. Decorators and hooks only apply within that scope
   unless explicitly shared.
3. **Composability.** Sub-apps can be mounted under prefixes
   (`fastify.register(apiRoutes, { prefix: '/api' })`).

### The subtle part: child instances

Inside `authRoutes`, the plugin function receives a parameter usually called
`fastify` — but it's not the same instance. It's a child scoped to that
plugin. If `authRoutes` adds a hook with `fastify.addHook(...)`, that hook
only runs for routes registered within `authRoutes`. That's the mechanism
that keeps an auth-checking hook from accidentally applying to public
`/activities` routes.

## The app factory pattern

`buildApp()` returns a fully-configured-but-not-yet-listening instance, and
the caller decides what to do with it:

- `server.ts` calls `.listen()` → real server on port 3000.
- A test file calls `.inject({ method: 'POST', url: '/login', ... })` → fires
  a fake HTTP request into the routing tree, gets a response back, without
  ever opening a TCP port.

Two benefits:

1. **Separation of construction from starting** — tests use `inject` instead
   of `listen`.
2. **Isolation between callers** — every call produces a fresh app, so tests
   don't pollute each other.

## Insights

- The plugin system is really a **dependency injection container in
  disguise**: `dbPlugin` registers a `db` on the Fastify instance, and route
  plugins access it via `fastify.db` — no imports, no globals, scoped by
  registration order.
- A Fastify instance is a **tree**, not a flat object: the top-level app is
  the root, each `register` creates a child node, and child nodes can
  register their own children. Encapsulation rules are really "which node
  owns this thing."
- The instance passed to a plugin is a *different JavaScript object* from
  the parent, but its prototype chain lets it read parent decorators (like
  `fastify.db`). That's why you can reach `fastify.db` inside a route plugin
  even though it was decorated higher up.
- `fastify.decorate('db', pool)` exists so Fastify can detect collisions
  (two plugins both adding `db`) and so it knows what to copy into child
  instances.
- `fastify.inject()` works because Fastify's request handling is
  fundamentally just a function call on the instance. The HTTP server is
  *wrapping* that, not essential to it. Decoupling "handle a request" from
  "listen on a socket" is what makes it testable.
