<script setup lang="ts">
import { onMounted, ref } from 'vue';

const healthStatus = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/health')
    const data = await response.json()
    healthStatus.value = data.status === 'ok' ? 'health.success' : 'health.error'
  } catch {
    healthStatus.value = 'health.error'
  }
})

</script>

<template>
  <header>
     <div class="wrapper">
        <h1>{{ $t('app.title') }}</h1>
        <p>{{ $t(healthStatus ?? 'health.loading') }}</p>
    </div>
  </header>

</template>

<style scoped>
header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
