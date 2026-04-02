<template>
  <div class="activity-card">
    <h2 class="activity-title">{{ $t(`activities.${slug}.title`, activity.title) }}</h2>

    <p v-if="activity.description" class="activity-description">
      {{ $t(`activities.${slug}.description`, activity.description) }}
    </p>

    <div class="activity-meta">
      <span class="chip">
        {{ $t('activity.duration', { minutes: activity.suggested_duration }) }}
      </span>
      <span v-for="cat in activity.categories" :key="cat" class="chip">
        {{ $t(`categories.${cat}`, cat) }}
      </span>
    </div>

    <div class="activity-actions">
      <button class="btn-accept" @click="$emit('accept')">
        {{ $t('activity.accept') }}
      </button>
      <button class="btn-skip" @click="$emit('skip')">
        {{ $t('activity.skip') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '../types/activity.js'

const props = defineProps<{
  activity: Activity
}>()

defineEmits<{
  accept: []
  skip: []
}>()

const slug = computed(() =>
  props.activity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
)
</script>

<style scoped>
.activity-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 24rem;
  width: 100%;
}

.activity-title {
  font-size: 1.25rem;
  margin: 0;
}

.activity-description {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.chip {
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  border-radius: 1rem;
  font-size: 0.8rem;
  color: #555;
}

.activity-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-accept,
.btn-skip {
  flex: 1;
  padding: 0.875rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
}

.btn-accept {
  background: #2c6e49;
  color: white;
}

.btn-skip {
  background: transparent;
  border: 1px solid #ccc;
  color: #555;
}
</style>
