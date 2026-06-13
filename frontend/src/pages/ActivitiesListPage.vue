<template>
  <PageShell>
      <PageHeader />

      <p class="uw-prompt">{{ $t('activitiesList.heading') }}</p>

      <StateLoading v-if="!loaded && !error" />

      <StateError v-else-if="error" @retry="fetchActivities()" />

      <StateMessage v-else-if="activities.length === 0">
        {{ $t('activitiesList.empty') }}
        <template #action>
          <button class="uw-actions__primary" @click="goToCreate">
            {{ $t('activitiesList.newButton') }}
          </button>
        </template>
      </StateMessage>

      <!-- List -->
      <template v-else>
        <div class="flex justify-end px-6 mt-2">
          <button class="uw-text-button" @click="goToCreate">
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
                {{ titleFor(activity) }}
              </h3>
            </div>

            <p
              v-if="activity.description"
              class="text-sm text-uw-ink-soft"
            >
              {{ descriptionFor(activity) }}
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
                @click="goToEdit(activity.id)"
              >
                {{ $t('activitiesList.editButton') }}
              </button>

              <ConfirmDeleteButton
                class="uw-text-button text-sm"
                :label="$t('activitiesList.deleteButton')"
                :confirm-label="$t('activitiesList.deleteConfirm')"
                @confirm="handleDelete(activity.id)"
              />
            </div>
          </li>
        </ul>
      </template>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivities } from '../composables/useActivities.js'
import { useActivityTranslation } from '../composables/useActivityTranslation.js'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton.vue'

const router = useRouter()
const { titleFor, descriptionFor } = useActivityTranslation()

const {
  activities,
  loaded,
  error,
  fetchActivities,
  deleteActivity,
} = useActivities()

onMounted(async () => {
  if (!loaded.value) {
    await fetchActivities()
  }
})

// Create + edit live on their own routes (/activities/new, /activities/:id/edit)
// so navigating to/from them is a real route change — see plan 22 Chunk 4.
function goToCreate() {
  router.push('/activities/new')
}

function goToEdit(activityId: string) {
  router.push(`/activities/${activityId}/edit`)
}

async function handleDelete(activityId: string) {
  try {
    await deleteActivity(activityId)
  } catch {
    // Refetch to get the truth if the local patch was rolled back server-side.
    await fetchActivities()
  }
}
</script>
