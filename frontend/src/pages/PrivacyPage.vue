<template>
  <PageShell>
    <PageHeader back @back="router.back()" />

    <main class="flex flex-col px-[26px] py-8 gap-6">
      <h1 class="font-serif text-2xl tracking-tight text-uw-ink m-0">
        {{ $t('privacy.heading') }}
      </h1>

      <section class="flex flex-col gap-3 text-sm text-uw-ink-soft leading-relaxed">
        <h2 class="text-base text-uw-ink m-0">{{ $t('privacy.whatWeStoreHeading') }}</h2>
        <p>{{ $t('privacy.whatWeStore') }}</p>
        <ul class="list-disc pl-5 flex flex-col gap-1">
          <li>{{ $t('privacy.storeAccount') }}</li>
          <li>{{ $t('privacy.storeActivities') }}</li>
          <li>{{ $t('privacy.storeUsage') }}</li>
          <li>{{ $t('privacy.storeMemories') }}</li>
        </ul>
      </section>

      <section class="flex flex-col gap-3 text-sm text-uw-ink-soft leading-relaxed">
        <h2 class="text-base text-uw-ink m-0">{{ $t('privacy.aiHeading') }}</h2>
        <p>{{ $t('privacy.aiExplanation') }}</p>
        <ul class="list-disc pl-5 flex flex-col gap-1">
          <li>{{ $t('privacy.aiMessages') }}</li>
          <li>{{ $t('privacy.aiMemories') }}</li>
          <li>{{ $t('privacy.aiStress') }}</li>
        </ul>
        <p>{{ $t('privacy.aiNoTraining') }}</p>
      </section>

      <section class="flex flex-col gap-3 text-sm text-uw-ink-soft leading-relaxed">
        <h2 class="text-base text-uw-ink m-0">{{ $t('privacy.controlHeading') }}</h2>
        <p>{{ $t('privacy.controlExplanation') }}</p>
        <ul class="list-disc pl-5 flex flex-col gap-1">
          <li>{{ $t('privacy.controlMemoriesOff') }}</li>
          <li>{{ $t('privacy.controlDeleteMemories') }}</li>
          <li>{{ $t('privacy.controlDeleteAccount') }}</li>
        </ul>
      </section>

      <section class="flex flex-col gap-3 text-sm text-uw-ink-soft leading-relaxed">
        <h2 class="text-base text-uw-ink m-0">{{ $t('privacy.chatDataHeading') }}</h2>
        <p>{{ $t('privacy.chatDataExplanation') }}</p>
      </section>

      <section class="flex flex-col gap-3 text-sm text-uw-ink-soft leading-relaxed">
        <h2 class="text-base text-uw-ink m-0">{{ $t('privacy.contactHeading') }}</h2>
        <p>{{ $t('privacy.contactExplanation') }}</p>
      </section>

      <router-link
        to="/login"
        class="text-sm text-uw-ink-mute hover:text-uw-ink transition-colors no-underline"
      >
        &larr; {{ $t('privacy.back') }}
      </router-link>
    </main>
  </PageShell>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageShell from '../components/PageShell.vue'
import PageHeader from '../components/PageHeader.vue'

const router = useRouter()
</script>
