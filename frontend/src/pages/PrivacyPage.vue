<template>
  <main class="flex flex-col px-4 py-8 max-w-xl mx-auto gap-6">
    <h1>{{ $t('privacy.heading') }}</h1>

    <section class="flex flex-col gap-3 text-sm text-dim leading-relaxed">
      <h2 class="text-base text-primary">{{ $t('privacy.whatWeStoreHeading') }}</h2>
      <p>{{ $t('privacy.whatWeStore') }}</p>
      <ul class="list-disc pl-5 flex flex-col gap-1">
        <li>{{ $t('privacy.storeAccount') }}</li>
        <li>{{ $t('privacy.storeActivities') }}</li>
        <li>{{ $t('privacy.storeUsage') }}</li>
        <li>{{ $t('privacy.storeMemories') }}</li>
      </ul>
    </section>

    <section class="flex flex-col gap-3 text-sm text-dim leading-relaxed">
      <h2 class="text-base text-primary">{{ $t('privacy.aiHeading') }}</h2>
      <p>{{ $t('privacy.aiExplanation') }}</p>
      <ul class="list-disc pl-5 flex flex-col gap-1">
        <li>{{ $t('privacy.aiMessages') }}</li>
        <li>{{ $t('privacy.aiMemories') }}</li>
        <li>{{ $t('privacy.aiStress') }}</li>
      </ul>
      <p>{{ $t('privacy.aiNoTraining') }}</p>
    </section>

    <section class="flex flex-col gap-3 text-sm text-dim leading-relaxed">
      <h2 class="text-base text-primary">{{ $t('privacy.controlHeading') }}</h2>
      <p>{{ $t('privacy.controlExplanation') }}</p>
      <ul class="list-disc pl-5 flex flex-col gap-1">
        <li>{{ $t('privacy.controlMemoriesOff') }}</li>
        <li>{{ $t('privacy.controlDeleteMemories') }}</li>
        <li>{{ $t('privacy.controlDeleteAccount') }}</li>
      </ul>
    </section>

    <section class="flex flex-col gap-3 text-sm text-dim leading-relaxed">
      <h2 class="text-base text-primary">{{ $t('privacy.chatDataHeading') }}</h2>
      <p>{{ $t('privacy.chatDataExplanation') }}</p>
    </section>

    <section class="flex flex-col gap-3 text-sm text-dim leading-relaxed">
      <h2 class="text-base text-primary">{{ $t('privacy.contactHeading') }}</h2>
      <p>{{ $t('privacy.contactExplanation') }}</p>
    </section>

    <router-link
      to="/login"
      class="text-sm text-muted hover:text-primary transition-colors no-underline"
    >
      &larr; {{ $t('privacy.back') }}
    </router-link>
  </main>
</template>
