<template>
  <div class="auth-shell">
    <section class="brand-panel">
      <div class="brand-content">
        <div class="brand">
          <img src="/logo.svg" alt="CortiSense logo">
          <span>CortiSense</span>
        </div>
        <div class="brand-copy">
          <h1>{{ $t('auth.brand-title') }}</h1>
          <p>{{ $t('auth.brand-description') }}</p>
        </div>
        <div class="demo-card">
          <p class="demo-title">{{ $t('auth.demo-title') }}</p>
          <div class="demo-row"><strong>Admin</strong><span>{{ $t('auth.demoAdmin') }}</span></div>
          <div class="demo-row"><strong>Supervisor</strong><span>{{ $t('auth.demoSupervisor') }}</span></div>
          <div class="demo-row"><strong>Doctor</strong><span>{{ $t('auth.demoDoctor') }}</span></div>
        </div>
      </div>
    </section>

    <section class="form-panel">
      <div class="language-switcher-wrapper">
        <LanguageSwitcher />
      </div>
      <div class="form-content">
        <slot />
      </div>
    </section>
  </div>
</template>

<script setup>
import LanguageSwitcher from './language-switcher.vue'
</script>
