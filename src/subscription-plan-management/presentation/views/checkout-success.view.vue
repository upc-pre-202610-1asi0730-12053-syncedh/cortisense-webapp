<template><AuthLayout><main class="auth-card"><div class="card-header"><h2>{{ $t('pages.checkoutSuccess.title') }}</h2><p>{{ $t('pages.checkoutSuccess.subtitle') }}</p></div><RouterLink class="btn primary" to="/sign-in">{{ $t('auth.sign-in') }}</RouterLink></main></AuthLayout></template>
<script setup>import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'</script>
