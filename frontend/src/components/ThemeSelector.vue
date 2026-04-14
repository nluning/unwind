<template>
  <div class="flex items-center gap-3">
    <div class="flex gap-2">
      <button
        v-for="preset in schemes"
        :key="preset.name"
        class="w-6 h-6 rounded-full cursor-pointer border-2 transition-opacity"
        :class="colorScheme === preset.name ? 'border-white ring-2' : 'border-transparent opacity-60 hover:opacity-100'"
        :style="{ backgroundColor: preset.swatch, '--un-ring-color': preset.swatch }"
        :aria-label="$t(`theme.${preset.name}`)"
        :aria-pressed="colorScheme === preset.name"
        @click="setColorScheme(preset.name)"
      />
    </div>

    <button
      class="w-6 h-6 rounded-full cursor-pointer border-2 transition-colors"
      :style="{
        backgroundColor: mode === 'dark' ? '#1a1a1a' : '#f0f0f0',
        borderColor: mode === 'dark' ? '#444' : '#ccc',
      }"
      :aria-label="$t(`theme.${mode}`)"
      @click="toggleMode"
    />
  </div>
</template>

<script setup lang="ts">
import { useTheme, type ColorScheme } from '../composables/useTheme.js'

const { colorScheme, mode, setColorScheme, toggleMode } = useTheme()

const schemes: { name: ColorScheme; swatch: string }[] = [
  { name: 'calm', swatch: '#4ecca3' },
  { name: 'warm', swatch: '#e07050' },
  { name: 'playful', swatch: '#3b8eff' },
]
</script>
