<template>
  <PageShell>
    <PageHeader />

    <h1 class="uw-title">{{ $t('stats.heading') }}</h1>

    <StateLoading v-if="!stats && !error" />

    <StateError v-else-if="error" @retry="fetchStats()">
      {{ $t('stats.error') }}
    </StateError>

    <StateMessage v-else-if="groups.length === 0">
      {{ $t('stats.empty') }}
    </StateMessage>

    <div v-else class="flex flex-col gap-8 px-6 pb-8 mt-6">
      <section
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-3"
        :data-test="`group-${group.key}`"
      >
        <h2 class="font-serif text-lg text-uw-ink m-0">{{ $t(`stats.${group.key}`) }}</h2>

        <ul class="list-none p-0 m-0 flex flex-col gap-2">
          <li
            v-for="activity in visibleActivities(group)"
            :key="activity.id"
            class="uw-stat-row"
            data-test="activity-row"
          >
            <span class="font-serif text-base text-uw-ink">{{ titleFor(activity) }}</span>

            <!-- The same signs as the question, one per answer that happened. The
                 count is for sighted users; screen readers get the full phrase. -->
            <span class="flex items-center gap-3 shrink-0">
              <span
                v-for="part in outcomeParts(activity)"
                :key="part.outcome"
                class="inline-flex items-center gap-1 text-sm font-medium"
                :class="`uw-sign--${part.outcome}`"
              >
                <component :is="feedbackSigns[part.outcome]" :size="20" />
                <span aria-hidden="true">{{ part.count }}</span>
                <span class="sr-only">
                  {{ $t('stats.count', { n: part.count, outcome: $t(`stats.outcomes.${part.outcome}`) }) }}
                </span>
              </span>
            </span>
          </li>
        </ul>

        <button
          v-if="group.activities.length > COLLAPSED_COUNT"
          type="button"
          class="uw-text-button self-start"
          :aria-expanded="expanded[group.key]"
          :data-test="`toggle-${group.key}`"
          @click="expanded[group.key] = !expanded[group.key]"
        >
          {{ $t(expanded[group.key] ? 'stats.showLess' : 'stats.showMore') }}
        </button>
      </section>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useStats, type ActivityStats, type OutcomeCounts } from '../composables/useStats.js'
import { useActivityTranslation } from '../composables/useActivityTranslation.js'
import { feedbackSigns, feedbackOutcomesLeftToRight } from '../components/feedbackSigns.js'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'
import StateLoading from '../components/StateLoading.vue'
import StateError from '../components/StateError.vue'
import StateMessage from '../components/StateMessage.vue'

const { stats, error, best, worst, fetchStats } = useStats()
const { titleFor } = useActivityTranslation()

// Only the groups that have something in them.
const groups = computed(() =>
  [
    { key: 'best' as const, activities: best.value },
    { key: 'worst' as const, activities: worst.value },
  ].filter((group) => group.activities.length > 0),
)

// Each list shows its top few by default; the rest sits behind "Meer laten zien".
const COLLAPSED_COUNT = 3
const expanded = reactive({ best: false, worst: false })

function visibleActivities(group: { key: 'best' | 'worst'; activities: ActivityStats[] }) {
  return expanded[group.key] ? group.activities : group.activities.slice(0, COLLAPSED_COUNT)
}

// Only the answers that actually happened, in the same left-to-right order as
// the question, so a row never lists a zero.
function outcomeParts(counts: OutcomeCounts) {
  return feedbackOutcomesLeftToRight
    .filter((outcome) => counts[outcome] > 0)
    .map((outcome) => ({ outcome, count: counts[outcome] }))
}

onMounted(fetchStats)
</script>
