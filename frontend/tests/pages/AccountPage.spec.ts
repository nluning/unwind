import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AccountPage from '../../src/pages/AccountPage.vue'
import ConfirmDeleteButton from '../../src/components/ConfirmDeleteButton.vue'
import { useAuth } from '../../src/composables/useAuth'
import { useMemories, type Memory } from '../../src/composables/useMemories'

vi.mock('../../src/composables/useAuth')
vi.mock('../../src/composables/useMemories')
vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

interface AccountUser {
  id: string
  email: string | null
  onboarding_completed_at: string | null
  memory_enabled: boolean
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  const mocked = {
    user: ref<AccountUser | null>({
      id: '1',
      email: null,
      onboarding_completed_at: '2026-01-01',
      memory_enabled: false,
    }),
    isLoggedIn: ref(true),
    isAnonymous: ref(true),
    needsOnboarding: ref(false),
    initialize: vi.fn(async () => {}),
    fetchMe: vi.fn(async () => {}),
    login: vi.fn(async () => {}),
    register: vi.fn(async () => {}),
    deviceLogin: vi.fn(async () => {}),
    upgrade: vi.fn(async () => {}),
    setMemoryEnabled: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    deleteAccount: vi.fn(async () => {}),
    ...overrides,
  }
  vi.mocked(useAuth).mockReturnValue(mocked as unknown as ReturnType<typeof useAuth>)
  return mocked
}

function mockMemories(overrides: Partial<ReturnType<typeof useMemories>> = {}) {
  const mocked = {
    memories: ref<Memory[]>([]),
    loaded: ref(true),
    error: ref(false),
    fetchMemories: vi.fn(async () => {}),
    addMemory: vi.fn(async () => ({}) as Memory),
    deleteMemory: vi.fn(async () => {}),
    ...overrides,
  }
  vi.mocked(useMemories).mockReturnValue(mocked)
  return mocked
}

// PageShell has no script — just a slot — so shallowMount stubs it into an
// empty tag unless the default slot is forced to render.
function mountPage() {
  return shallowMount(AccountPage, { global: { renderStubDefaultSlot: true } })
}

describe('AccountPage', () => {
  it('should prompt an anonymous user to create an account', async () => {
    // Arrange
    mockAuth()
    mockMemories()
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(push).toHaveBeenCalledWith('/login?mode=upgrade')
  })

  it("should show the user's email once they have an account", () => {
    // Arrange
    mockAuth({
      user: ref({
        id: '1',
        email: 'noor@example.com',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: false,
      }),
    })
    mockMemories()

    // Act
    const wrapper = mountPage()

    // Assert
    expect(wrapper.text()).toContain('noor@example.com')
  })

  it('should require a second confirmation before disabling memory', async () => {
    // Arrange
    const setMemoryEnabled = vi.fn(async () => {})
    mockAuth({
      user: ref({
        id: '1',
        email: 'noor@example.com',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: true,
      }),
      setMemoryEnabled,
    })
    mockMemories()
    const wrapper = mountPage()

    // Act
    await wrapper.find('[role="switch"]').trigger('click')

    // Assert
    expect(setMemoryEnabled).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('account.memoryDisableWarning')

    // Act
    await wrapper.find('[data-test="memory-disable-confirm"]').trigger('click')

    // Assert
    expect(setMemoryEnabled).toHaveBeenCalledWith(false)
  })

  it('should let the user add a memory', async () => {
    // Arrange
    const addMemory = vi.fn(async () => ({}) as Memory)
    mockAuth({
      user: ref({
        id: '1',
        email: 'noor@example.com',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: true,
      }),
    })
    mockMemories({ addMemory })
    const wrapper = mountPage()

    // Act
    await wrapper.find('textarea').setValue('Houdt van rustige wandelingen')
    await wrapper.find('form').trigger('submit')

    // Assert
    expect(addMemory).toHaveBeenCalledWith('Houdt van rustige wandelingen')
  })

  it('should let the user delete a memory', async () => {
    // Arrange
    const deleteMemory = vi.fn(async () => {})
    mockAuth({
      user: ref({
        id: '1',
        email: 'noor@example.com',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: true,
      }),
    })
    mockMemories({
      memories: ref([
        { id: 'm1', fact: 'Houdt van wandelen', source: 'user_added', created_at: '', updated_at: '' },
      ]),
      deleteMemory,
    })
    const wrapper = mountPage()

    // Act
    await wrapper.findComponent(ConfirmDeleteButton).vm.$emit('confirm')

    // Assert
    expect(deleteMemory).toHaveBeenCalledWith('m1')
  })

  it('should log the user out and return to login', async () => {
    // Arrange
    const logout = vi.fn(async () => {})
    mockAuth({
      user: ref({
        id: '1',
        email: 'noor@example.com',
        onboarding_completed_at: '2026-01-01',
        memory_enabled: false,
      }),
      logout,
    })
    mockMemories()
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()

    // Act
    await wrapper.find('[data-test="logout"]').trigger('click')

    // Assert
    expect(logout).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith('/login')
  })

  it('should delete the account and return to login', async () => {
    // Arrange
    const deleteAccount = vi.fn(async () => {})
    mockAuth({ deleteAccount })
    mockMemories()
    const push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
    const wrapper = mountPage()

    // Act — mockMemories() defaults to an empty list, so this is the only
    // ConfirmDeleteButton on the page (the danger-zone one).
    await wrapper.findComponent(ConfirmDeleteButton).vm.$emit('confirm')

    // Assert
    expect(deleteAccount).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith('/login')
  })
})
