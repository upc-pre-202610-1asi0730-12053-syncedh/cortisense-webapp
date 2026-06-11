import { createApp } from 'vue'
import App from './app.vue'
import './style.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

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

import pinia from './pinia.js'
import router from './router.js'
import i18n from './i18n.js'
import { startStaticI18nSync } from './shared/infrastructure/static-i18n-sync.js'

const CortiSensePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fffe', 100: '#ccfffe', 200: '#95fffd', 300: '#68eae8', 400: '#41eff2',
      500: '#45dde5', 600: '#2bbfc8', 700: '#1e99a3', 800: '#167580', 900: '#0D1B2A', 950: '#091722'
    },
    colorScheme: {
      light: {
        primary: { color: '#45DDE5', inverseColor: '#0D1B2A', hoverColor: '#95FFFD', activeColor: '#2bbfc8' },
        surface: { 0: '#ffffff', 50: '#F4F7FA', 100: '#E8EEFD', 900: '#0D1B2A', 950: '#091722' }
      }
    }
  }
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(PrimeVue, { theme: { preset: CortiSensePreset, options: { darkModeSelector: '.cs-dark-mode', cssLayer: false } } })
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

Object.entries({ Button, InputText, Password, Select, Textarea, DataTable, Column, Tag, Card, Dialog, Toast, ConfirmDialog, Badge, Chip, Divider, Message, ProgressBar, Skeleton, Breadcrumb, Menu, Avatar, IconField, InputIcon }).forEach(([name, component]) => app.component(name, component))

app.mount('#app')
startStaticI18nSync(i18n, router)
