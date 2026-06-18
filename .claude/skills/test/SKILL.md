---
name: test
description: Testing patterns for Vue frontend components and composables using Vitest. Use when writing tests, adding tests, creating test files, or fixing failing tests in the frontend.
---

# Vue Vitest Testing

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Test Naming](#test-naming)
3. [Test Budget](#test-budget)
4. [Anti-Patterns](#anti-patterns)
5. [Directory Structure](#directory-structure)
6. [Mock Organization](#mock-organization)
7. [Best Practices](#best-practices)
8. [Test Structure](#test-structure)
9. [Composable Testing](#composable-testing)
10. [Component Testing](#component-testing)
11. [Common Assertions](#common-assertions)
12. [Import Patterns](#import-patterns)
13. [When Reviewing Test Code](#when-reviewing-test-code)
14. [Quality Checklist](#quality-checklist)

---

## Core Philosophy

**Test behavior, not implementation.** Every test should answer "Why does this
feature/logic exist?" not "What does the code do?"

### The Behavioral Testing Mindset

Before writing any test, ask:

1. **What user problem does this solve?** — Tests validate requirements, not
   code paths
2. **What would break if this failed?** — If the answer is "nothing
   user-visible", don't test it
3. **Would this test break if I refactored?** — Good tests survive refactoring;
   implementation tests don't

### What to Test

| Test This | Because |
|-----------|---------|
| User can accept/skip a suggestion | Core interaction |
| Stress filter returns correct activities | Business logic |
| Login redirects to suggest page | User flow |
| Empty state shows when no activities match | User feedback |
| createActivity adds to local state | Data consistency |

### What NOT to Test

| Don't Test This | Why It's Wrong |
|-----------------|----------------|
| Component renders | Structure, not behavior |
| Method gets called | Implementation detail |
| Internal ref changes | Not user-visible |
| Props are passed correctly | Vue's job, not yours |
| API client internals | Test via composables |

---

## Test Naming

Test names should describe **requirements**, not **implementation**.

### Good Names

```typescript
it('should show filtered activities for selected stress level', ...)
it('should exclude selected category from suggestions', ...)
it('should redirect to login when session expires', ...)
it('should add created activity to suggestions without page refresh', ...)
it('should show empty state when no activities match filter', ...)
```

### Bad Names

```typescript
it('renders ActivityCard', ...)              // Structure, not behavior
it('emits accept event', ...)                // Mechanism, not purpose
it('calls fetchActivities', ...)             // Implementation
it('sets loaded to true', ...)               // Internal state
```

---

## Test Budget

**Target 3-6 tests per component/composable.** More usually means testing
implementation.

| Type | Target Tests | What to Test |
|------|-------------|--------------|
| Page component | 3-5 | User flow, mode-specific behavior, edge states |
| Shared component | 2-3 | Interaction outcomes, content display |
| Composable | 3-5 | Return values, state changes, API integration |
| Utility function | 2-4 | Happy path, edge cases, error handling |

### Consolidation Pattern

```typescript
// BAD: separate test per field
it('should display activity title', ...)
it('should display activity description', ...)
it('should display activity duration', ...)

// GOOD: one test for the card's content
it('should show complete activity information', () => {
    // Arrange & Act
    const wrapper = shallowMount(ActivityCard, {
        props: {
            // @ts-expect-error partial test activity — only the rendered fields matter
            activity: {
                title: 'Ga een rondje lopen',
                description: 'Geen bestemming, gewoon lopen.',
            },
        },
    })

    // Assert
    expect(wrapper.text()).toContain('Ga een rondje lopen')
    expect(wrapper.text()).toContain('Geen bestemming, gewoon lopen.')
})
```

---

## Anti-Patterns

Common testing mistakes to avoid:

- Testing method calls instead of user-visible outcomes
- Testing render structure instead of data visibility
- Testing internal state instead of rendered output
- Testing events in isolation instead of their purpose
- Multiple Act/Assert pairs in one test

**Exception:** For reusable components like `ActivityCard`, emitted events ARE
the user-facing behavior. Name tests by purpose ("should let parent handle
accept action"), not mechanism ("emits accept event").

---

## Directory Structure

Tests live in `frontend/tests/` mirroring the source structure:

```
frontend/
├── src/
│   ├── components/
│   │   └── ActivityCard.vue
│   ├── composables/
│   │   ├── __mocks__/
│   │   │   ├── useActivities.ts
│   │   │   └── useAuth.ts
│   │   ├── useActivities.ts
│   │   ├── useAuth.ts
│   │   └── useSuggestionFlow.ts
│   ├── pages/
│   │   ├── SuggestPage.vue
│   │   ├── StressPage.vue
│   │   └── CounterbalancePage.vue
│   └── types/
│       └── activity.ts
│
└── tests/
    ├── setup.ts
    ├── components/
    │   └── ActivityCard.spec.ts
    ├── composables/
    │   ├── useActivities.spec.ts
    │   ├── useAuth.spec.ts
    │   └── useSuggestionFlow.spec.ts
    └── pages/
        ├── SuggestPage.spec.ts
        ├── StressPage.spec.ts
        └── CounterbalancePage.spec.ts
```

### Test File Naming

- Extension: `.spec.ts`
- Name matches source: `ActivityCard.vue` → `ActivityCard.spec.ts`

### Framework

- **Vitest** with **Vue Test Utils**
- `shallowMount` by default.

### Coverage

`vitest run --coverage` uses the v8 provider. `__mocks__` files are excluded as
test infra (`coverage.exclude` in `vite.config.ts`). Stubbed leaf components
(e.g. `components/icons/`) read 0% because `shallowMount` never renders them —
exclude them rather than chasing their coverage.

---

## Mock Organization

Three levels, from global to local.

### 1. Setup file (global)

`frontend/tests/setup.ts` runs before every test file. It holds the RouterLink
stub and the api-client safety net so no test can reach the network:

```typescript
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

config.global.stubs = {
    RouterLink: true,
}

// $t passthrough so components render without the i18n plugin; specs that need
// real translations install the plugin per-mount.
config.global.mocks = {
    $t: (key: string) => key,
}

vi.mock('../src/api/client', () => ({
    api: vi.fn(),
    // Keep ApiError a real class — useSuggestFromAnswers, useSuggestFromList,
    // and LoginPage do `instanceof ApiError`, which crashes if it's undefined.
    ApiError: class ApiError extends Error {
        constructor(
            public status: number,
            public body: unknown,
        ) {
            super(`API error ${status}`)
        }
    },
}))
```

This mock is a **safety net, not a per-test tool**. Composable specs that drive
a response import `api` and set it (see below). Component specs usually mock the
composable and never reach `api` — the exceptions are `LoginPage` and
`OnboardingPage`, which call `api` directly.

### 2. Shared composable mocks (`__mocks__`)

`useActivities` and `useAuth` are imported across most pages and have large
return shapes; re-declaring them inline in every spec invites drift. Give each
heavily-reused composable one mock in a `__mocks__` folder beside the source,
exporting both an auto-mock default and a factory for overrides:

```typescript
// src/composables/__mocks__/useActivities.ts
import { ref, computed } from 'vue'
import { vi } from 'vitest'
import type { Activity, useActivities as Real } from '../useActivities'

export function makeUseActivitiesMock(
    overrides: Partial<ReturnType<typeof Real>> = {},
): ReturnType<typeof Real> {
    return {
        activities: ref<Activity[]>([]),
        loaded: ref(true),
        error: ref(false),
        isEmpty: computed(() => false),
        fetchActivities: vi.fn(),
        createActivity: vi.fn(),
        updateActivity: vi.fn(),
        deleteActivity: vi.fn(),
        filterByStress: vi.fn(() => []),
        filterByExcludedCategories: vi.fn(() => []),
        suggest: vi.fn(() => null),
        markAccepted: vi.fn(),
        resetSession: vi.fn(),
        ...overrides,
    }
}

export const useActivities = vi.fn(makeUseActivitiesMock)
```

Typing the factory against `ReturnType<typeof Real>` makes drift loud: add a
field to the real composable and vue-tsc fails until the mock matches.

A bare `vi.mock` with no factory auto-resolves this file. Override per test
with the factory:

```typescript
import { useActivities, makeUseActivitiesMock } from '../../src/composables/useActivities'
import { ref } from 'vue'

vi.mock('../../src/composables/useActivities')

// default works out of the box; override one field when a test needs it:
vi.mocked(useActivities).mockReturnValue(makeUseActivitiesMock({ loaded: ref(false) }))
```

Promote a composable to `__mocks__` only once it's reused — one mocked in a
single spec can stay inline.

### 3. Inline mocks (per test file)

For a composable used in only one or two specs, mock inline at the top of the
file:

```typescript
vi.mock('../../src/composables/useChat')
```

### Mocking the API Client (composable specs)

```typescript
import { api } from '../../src/api/client'

// In a test:
vi.mocked(api).mockResolvedValueOnce([{ id: '1', title: 'Walk' }])
```

### Chat uses fetch directly, not the api client

`useChat` streams over SSE and calls `fetch` directly, so the api-client mock
does nothing for it. Mock `global.fetch` (and the stream reader) in chat specs.

---

## Best Practices

- **One Act/Assert per test** — split multiple interactions into separate tests
- **Always use explicit AAA comments** — `// Arrange`, `// Act`, `// Assert`
- **Clear mocks inline** — use `mockClear()` after assert, not in `beforeEach`
- **No shared test *data*** — write props, fixtures, and expected values inline
  per test (no `defaultProps`, no data factories like `makeActivity`). Include
  only the fields the test exercises and suppress the missing-field type error
  with `// @ts-expect-error partial test activity` — it keeps the object minimal
  and fails loudly if those fields ever stop being required. Dependency *mocks*
  are the exception: shared mock factories live in `__mocks__` (see Mock
  Organization) because they're infrastructure, not the subject under test.
- **Select with `data-test`, not CSS classes** — styling classes
  (`.uw-actions__primary`) change with restyles; `[data-test="accept"]` is a
  stable hook tied to intent.
- **No `wrapper.vm` access** — test rendered output, not internal state
- **Prefer `mockReturnValue` over `mockImplementation`** — use
  `mockImplementation` only when return value depends on arguments
- **No `flushPromises()` after awaited trigger** — the await is sufficient
- **Use specific values in assertions** — avoid `expect.stringContaining`
  when you can match exactly

---

## Test Structure

### One outer `describe` per file

Always wrap a file's contents in a single top-level `describe` named for the
module under test (the source file, e.g. `parseActivity`). Nest a `describe` per
exported unit inside it. This makes it obvious at a glance — in the file and in
the reporter output — that the whole module is covered, and keeps multi-export
files (a util file with several functions) from reading as a flat pile of
`it`s.

```typescript
// parseActivity.spec.ts — outer describe names the module
describe('parseActivity', () => {
    describe('parseMessage', () => {
        it('should extract a fenced json activity block', () => { /* ... */ })
    })

    describe('toCreatePayload', () => {
        it('should map pipe-separated categories to their ids', () => { /* ... */ })
    })
})
```

A single-export file still gets the outer describe (named for the module),
even though it has only one inner block — consistency over saving a line.

### AAA inside every test

Every test uses AAA (Arrange-Act-Assert) with explicit comments:

```typescript
describe('ActivityCard', () => {
    it('should let parent handle accept action', () => {
        // Arrange
        const wrapper = shallowMount(ActivityCard, {
            props: {
                // @ts-expect-error partial test activity — only the rendered fields matter
                activity: { title: 'Walk' },
            },
        })

        // Act
        wrapper.find('[data-test="accept"]').trigger('click')

        // Assert
        expect(wrapper.emitted('accept')).toHaveLength(1)
    })
})
```

### Clear mocks inline, not in hooks

```typescript
// BAD: hidden dependencies
beforeEach(() => {
    vi.clearAllMocks()
})

// GOOD: self-contained tests
it('should fetch activities on mount', async () => {
    // Arrange
    const mockFetch = vi.fn()
    vi.mocked(useActivities).mockReturnValue(
        makeUseActivitiesMock({ fetchActivities: mockFetch, loaded: ref(false) }),
    )

    // Act
    shallowMount(SuggestPage)
    await flushPromises()

    // Assert
    expect(mockFetch).toHaveBeenCalledOnce()
})
```

---

## Composable Testing

Test composables by calling them directly — no component mounting needed:

```typescript
import { useActivities } from '../../src/composables/useActivities'

describe('useActivities', () => {
    it('should filter activities by stress level', () => {
        // Arrange
        const { activities, filterByStress } = useActivities()
        activities.value = [
            { ...baseActivity, min_stress_level: 1, max_stress_level: 3 },
            { ...baseActivity, id: '2', min_stress_level: 4, max_stress_level: 5 },
        ]

        // Act
        const result = filterByStress(2)

        // Assert
        expect(result).toHaveLength(1)
        expect(result[0].min_stress_level).toBe(1)
    })

    it('should not suggest already-accepted activities', () => {
        // Arrange
        const { activities, suggest, markAccepted } = useActivities()
        activities.value = [
            { ...baseActivity, id: '1' },
            { ...baseActivity, id: '2' },
        ]
        markAccepted('1')

        // Act
        const suggested = suggest()

        // Assert
        expect(suggested?.id).toBe('2')
    })
})
```

### Composables that call the API

The api client is already mocked globally (`tests/setup.ts`) — don't re-`vi.mock`
it here (a bare re-mock drops the real `ApiError`). Just import `api` and set its
return value:

```typescript
import { api } from '../../src/api/client'

it('should populate activities from API', async () => {
    // Arrange
    vi.mocked(api).mockResolvedValueOnce([
        { id: '1', title: 'Walk', categories: ['Hands'] },
    ])
    const { activities, fetchActivities } = useActivities()

    // Act
    await fetchActivities()

    // Assert
    expect(activities.value).toHaveLength(1)
    expect(activities.value[0].title).toBe('Walk')
})
```

---

## Component Testing

### Page Components

Mock the composables they depend on, then test user interactions:

```typescript
vi.mock('../../src/composables/useActivities')
vi.mock('../../src/composables/useSuggestionFlow')

it('should show stress level selector before suggestions', () => {
    // Arrange & Act
    const wrapper = shallowMount(StressPage)

    // Assert
    expect(wrapper.findAll('[data-test="stress-level"]')).toHaveLength(5)
})
```

### i18n in Tests

`$t` is stubbed to a passthrough globally in `tests/setup.ts`, so component
specs render without any per-test i18n wiring — assert on `data-test` hooks and
mocked composable output, not on Dutch copy.

Install the real plugin **only** when the unit under test *is* the translation —
e.g. a composable-level spec like `useActivityTranslation.spec.ts` that needs
real `useI18n()` lookups. Use a small controlled `messages` set, not the real
`nl.json`, so the test checks lookup logic rather than copy:

```typescript
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
    legacy: false,
    locale: 'nl',
    messages: { nl: { activities: { 'even-wandelen': { title: 'Wandel even' } } } },
})

mount(Host, { global: { plugins: [i18n] } })
```

---

## Common Assertions

```typescript
// Emitted events (for reusable components)
expect(wrapper.emitted('accept')).toHaveLength(1)
expect(wrapper.emitted('skip')).toHaveLength(1)

// Text content
expect(wrapper.text()).toContain('Geen activiteiten gevonden')

// Element existence (select via data-test, not styling classes)
expect(wrapper.find('[data-test="activity-card"]').exists()).toBe(true)
expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)

// Mock calls
expect(vi.mocked(api)).toHaveBeenCalledWith('/activities')
expect(mockHandleAccept).toHaveBeenCalledOnce()

// Reactive state
expect(activities.value).toHaveLength(3)
expect(loaded.value).toBe(true)
```

---

## Import Patterns

```typescript
// Framework
import { describe, it, expect, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'

// Components (from source)
import ActivityCard from '../../src/components/ActivityCard.vue'
import SuggestPage from '../../src/pages/SuggestPage.vue'

// Composables (from source, will be auto-mocked by vi.mock)
import { useActivities } from '../../src/composables/useActivities'
import { useAuth } from '../../src/composables/useAuth'

// API client (from source, will be auto-mocked by vi.mock)
import { api } from '../../src/api/client'

// Types
import type { Activity } from '../../src/types/activity'
```

---

## When Reviewing Test Code

Do NOT flag these as issues — they are **intentional conventions**:

| Do NOT suggest | Why it's intentional |
|----------------|---------------------|
| Extracting repeated setup to `beforeEach` | Tests must be self-contained — no shared state |
| Extracting inline test *data* to a factory | Test data is inline by design; only dependency *mocks* use factories, in `__mocks__` |
| `describe.each` for similar tests | Fully written-out tests preferred over parameterized suites |
| Reducing "duplication" across tests | Readability and independence over DRY |

**DO flag** these legitimate issues:

- Always-true assertions (e.g. asserting on something that can never fail)
- `wrapper.vm` access (testing internals instead of rendered output)
- Missing coverage for user-visible behavior
- Incorrect mock shapes (e.g. plain value where `ref()` is needed)
- Testing implementation details (method calls, internal state)

---

## Quality Checklist

Before finalizing tests:

- [ ] File wrapped in one outer `describe` named for the module
- [ ] All `it()` descriptions start with "should"
- [ ] Test names describe user requirements, not implementation
- [ ] 3-6 tests per component/composable
- [ ] No tests for "renders X" or "calls Y"
- [ ] Tests would survive a refactor
- [ ] AAA comments in every test
- [ ] `npm run test:unit` passes
- [ ] TypeScript compiles (`npm run type-check`)
