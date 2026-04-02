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
feature exist?" not "What does the code do?"

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
    // Arrange
    const activity = {
        title: 'Ga een rondje lopen',
        description: 'Geen bestemming, gewoon lopen.',
        suggested_duration: 15,
        categories: ['Hands'],
    }

    // Act
    const wrapper = shallowMount(ActivityCard, { props: { activity } })

    // Assert
    expect(wrapper.text()).toContain('Ga een rondje lopen')
    expect(wrapper.text()).toContain('15')
    expect(wrapper.text()).toContain('Handen')
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
- `shallowMount` by default — only use `mount` when testing slot content or
  child component interaction

---

## Mock Organization

Unwind has a simple architecture — keep mocks simple too. Two levels:

### 1. Setup file (shared mocks)

`frontend/tests/setup.ts` — global config and mocks used across all tests:

```typescript
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Stub router-link globally
config.global.stubs = {
    RouterLink: true,
}

// Mock the API client — almost every test needs this
vi.mock('../src/api/client', () => ({
    api: vi.fn(),
}))
```

### 2. Inline mocks (per test file)

Mock composables and modules at the top of each test file:

```typescript
vi.mock('../../src/composables/useActivities')
vi.mock('../../src/composables/useAuth')
```

**No `__mocks__` directories needed** — the codebase is small enough that
inline mocks are clear and maintainable.

### Mocking Composables

Composables return objects with refs and functions. Mock them by returning the
same shape:

```typescript
import { vi } from 'vitest'
import { ref, computed } from 'vue'

vi.mock('../../src/composables/useActivities', () => ({
    useActivities: () => ({
        activities: ref([]),
        loaded: ref(true),
        isEmpty: computed(() => false),
        fetchActivities: vi.fn(),
        filterByStress: vi.fn(() => []),
        filterByExcludedCategories: vi.fn(() => []),
        suggest: vi.fn(() => null),
        markAccepted: vi.fn(),
        resetSession: vi.fn(),
        createActivity: vi.fn(),
    }),
}))
```

### Mocking the API Client

```typescript
import { vi } from 'vitest'
import { api } from '../../src/api/client'

// In a test:
vi.mocked(api).mockResolvedValueOnce([{ id: '1', title: 'Walk' }])
```

---

## Best Practices

- **One Act/Assert per test** — split multiple interactions into separate tests
- **Always use explicit AAA comments** — `// Arrange`, `// Act`, `// Assert`
- **Clear mocks inline** — use `mockClear()` in Arrange, not in `beforeEach`
- **No shared test variables** — write everything inline per test (no
  `defaultProps`, factory functions, etc.)
- **No `wrapper.vm` access** — test rendered output, not internal state
- **Prefer `mockReturnValue` over `mockImplementation`** — use
  `mockImplementation` only when return value depends on arguments
- **No `flushPromises()` after awaited trigger** — the await is sufficient
- **Use specific values in assertions** — avoid `expect.stringContaining`
  when you can match exactly

---

## Test Structure

Every test uses AAA (Arrange-Act-Assert) with explicit comments:

```typescript
describe('ActivityCard', () => {
    it('should let parent handle accept action', () => {
        // Arrange
        const activity = {
            id: '1',
            title: 'Walk',
            description: null,
            suggested_duration: 15,
            min_stress_level: 1,
            max_stress_level: 5,
            source: 'base' as const,
            times_skipped: 0,
            categories: ['Hands'],
        }
        const wrapper = shallowMount(ActivityCard, { props: { activity } })

        // Act
        wrapper.find('.btn-accept').trigger('click')

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
    vi.mocked(useActivities).mockReturnValue({
        ...defaultActivitiesReturn,
        fetchActivities: mockFetch,
        loaded: ref(false),
    })

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

Mock the API client, not the composable:

```typescript
import { api } from '../../src/api/client'

vi.mock('../../src/api/client')

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
    expect(wrapper.findAll('.stress-btn')).toHaveLength(5)
})
```

### i18n in Tests

Mount with the i18n plugin or mock `$t`:

```typescript
import { createI18n } from 'vue-i18n'
import nl from '../../src/locales/nl.json'

const i18n = createI18n({
    locale: 'nl',
    messages: { nl },
})

const wrapper = shallowMount(Component, {
    global: { plugins: [i18n] },
})
```

Or for simpler tests, stub the translation:

```typescript
config.global.mocks = {
    $t: (key: string) => key,
}
```

---

## Common Assertions

```typescript
// Emitted events (for reusable components)
expect(wrapper.emitted('accept')).toHaveLength(1)
expect(wrapper.emitted('skip')).toHaveLength(1)

// Text content
expect(wrapper.text()).toContain('Geen activiteiten gevonden')

// Element existence
expect(wrapper.find('.activity-card').exists()).toBe(true)
expect(wrapper.find('.empty-state').exists()).toBe(false)

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
| Shared helpers or factory functions | Each test walks through all steps inline |
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

- [ ] All `it()` descriptions start with "should"
- [ ] Test names describe user requirements, not implementation
- [ ] 3-6 tests per component/composable
- [ ] No tests for "renders X" or "calls Y"
- [ ] Tests would survive a refactor
- [ ] AAA comments in every test
- [ ] `npm run test` passes (if frontend test script exists)
- [ ] TypeScript compiles (`npx vue-tsc --noEmit`)
