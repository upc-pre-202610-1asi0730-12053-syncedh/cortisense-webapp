<!--
  @file medical-staff-shifts.view.vue
  @description Mis Turnos — calendario de guardias con estado y horas trabajadas.
  Bounded context: shift-coordination
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('shifts.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('shifts.subtitle') }}</p>
    </div>

    <!-- KPIs -->
    <div class="cs-kpi-grid" style="grid-template-columns:repeat(3,1fr);">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">📅</div>
        <div class="cs-kpi-label">{{ $t('shifts.thisMonth') }}</div>
        <div class="cs-kpi-value primary">{{ shifts.length }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⏱️</div>
        <div class="cs-kpi-label">{{ $t('shifts.workedHours') }}</div>
        <div class="cs-kpi-value">{{ totalHours }}h</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🌙</div>
        <div class="cs-kpi-label">{{ $t('shifts.nightShifts') }}</div>
        <div class="cs-kpi-value warning">{{ nightShifts }}</div>
      </div>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="filters-bar">
        <select class="filter-select" v-model="filterType">
          <option value="">{{ $t('shifts.allShifts') }}</option>
          <option value="morning">{{ $t('shifts.types.morning') }}</option>
          <option value="afternoon">{{ $t('shifts.types.afternoon') }}</option>
          <option value="night">{{ $t('shifts.types.night') }}</option>
        </select>
        <select class="filter-select" v-model="filterStatus">
          <option value="">{{ $t('shifts.allStatuses') }}</option>
          <option value="active">{{ $t('shifts.status.active') }}</option>
          <option value="scheduled">{{ $t('shifts.status.scheduled') }}</option>
          <option value="completed">{{ $t('shifts.status.completed') }}</option>
        </select>
      </div>

      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ $t('shifts.date') }}</th>
              <th>{{ $t('shifts.type') }}</th>
              <th>{{ $t('shifts.startTime') }}</th>
              <th>{{ $t('shifts.endTime') }}</th>
              <th>{{ $t('shifts.area') }}</th>
              <th>{{ $t('shifts.hoursWorked') }}</th>
              <th>{{ $t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('shifts.noShifts') }}</td></tr>
            <tr v-for="shift in filtered" :key="shift.id">
              <td style="font-weight:600;">{{ formatDate(shift.date) }}</td>
              <td>
                <span class="shift-type-badge" :class="`shift-${shift.type}`">
                  {{ shiftTypeIcon(shift.type) }} {{ $t(`shifts.types.${shift.type}`) }}
                </span>
              </td>
              <td>{{ shift.startTime }}</td>
              <td>{{ shift.endTime }}</td>
              <td>{{ areaLabel(shift.area) }}</td>
              <td style="font-weight:700;">{{ shift.hoursWorked }}h</td>
              <td>
                <span class="cs-badge" :class="shiftStatusBadge(shift.status)">
                  {{ $t(`shifts.status.${shift.status}`) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { http } from '../../../shared/infrastructure/http.js'

const { t, locale } = useI18n({ useScope: 'global' })
const authStore    = useAuthStore()
const shifts       = ref([])
const loading      = ref(true)
const filterType   = ref('')
const filterStatus = ref('')

const totalHours = computed(() => shifts.value.reduce((sum, s) => sum + (s.hoursWorked || 0), 0))
const nightShifts = computed(() => shifts.value.filter(s => s.type === 'night').length)

const filtered = computed(() => shifts.value.filter(s =>
  (!filterType.value   || s.type   === filterType.value) &&
  (!filterStatus.value || s.status === filterStatus.value)
))

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area

function shiftTypeIcon (type) {
  return { morning: '🌅', afternoon: '🌤️', night: '🌙' }[type] || '📋'
}

function shiftStatusBadge (status) {
  return { active: 'cs-badge-active', scheduled: 'cs-badge-info', completed: 'cs-badge-resolved' }[status] || 'cs-badge-inactive'
}

onMounted(async () => {
  try {
    const sRes = await http.get(import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH)
    const currentUserId = authStore._userResource?.id
    const currentStaffId = authStore._userResource?.medicalStaffId
    const profile = sRes.data.find(s => s.id === currentStaffId || s.userId === currentUserId) || null
    if (profile?.id) {
      const res = await http.get(`${import.meta.env.VITE_SHIFTS_ENDPOINT_PATH}?medicalStaffId=${profile.id}`)
      shifts.value = res.data.sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  } finally { loading.value = false }
})
</script>

<style scoped>
.shift-type-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
}
.shift-morning  { background: #FFF9C4; color: #B45309; }
.shift-afternoon{ background: #FEF3C7; color: #92400E; }
.shift-night    { background: #EDE9FE; color: #5B21B6; }
</style>
