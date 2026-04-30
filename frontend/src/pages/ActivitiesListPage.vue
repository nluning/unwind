<template>
  <PageShell>
      <PageHeader />

      <p class="uw-prompt">{{ $t('activitiesList.heading') }}</p>

      <!-- Loading -->
      <div
        v-if="!loaded && !error"
        class="flex-1 flex flex-col items-center justify-center gap-2"
      >
        <span class="spinner" />
        <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
          {{ $t('suggest.loading') }}
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
          {{ $t('suggest.error') }}
        </p>
        <LinkButton @click="fetchActivities()">
          {{ $t('suggest.retry') }}
        </LinkButton>
      </div>

      <!-- Form (create + edit share the same UI) -->
      <form
        v-else-if="editing"
        class="flex-1 flex flex-col gap-5 px-6 pb-6"
        @submit.prevent="handleSave"
      >
        <label class="flex flex-col gap-1.5">
          <span class="text-xs text-uw-ink-mute">
            {{ $t('activitiesList.form.title') }}
          </span>
          <input
            v-model="form.title"
            type="text"
            required
            class="uw-input"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs text-uw-ink-mute">
            {{ $t('activitiesList.form.description') }}
          </span>
          <textarea
            v-model="form.description"
            rows="3"
            class="uw-input resize-none"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs text-uw-ink-mute">
            {{ $t('activitiesList.form.duration') }}
          </span>
          <input
            v-model.number="form.suggested_duration"
            type="number"
            min="1"
            max="240"
            inputmode="numeric"
            required
            class="uw-input"
          />
        </label>

        <div class="flex flex-col gap-1.5">
          <span class="text-xs text-uw-ink-mute">
            {{ $t('activitiesList.form.stressRange') }}
          </span>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.min_stress_level"
              type="number"
              min="1"
              max="5"
              inputmode="numeric"
              required
              class="uw-input w-20"
            />
            <span class="text-uw-ink-mute">–</span>
            <input
              v-model.number="form.max_stress_level"
              type="number"
              min="1"
              max="5"
              inputmode="numeric"
              required
              class="uw-input w-20"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <span class="text-xs text-uw-ink-mute">
            {{ $t('activitiesList.form.categories') }}
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(categoryId, categoryName) in CATEGORY_ID_MAP"
              :key="categoryId"
              type="button"
              class="px-3.5 py-2 rounded-full border border-uw-border bg-transparent text-uw-ink text-sm cursor-pointer transition-colors"
              :class="{
                'bg-uw-primary text-uw-primary-fg border-transparent':
                  form.category_ids.includes(categoryId),
              }"
              @click="toggleCategory(categoryId)"
            >
              {{ $t(`categories.${categoryName}`) }}
            </button>
          </div>
        </div>

        <p
          v-if="formError"
          class="text-sm"
          :style="{ color: 'var(--uw-danger, #b4412a)' }"
        >
          {{ formError }}
        </p>

        <div class="mt-auto flex items-center justify-between gap-4">
          <button
            type="button"
            class="uw-text-button"
            :disabled="saving"
            @click="cancelEditing"
          >
            {{ $t('activitiesList.cancelButton') }}
          </button>
          <button
            type="submit"
            class="uw-actions__primary"
            :disabled="saving"
          >
            {{ saving ? $t('suggest.loading') : $t('activitiesList.saveButton') }}
          </button>
        </div>
      </form>

      <!-- Empty state -->
      <div
        v-else-if="activities.length === 0"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p class="text-sm" :style="{ color: 'var(--uw-ink-mute)' }">
          {{ $t('activitiesList.empty') }}
        </p>
        <button class="uw-actions__primary" @click="startCreating">
          {{ $t('activitiesList.newButton') }}
        </button>
      </div>

      <!-- List -->
      <template v-else>
        <div class="flex justify-end px-6 mt-2">
          <button class="uw-text-button" @click="startCreating">
            + {{ $t('activitiesList.newButton') }}
          </button>
        </div>

        <ul class="flex flex-col gap-3 px-6 pb-6 mt-4">
          <li
            v-for="activity in activities"
            :key="activity.id"
            class="rounded-xl border border-uw-border-soft bg-uw-chip p-4 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-serif text-lg text-uw-ink leading-snug">
                {{ $t(`activities.${slugFor(activity)}.title`, activity.title) }}
              </h3>
            </div>

            <p
              v-if="activity.description"
              class="text-sm text-uw-ink-soft"
            >
              {{ $t(`activities.${slugFor(activity)}.description`, activity.description) }}
            </p>

            <div class="uw-chips">
              <span class="uw-chip">
                {{ $t('activity.duration', { minutes: activity.suggested_duration }) }}
              </span>
              <span
                v-for="categoryName in activity.categories"
                :key="categoryName"
                class="uw-chip"
              >
                {{ $t(`categories.${categoryName}`, categoryName) }}
              </span>
              <span class="uw-chip">
                {{ $t('activitiesList.stressRangeLabel', {
                  min: activity.min_stress_level,
                  max: activity.max_stress_level,
                }) }}
              </span>
            </div>

            <div class="flex items-center justify-end gap-4 mt-1">
              <button
                v-if="activity.source !== 'base'"
                class="uw-text-button text-sm"
                @click="startEditing(activity)"
              >
                {{ $t('activitiesList.editButton') }}
              </button>

              <button
                v-if="confirmingDeleteId !== activity.id"
                class="uw-text-button text-sm"
                :style="{ color: 'var(--uw-ink-mute)' }"
                @click="confirmingDeleteId = activity.id"
              >
                {{ $t('activitiesList.deleteButton') }}
              </button>
              <button
                v-else
                class="uw-text-button text-sm font-semibold"
                :style="{ color: 'var(--uw-danger, #b4412a)' }"
                @click="handleDelete(activity.id)"
              >
                {{ $t('activitiesList.deleteConfirm') }}
              </button>
            </div>
          </li>
        </ul>
      </template>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useActivities,
  CATEGORY_ID_MAP,
  type Activity,
  type CreateActivityPayload,
} from '../composables/useActivities.js'
import LinkButton from '../components/LinkButton.vue'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'

