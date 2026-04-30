<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-2">
    <span class="spinner" />
    <p class="text-sm text-uw-ink-mute">
      <slot>{{ $t('suggest.loading') }}</slot>
    </p>
  </div>
</template>
