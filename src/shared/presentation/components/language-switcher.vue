<template>
  <div class="language-switcher">
    <button type="button" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
    <button type="button" :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { locale } = useI18n({ useScope: 'global' })
function setLocale (value) {
  locale.value = value
  localStorage.setItem('cortisense_locale', value)
}
</script>