const { t } = useI18n()

const {
  activities,
  loaded,
  error,
  fetchActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} = useActivities()

const editing = ref<false | 'new' | string>(false)
const saving = ref(false)
const formError = ref('')
const confirmingDeleteId = ref<string | null>(null)

const emptyForm = (): CreateActivityPayload => ({
  title: '',
  description: '',
  suggested_duration: 15,
  min_stress_level: 1,
  max_stress_level: 5,
  category_ids: [],
})

const form = reactive<CreateActivityPayload>(emptyForm())

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})

function slugFor(activity: Activity): string {
  return activity.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function resetForm(values: CreateActivityPayload = emptyForm()) {
  Object.assign(form, values)
  formError.value = ''
}

function startCreating() {
  resetForm()
  editing.value = 'new'
}

function startEditing(activity: Activity) {
  resetForm({
    title: activity.title,
    description: activity.description ?? '',
    suggested_duration: activity.suggested_duration,
    min_stress_level: activity.min_stress_level,
    max_stress_level: activity.max_stress_level,
    category_ids: activity.categories
      .map((categoryName) => CATEGORY_ID_MAP[categoryName])
      .filter((categoryId): categoryId is number => categoryId !== undefined),
  })
  editing.value = activity.id
}

function cancelEditing() {
  editing.value = false
  resetForm()
}

function toggleCategory(categoryId: number) {
  const index = form.category_ids.indexOf(categoryId)
  if (index === -1) {
    form.category_ids.push(categoryId)
  } else {
    form.category_ids.splice(index, 1)
  }
}

async function handleSave() {
  if (form.category_ids.length === 0) {
    formError.value = t('activitiesList.form.categoriesRequired')
    return
  }
  if (form.min_stress_level > form.max_stress_level) {
    formError.value = t('activitiesList.form.stressOrder')
    return
  }

  saving.value = true
  formError.value = ''
  try {
    if (editing.value === 'new') {
      await createActivity({ ...form })
    } else if (typeof editing.value === 'string') {
      await updateActivity(editing.value, { ...form })
    }
    editing.value = false
    resetForm()
  } catch {
    formError.value = t('activitiesList.form.saveError')
  } finally {
    saving.value = false
  }
}

async function handleDelete(activityId: string) {
  confirmingDeleteId.value = null
  try {
    await deleteActivity(activityId)
  } catch {
    // Refetch to get the truth if the local patch was rolled back server-side.
    await fetchActivities()
  }
}
</script>

<style scoped>
.uw-input {
  background: var(--uw-card, rgba(255, 255, 255, 0.6));
  border: 1px solid var(--uw-border-soft);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 15px;
  color: var(--uw-ink);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}

.uw-input:focus {
  border-color: var(--uw-primary);
}

</style>
