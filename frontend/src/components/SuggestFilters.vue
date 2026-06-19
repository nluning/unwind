<template>
  <div
    ref="filterRef"
    class="fixed top-[18px] right-[70px] z-20"
  >
    <button
      class="uw-menu-btn"
      :style="
        isFiltering
          ? { background: 'var(--uw-primary)', color: 'var(--uw-primary-fg)' }
          : undefined
      "
      :aria-label="$t('filter.label')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <FilterIcon />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-[calc(100%+8px)] w-72 rounded-xl py-3 px-4 overflow-hidden backdrop-blur-[8px]"
      :style="{
        background: 'var(--uw-card, rgba(255,255,255,0.95))',
        boxShadow: '0 10px 30px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)',
      }"
    >
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-uw-ink">{{ $t('filter.title') }}</p>
        <TextButton v-if="isFiltering" @click="clearFilters">
          {{ $t('filter.clear') }}
        </TextButton>
      </div>

      <section class="mt-4">
        <p class="text-xs text-uw-ink-mute mb-2">{{ $t('filter.stress') }}</p>
        <StressLevelPicker v-model="stressLevel" clearable font="sans" />
      </section>

      <section class="mt-5">
        <p class="text-xs text-uw-ink-mute mb-2">{{ $t('filter.categories') }}</p>
        <div class="flex flex-wrap gap-2">
          <ToggleButton
            v-for="category in categories"
            :key="category"
            size="sm"
            :selected="selectedCategories.includes(category)"
            @click="toggleCategory(category)"
          >
            {{ $t(`categories.${category}`) }}
          </ToggleButton>
        </div>
      </section>

      <div class="mt-5 flex justify-end">
        <TextButton @click="open = false">{{ $t('filter.done') }}</TextButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { CATEGORY_ID_MAP } from '../composables/useActivities.js'
import {
  suggestFilterStressState,
  suggestFilterCategoriesState,
} from '../composables/useSuggestionFlow.js'
import StressLevelPicker from './StressLevelPicker.vue'
import ToggleButton from './ToggleButton.vue'
import TextButton from './TextButton.vue'
import FilterIcon from './icons/FilterIcon.vue'

const categories = Object.keys(CATEGORY_ID_MAP)

const stressLevel = suggestFilterStressState
const selectedCategories = suggestFilterCategoriesState

const isFiltering = computed(
  () => stressLevel.value !== null || selectedCategories.value.length > 0
)

const open = ref(false)
const filterRef = ref<HTMLElement | null>(null)

function toggleCategory(category: string) {
  if (selectedCategories.value.includes(category)) {
    selectedCategories.value = selectedCategories.value.filter(
      (entry) => entry !== category
    )
  } else {
    selectedCategories.value = [...selectedCategories.value, category]
  }
}

function clearFilters() {
  stressLevel.value = null
  selectedCategories.value = []
}

function handleClickOutside(event: MouseEvent) {
  if (filterRef.value && !filterRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
