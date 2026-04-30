# `as const`, conceptually

## What it is

`as const` is a **const assertion**. It tells TypeScript: "infer the narrowest
possible type for this value, and treat the result as deeply readonly."

It's a type-level annotation — it disappears at compile time. The emitted
JavaScript is identical with or without it.

## The problem it solves

By default, TypeScript *widens* literal types because that's usually what you
want when assigning to a `let` or pushing to an array:

```ts
const greeting = 'hello'      // type: 'hello'
let greeting = 'hello'        // type: string  (widened)

const list = [1, 2, 3]        // type: number[]  (also widened)
```

Widening is helpful when you intend to mutate or reassign. But sometimes you
*don't* want it — you want the value's exact shape preserved as a type, so
you can use that type elsewhere. That's what `as const` is for.

## What it does, in three parts

```ts
const required = ['DB_HOST', 'DB_PORT'] as const
```

| | Without `as const` | With `as const` |
|---|---|---|
| Type | `string[]` | `readonly ['DB_HOST', 'DB_PORT']` |
| Mutable? | yes (`.push('x')` compiles) | no (compiler error) |
| Element type | `string` | `'DB_HOST' \| 'DB_PORT'` (literal union) |

It does three things at once:

1. **Cancels widening.** Literals stay as their literal types. `'hello'`
   stays `'hello'`, not `string`.
2. **Tuple instead of array.** Position is remembered.
   `[1, 'x']` becomes `readonly [1, 'x']`, not `(string | number)[]`.
3. **Deeply readonly.** Every property at every nesting level is treated
   as readonly.

## Where it earns its keep in Unwind

The strongest use is in `backend/src/routes/onboarding.ts:84`:

```ts
const bodySchema = {
  body: { type: 'object', required: [...], properties: {...} }
} as const
```

Without `as const`, the `type: 'object'` field would be inferred as `string`,
not the literal `'object'`. Fastify's TypeScript types use that literal to
**derive the runtime body shape** and surface it on `request.body` inside the
handler. Drop the `as const` and Fastify falls back to whatever generic you
typed — losing the connection between the schema and the body type.

This is the pattern where `as const` really matters: **runtime values acting
as types.** JSON Schema in Fastify, Zod schemas, route definitions, finite
state machines, action-type unions in reducers. Anywhere the value *is* the
type.

A weaker use lives in `backend/src/config.ts:7,12`:

```ts
const ALWAYS_REQUIRED = ['DB_HOST', 'DB_PORT', ...] as const
```

Here `as const` is mostly muscle memory. The narrow type is *available* for
future use (`type RequiredKey = typeof ALWAYS_REQUIRED[number]` would yield a
union of literals), but the current code only iterates and reads
`process.env[key]`. Either way works. Worth knowing the difference between
"this `as const` is doing real type-system work" and "this `as const` is
defensive habit." Both are fine; only one is load-bearing.

## How type-safe is it really?

Two layers, very different answers.

### Compile-time: very safe

- Mutating attempts fail to compile.
- Indexed access returns the literal type, not the widened one.
- Derived unions via `typeof X[number]` give you exactly the values, not
  `string`.
- Unlike `value as SomeType` (which is "trust me bro, treat this as that
  type"), `as const` can only *narrow*. There's nothing to lie about — the
  literal is exactly what it is. That makes it one of the **safest** uses
  of `as` in TypeScript.

### Runtime: zero protection

`as const` is not `Object.freeze`. The transpiled JavaScript is a plain
mutable array or object:

```ts
const arr = [1, 2, 3] as const   // type: readonly [1, 2, 3]
// Compiles to:
const arr = [1, 2, 3]            // perfectly mutable at runtime
```

Implications:

- `(arr as readonly number[]).push(4)` → won't compile.
- `(arr as number[]).push(4)` → compiles, mutates the array, no warning.
- A third-party function that mutates its argument will mutate it. The
  compiler can't see across the call.
- Copy via spread or `JSON.parse(JSON.stringify(x))` — the copy is mutable,
  not readonly.

So "how type safe" depends on the threat model:

| Threat | `as const` defends? |
|---|---|
| Accidentally mutating in your own code | ✅ yes (compiler error) |
| Type widening losing literal information | ✅ yes (the whole point) |
| Someone using `as` to bypass the readonly | ❌ no |
| Runtime mutation by code you don't control | ❌ no |
| Mutation via a copy of the value | ❌ no |

If you need runtime immutability too, pair it with `Object.freeze`. Most of
the time you don't — the value sits in a module-scope `const` that nobody is
trying to mutate, and the compiler's protection is enough.

## When *not* to use it

- When you actually want a mutable structure. `as const` on a working
  accumulator is just friction.
- On values whose literal types you'll never read.
- When type-widening is what you want — e.g. `const status = 'pending' as const`
  makes `status: 'pending'`, fine if you only ever assign other literals,
  annoying if you want to reassign to `'completed'`.

## Mental model

`as const` is to types what `Object.freeze` is to runtime — same posture,
different layer. Use both when you genuinely need immutability; use
`as const` alone when you just want type narrowing and the runtime
mutability isn't a concern.

The reason it's the safer of the `as` family: it can *only* narrow. Other
type assertions can widen too — which is where the lies happen.
