<!--
  @file supervisor-anomalies.view.vue
  @description Anomalías biométricas detectadas — valores fuera de rango.
  Bounded context: clinical-risk
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('anomalies.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('anomalies.subtitle') }}</p>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="filters-bar">
        <input class="filter-input" v-model="search" :placeholder="$t('anomalies.searchPlaceholder')" />
        <select class="filter-select" v-model="filterField">
          <option value="">{{ $t('anomalies.allParameters') }}</option>
          <option value="heartRate">{{ $t('anomalies.heartRate') }}</option>
          <option value="hrv">HRV</option>
          <option value="cortisol">Cortisol</option>
          <option value="sleepHours">{{ $t('anomalies.sleepHours') }}</option>
          <option value="stressLevel">{{ $t('anomalies.stressLevel') }}</option>
        </select>
      </div>

      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr><th>{{ $t('anomalies.staff') }}</th><th>{{ $t('anomalies.parameter') }}</th><th>{{ $t('anomalies.value') }}</th><th>{{ $t('anomalies.normalRange') }}</th><th>{{ $t('anomalies.alert') }}</th><th>{{ $t('anomalies.registered') }}</th></tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('anomalies.noAnomalies') }}</td></tr>
            <tr v-for="row in filtered" :key="row.id + row.field">
              <td>
                <div class="user-cell">
                  <div class="cs-avatar" :style="{ background: '#F97316', width:'30px', height:'30px', fontSize:'11px' }">
                    {{ row.initials }}
                  </div>
                  <div class="user-cell-info">
                    <div class="name">{{ row.staffName }}</div>
                    <div class="sub">{{ areaLabel(row.area) }}</div>
                  </div>
                </div>
              </td>
              <td>{{ fieldLabel(row.field) }}</td>
              <td style="font-weight:700;" :style="{ color: row.isAnomaly ? '#EF4444' : 'inherit' }">{{ row.value }} {{ row.unit }}</td>
              <td style="font-size:12px;color:var(--text-muted);">{{ row.normalRange }}</td>
              <td>
                <span class="cs-badge cs-badge-critical" v-if="row.isAnomaly">{{ $t('anomalies.outOfRange') }}</span>
                <span class="cs-badge cs-badge-low" v-else>{{ $t('vitals.normal') }}</span>
              </td>
              <td style="font-size:12px;">{{ formatDate(row.recordedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { http } from '../../../shared/infrastructure/http.js'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

const biometrics = ref([])
const staffList  = ref([])
const loading    = ref(true)
const search     = ref('')
const filterField = ref('')

const fieldMeta = {
  heartRate:   { labelKey: 'anomalies.heartRate',   unit: 'bpm',    min: 60,  max: 100, range: '60–100 bpm' },
  hrv:         { labelKey: 'anomalies.hrv',         unit: 'ms',     min: 30,  max: 100, range: '30–100 ms' },
  cortisol:    { labelKey: 'anomalies.cortisol',    unit: 'nmol/L', min: 100, max: 600, range: '100–600 nmol/L' },
  sleepHours:  { labelKey: 'anomalies.sleepHours',  unit: 'h',      min: 6,   max: 9,   range: '6–9 h' },
  stressLevel: { labelKey: 'anomalies.stressLevel', unit: '/10',    min: 0,   max: 6,   range: '0–6 / 10' }
}
const fieldLabel = (f) => fieldMeta[f]?.labelKey ? t(fieldMeta[f].labelKey) : f
const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
}

const anomalies = computed(() => {
  const rows = []
  for (const rec of biometrics.value) {
    const staff = staffList.value.find(s => s.id === rec.medicalStaffId)
    for (const [field, meta] of Object.entries(fieldMeta)) {
      const val = rec[field]
      if (val === undefined || val === null) continue
      const isAnomaly = val < meta.min || val > meta.max
      rows.push({
        id:         rec.id,
        field,
        value:      val,
        unit:       meta.unit,
        normalRange: meta.range,
        isAnomaly,
        recordedAt: rec.recordedAt,
        staffName:  staff ? `${staff.firstName} ${staff.lastName}` : t('anomalies.unknown'),
        area:       staff?.area || '—',
        initials:   staff ? (staff.firstName[0] + staff.lastName[0]).toUpperCase() : '?'
      })
    }
  }
  return rows.filter(r => r.isAnomaly)
})

const filtered = computed(() => anomalies.value.filter(row => {
  const q = search.value.toLowerCase()
  return (!q || row.staffName.toLowerCase().includes(q))
    && (!filterField.value || row.field === filterField.value)
}))

onMounted(async () => {
  try {
    const [bRes, sRes] = await Promise.all([
      http.get(import.meta.env.VITE_BIOMETRIC_RECORDS_ENDPOINT_PATH),
      http.get(import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH)
    ])
    biometrics.value = bRes.data
    staffList.value  = sRes.data
  } finally { loading.value = false }
})
</script>
