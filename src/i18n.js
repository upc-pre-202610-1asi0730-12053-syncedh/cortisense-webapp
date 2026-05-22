/**
 * @file i18n.js
 * @description Configuración de Vue I18n para CortiSense.
 * Soporta español (es) e inglés (en).
 * El idioma persiste en localStorage bajo la clave 'cortisense_locale'.
 */

import { createI18n } from 'vue-i18n'
import es from './locales/es.json'
import en from './locales/en.json'

const supportedLocales = ['es', 'en']
const savedLocale = localStorage.getItem('cortisense_locale')
const initialLocale = supportedLocales.includes(savedLocale) ? savedLocale : 'es'

/** @type {import('vue-i18n').I18n} */
const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  // Evita que una pantalla en inglés caiga a textos en español si falta una llave.
  fallbackLocale: {
    es: ['en'],
    en: ['en'],
    default: ['en']
  },
  messages: { es, en },
  warnHtmlMessage: false,
  missingWarn: false,
  fallbackWarn: false
})

document.documentElement.setAttribute('lang', initialLocale)

export default i18n
