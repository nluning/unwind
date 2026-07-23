<template>
  <PageShell>
    <PageHeader />

    <p class="uw-prompt">{{ $t(headingKey) }}</p>

    <StateLoading v-if="!ready" />

    <form
      v-else
      class="flex-1 flex flex-col gap-5 px-6 pb-6"
      @submit.prevent="handleSave"
    >
      <TextField
        v-model="form.title"
        :label="$t('activitiesList.form.title')"
        required
      />

      <TextField
        v-model="form.description"
        :label="$t('activitiesList.form.description')"
        multiline
      />

      <TextField
        v-model.number="form.suggested_duration"
        :label="$t('activitiesList.form.duration')"
        type="number"
        min="1"
        max="240"
        inputmode="numeric"
        required
      />

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
          <ToggleButton
            v-for="(categoryId, categoryName) in CATEGORY_ID_MAP"
            :key="categoryId"
            size="sm"
            :selected="form.category_ids.includes(categoryId)"
            @click="toggleCategory(categoryId)"
          >
            {{ $t(`categories.${categoryName}`) }}
          </ToggleButton>
        </div>
      </div>

      <p
        v-if="formError"
        class="text-sm"
        :style="{ color: 'var(--uw-danger, #b4412a)' }"
      >
        {{ $t(formError) }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-4">
        <button
          type="button"
          class="uw-text-button"
          :disabled="saving"
          @click="goToList"
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
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useActivities,
  CATEGORY_ID_MAP,
  type CreateActivityPayload,
} from '../composables/useActivities.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import TextField from '../components/TextField.vue'
import ToggleButton from '../components/ToggleButton.vue'
import StateLoading from '../components/StateLoading.vue'

const route = useRoute()
const router = useRouter()

const {
  activities,
  loaded,
  fetchActivities,
  createActivity,
  updateActivity,
} = useActivities()

// Edit mode when the route carries an :id param; create mode otherwise.
const activityId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : null
)
const headingKey = computed(() =>
  activityId.value ? 'activitiesList.editHeading' : 'activitiesList.newButton'
)

const ready = ref(false)
const saving = ref(false)
const formError = ref('')

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

  if (activityId.value) {
    const existing = activities.value.find((activity) => activity.id === activityId.value)
    if (!existing) {
      // Unknown id (stale link) — fall back to the list rather than show a blank form.
      router.replace('/activities')
      return
    }
    Object.assign(form, {
      title: existing.title,
      description: existing.description ?? '',
      suggested_duration: existing.suggested_duration,
      min_stress_level: existing.min_stress_level,
      max_stress_level: existing.max_stress_level,
      category_ids: existing.categories
        .map((categoryName) => CATEGORY_ID_MAP[categoryName])
        .filter((categoryId): categoryId is number => categoryId !== undefined),
    })
  }

  ready.value = true
})

function toggleCategory(categoryId: number) {
  const index = form.category_ids.indexOf(categoryId)
  if (index === -1) {
    form.category_ids.push(categoryId)
  } else {
    form.category_ids.splice(index, 1)
  }
}

function goToList() {
  router.push('/activities')
}

async function handleSave() {
  if (form.category_ids.length === 0) {
    formError.value = 'activitiesList.form.categoriesRequired'
    return
  }
  if (form.min_stress_level > form.max_stress_level) {
    formError.value = 'activitiesList.form.stressOrder'
    return
  }

  saving.value = true
  formError.value = ''
  try {
    if (activityId.value) {
      await updateActivity(activityId.value, { ...form })
    } else {
      await createActivity({ ...form })
    }
    goToList()
  } catch {
    formError.value = 'activitiesList.form.saveError'
  } finally {
    saving.value = false
  }
}
</script>
