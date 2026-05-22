<!--
  @file supervisor-alerts.view.vue
  @description Alertas clínicas — listado con acciones de confirmación y resolución.
  Bounded context: incident-alert-management
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('alerts.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('alerts.subtitle') }}</p>
    </div>

    <!-- KPIs rápidos -->
    <div class="cs-kpi-grid" style="grid-template-columns: repeat(3,1fr);">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🔴</div>
        <div class="cs-kpi-label">{{ $t('alerts.criticalPlural') }}</div>
        <div class="cs-kpi-value critical">{{ countBySeverity('critical') }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🟠</div>
        <div class="cs-kpi-label">{{ $t('alerts.highPlural') }}</div>
        <div class="cs-kpi-value warning">{{ countBySeverity('high') }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">✅</div>
        <div class="cs-kpi-label">{{ $t('alerts.resolvedToday') }}</div>
        <div class="cs-kpi-value success">{{ resolvedToday }}</div>
      </div>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="filters-bar">
        <input class="filter-input" v-model="search" :placeholder="$t('alerts.searchPlaceholder')" />
        <select class="filter-select" v-model="filterSeverity">
          <option value="">{{ $t('alerts.allSeverities') }}</option>
          <option value="critical">{{ $t('alerts.severity.critical') }}</option>
          <option value="high">{{ $t('alerts.severity.high') }}</option>
          <option value="moderate">{{ $t('alerts.severity.moderate') }}</option>
          <option value="low">{{ $t('alerts.severity.low') }}</option>
        </select>
        <select class="filter-select" v-model="filterStatus">
          <option value="">{{ $t('alerts.allStatuses') }}</option>
          <option value="pending">{{ $t('alerts.status.pending') }}</option>
          <option value="acknowledged">{{ $t('alerts.status.acknowledged') }}</option>
          <option value="resolved">{{ $t('alerts.status.resolved') }}</option>
        </select>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <div v-if="loading" style="color:var(--text-muted);text-align:center;padding:2rem;">{{ $t('common.loading') }}</div>
        <div v-else-if="filtered.length === 0" style="color:var(--text-muted);text-align:center;padding:2rem;">{{ $t('alerts.noMatchingAlerts') }}</div>

        <div v-for="alert in filtered" :key="alert.id" class="alert-row" :class="`alert-row-${alert.severity}`">
          <span class="alert-sev-dot" :style="{ background: sevColor(alert.severity) }"></span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-weight:600;font-size:13px;">{{ alertMessage(alert) }}</span>
              <span class="cs-badge" :class="`cs-badge-${alert.severity}`">{{ $t(`alerts.severity.${alert.severity}`) }}</span>
              <span class="cs-badge" :class="`cs-badge-${alert.status}`">{{ $t(`alerts.status.${alert.status}`) }}</span>
            </div>
            <div style="font-size:12px;color:#64748B;margin-top:3px;">
              {{ alert.staffName }} · {{ areaLabel(alert.area) }} · {{ formatDate(alert.createdAt) }}
            </div>
          </div>
          <div class="action-btns">
            <button v-if="alert.status === 'pending'" class="btn-link btn-link-view" @click="doAck(alert)">{{ $t('alerts.acknowledgeShort') }}</button>
            <button v-if="alert.status !== 'resolved'" class="btn-link btn-link-edit" @click="doResolve(alert)">{{ $t('alerts.resolveShort') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { http } from '../../../shared/infrastructure/http.js'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

const alerts        = ref([])
const loading       = ref(true)
const search        = ref('')
const filterSeverity = ref('')
const filterStatus   = ref('')

const ALERTS_PATH = import.meta.env.VITE_ALERTS_ENDPOINT_PATH

const sevColorMap = { critical:'#EF4444', high:'#F97316', moderate:'#F59E0B', low:'#10B981' }
const sevColor = (s) => sevColorMap[s] || '#94A3B8'
const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area

const filtered = computed(() => alerts.value.filter(a => {
  const q = search.value.toLowerCase()
  return (!q || a.message?.toLowerCase().includes(q) || a.staffName?.toLowerCase().includes(q))
    && (!filterSeverity.value || a.severity === filterSeverity.value)
    && (!filterStatus.value   || a.status   === filterStatus.value)
}))

const countBySeverity = (s) => alerts.value.filter(a => a.severity === s && a.status !== 'resolved').length
const resolvedToday   = computed(() => {
  const today = new Date().toDateString()
  return alerts.value.filter(a => a.status === 'resolved' && new Date(a.createdAt).toDateString() === today).length
})

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(async () => {
  try { const r = await http.get(ALERTS_PATH); alerts.value = r.data }
  finally { loading.value = false }
})


function alertMessage (alert) {
  const name = alert.staffName || ''
  const percent = alert.message?.match(/\((\d+)%\)/)?.[1]
  if (alert.type === 'fatigue') return t('alertsText.fatigueCritical', { name, percent: percent || '—' })
  if (alert.type === 'risk') return t('alertsText.criticalRisk', { name, percent: percent || '—' })
  if (alert.type === 'cortisol') return t('alertsText.highCortisol')
  if (alert.type === 'hrv') return t('alertsText.lowHrv')
  if (alert.type === 'heartRate') return t('alertsText.highHeartRate')
  return alert.message || '—'
}

async function doAck (alert) {
  await http.patch(`${ALERTS_PATH}/${alert.id}`, { status: 'acknowledged' })
  alert.status = 'acknowledged'
}

async function doResolve (alert) {
  await http.patch(`${ALERTS_PATH}/${alert.id}`, { status: 'resolved' })
  alert.status = 'resolved'
}
</script>

<style scoped>
.alert-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border-radius: 10px; border: 1px solid transparent;
  transition: box-shadow 0.15s;
}
.alert-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.alert-row-critical { background: #FEF2F2; border-color: #FECACA; }
.alert-row-high     { background: #FFF7ED; border-color: #FED7AA; }
.alert-row-moderate { background: #FFFBEB; border-color: #FDE68A; }
.alert-row-low      { background: #F0FDF4; border-color: #A7F3D0; }
.alert-sev-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
</style>
