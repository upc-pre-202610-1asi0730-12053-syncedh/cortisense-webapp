/**
 * @file main.js
 * @description Punto de entrada principal de CortiSense.
 * Registra PrimeVue v4 con preset Aura personalizado,
 * PrimeIcons, Pinia, Vue Router y Vue I18n.
 */

import { createApp } from 'vue'
import App from './app.vue'

// ── Estilos ──────────────────────────────────────────────
import './style.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

// ── PrimeVue v4 ───────────────────────────────────────────
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

// ── PrimeVue Components (Global Registration) ─────────────
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Breadcrumb from 'primevue/breadcrumb'
import Menu from 'primevue/menu'
import Avatar from 'primevue/avatar'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'


// ── Instancias ────────────────────────────────────────────
import pinia from './pinia.js'
import router from './router.js'
import i18n from './i18n.js'

// ── Preset personalizado CortiSense ────────────────────────
const CortiSensePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#f0fffe',
      100: '#ccfffe',
      200: '#99fff6',
      300: '#68eae8',
      400: '#41eff2',
      500: '#45dde5',
      600: '#2bbfc8',
      700: '#1e99a3',
      800: '#167580',
      900: '#0e2433',
      950: '#091722'
    },
    colorScheme: {
      light: {
        primary: {
          color:           '#45DDE5',
          inverseColor:    '#0E2433',
          hoverColor:      '#68EAE8',
          activeColor:     '#41EFF2'
        },
        surface: {
          0:   '#ffffff',
          50:  '#EDFFFB',
          100: '#e0fdf9',
          200: '#D9D9D9',
          900: '#0E2433',
          950: '#091722'
        }
      }
    }
  }
})

const app = createApp(App)

// Plugins
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: CortiSensePreset,
    options: {
      prefix: 'p',
      darkModeSelector: '.cs-dark-mode',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

// ── Registro global de componentes PrimeVue ───────────────
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Select', Select)
app.component('Textarea', Textarea)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Tag', Tag)
app.component('Card', Card)
app.component('Dialog', Dialog)
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Badge', Badge)
app.component('Chip', Chip)
app.component('Divider', Divider)
app.component('Message', Message)
app.component('ProgressBar', ProgressBar)
app.component('Skeleton', Skeleton)
app.component('Breadcrumb', Breadcrumb)
app.component('Menu', Menu)
app.component('Avatar', Avatar)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)

app.mount('#app')

