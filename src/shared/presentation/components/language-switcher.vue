<!--
  @file language-switcher.vue
  @description Componente para cambiar el idioma entre ES y EN.
  Persiste la selección en localStorage bajo 'cortisense_locale'.
-->
<template>
  <div class="cs-lang-switcher">
    <button
      class="cs-lang-btn"
      :class="{ active: locale === 'es' }"
      @click="setLocale('es')"
      aria-label="Español"
    >
      ES
    </button>
    <button
      class="cs-lang-btn"
      :class="{ active: locale === 'en' }"
      @click="setLocale('en')"
      aria-label="English"
    >
      EN
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })

/**
 * Cambia el idioma activo y lo persiste en localStorage.
 * @param {'es'|'en'} lang
 */
function setLocale (lang) {
  locale.value = lang
  localStorage.setItem('cortisense_locale', lang)
  document.documentElement.setAttribute('lang', lang)
}
</script>
