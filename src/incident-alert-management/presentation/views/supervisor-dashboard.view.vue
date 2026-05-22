<!--
  @file supervisor-dashboard.view.vue
  @description Resumen de turno del Supervisor Clínico — KPIs, fatiga del equipo y alertas recientes.
  Bounded context: incident-alert-management
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('dashboard.supervisor.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('dashboard.supervisor.subtitle') }}</p>
    </div>

    <!-- KPIs -->
    <div class="cs-kpi-grid">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">👥</div>
        <div class="cs-kpi-label">{{ $t('dashboard.supervisor.totalMonitored') }}</div>
        <div class="cs-kpi-value">{{ staff.length }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.supervisor.staffBreakdown', { doctors: medicos, supervisors: supervisores }) }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⚠️</div>
        <div class="cs-kpi-label">{{ $t('dashboard.supervisor.atRiskNow') }}</div>
        <div class="cs-kpi-value critical">{{ riskCount }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.supervisor.criticalHighBreakdown', { critical: criticalCount, high: highCount }) }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🔔</div>
        <div class="cs-kpi-label">{{ $t('dashboard.supervisor.pendingAlerts') }}</div>
        <div class="cs-kpi-value warning">{{ pendingAlerts.length }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.supervisor.unattended') }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">✅</div>
        <div class="cs-kpi-label">{{ $t('dashboard.supervisor.actionsToday') }}</div>
        <div class="cs-kpi-value success">{{ todayActions }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.supervisor.restsAndReassignments') }}</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="cs-grid-2" style="margin-bottom:20px;">
      <!-- Fatiga 24h -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="cs-card-header">
          <div>
            <div class="cs-card-title">{{ $t('dashboard.supervisor.teamFatigue24h') }}</div>
            <div class="cs-card-subtitle">{{ $t('dashboard.supervisor.assignedDoctorsAverage') }}</div>
          </div>
        </div>
        <div style="height:220px;position:relative;">
          <canvas id="fatigaTeamChart"></canvas>
        </div>
      </div>

      <!-- Fatiga individual -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="cs-card-header">
          <div class="cs-card-title">{{ $t('dashboard.supervisor.currentFatigueByDoctor') }}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px;">
          <div v-if="loading" style="color:var(--text-muted);font-size:13px;">{{ $t('common.loading') }}</div>
          <div v-for="m in sortedStaff" :key="m.id">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
              <span>
                <strong>{{ m.firstName }} {{ m.lastName }}</strong>
                <span class="cs-badge" :class="`cs-badge-${m.riskLevel}`" style="font-size:10px;margin-left:6px;">{{ riskLabel(m.riskLevel) }}</span>
              </span>
              <span style="font-weight:700;" :style="{ color: riskColor(m.riskLevel) }">{{ m.fatigueLevel }}%</span>
            </div>
            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
              <div :style="{ height:'8px', width: m.fatigueLevel + '%', background: riskColor(m.riskLevel), borderRadius:'4px', transition:'width 0.4s' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas recientes -->
    <div class="cs-card" style="margin-bottom:0;">
      <div class="cs-card-header">
        <div class="cs-card-title">{{ $t('dashboard.supervisor.recentAlerts') }}</div>
        <RouterLink to="/supervisor/alerts" class="cs-btn cs-btn-secondary cs-btn-sm">{{ $t('common.viewAll') }}</RouterLink>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div v-if="pendingAlerts.length === 0" style="color:var(--text-muted);font-size:13px;padding:12px 0;">{{ $t('dashboard.supervisor.noPendingAlerts') }}</div>
        <div
          v-for="alert in pendingAlerts.slice(0,3)"
          :key="alert.id"
          class="alert-item"
          :class="`alert-item-${alert.severity}`"
        >
          <span class="alert-sev-icon">{{ severityIcon(alert.severity) }}</span>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:13px;">{{ alertMessage(alert) }}</div>
            <div style="font-size:12px;color:#64748B;margin-top:2px;">{{ alert.staffName }} · {{ areaLabel(alert.area) }} · {{ $t('dashboard.supervisor.ago') }} {{ timeAgo(alert.createdAt) }}</div>
          </div>
          <button class="cs-btn cs-btn-sm" :class="alert.severity === 'critical' ? 'cs-btn-danger' : 'cs-btn-secondary'" @click="acknowledgeAlert(alert)">
            {{ $t('dashboard.supervisor.attend') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import { http } from '../../../shared/infrastructure/http.js'
import { useI18n } from 'vue-i18n'

Chart.register(...registerables)

const { t, locale } = useI18n({ useScope: 'global' })

const staff      = ref([])
const alerts     = ref([])
const actions    = ref([])
const loading    = ref(true)
let fatigueTeamChart = null

const riskColorMap = { critical: '#EF4444', high: '#F97316', moderate: '#F59E0B', low: '#10B981' }
const riskColor  = (l) => riskColorMap[l] || '#94A3B8'
const riskLabel  = (l) => l ? t(`risk.${l}`) : '—'
const sevIcons   = { critical: '🔴', high: '🟠', moderate: '🟡', low: '🟢' }
const severityIcon = (s) => sevIcons[s] || '⚪'

const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area
const specialtyKey = (spec = '') => ({ 'Cardiología': 'cardiology', 'Medicina Interna': 'internalMedicine', 'Pediatría': 'pediatrics', 'Cirugía General': 'generalSurgery', 'Ginecología': 'gynecology' }[spec] || '')
const specialtyLabel = (spec) => specialtyKey(spec) ? t(`specialties.${specialtyKey(spec)}`) : spec

const sortedStaff   = computed(() => [...staff.value].sort((a, b) => b.fatigueLevel - a.fatigueLevel))
const medicos       = computed(() => staff.value.filter(s => s.staffRole === 'medical_staff').length)
const supervisores  = computed(() => staff.value.filter(s => s.staffRole === 'clinical_supervisor').length)
const riskCount     = computed(() => staff.value.filter(s => ['high','critical'].includes(s.riskLevel)).length)
const criticalCount = computed(() => staff.value.filter(s => s.riskLevel === 'critical').length)
const highCount     = computed(() => staff.value.filter(s => s.riskLevel === 'high').length)
const pendingAlerts = computed(() => alerts.value.filter(a => a.status === 'pending'))
const todayActions  = computed(() => {
  const today = new Date().toDateString()
  return actions.value.filter(a => new Date(a.createdAt).toDateString() === today).length
})

function timeAgo (iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} ${t('common.minutes')}`
  const hrs = Math.floor(mins / 60)
  return `${hrs}${locale.value === 'es' ? 'h' : 'h'}`
}

function alertItemBg (severity) {
  return { critical: '#FEF2F2', high: '#FFF7ED', moderate: '#FFFBEB', low: '#F0FDF4' }[severity] || '#F8FAFC'
}


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

async function acknowledgeAlert (alert) {
  try {
    await http.patch(`${import.meta.env.VITE_ALERTS_ENDPOINT_PATH}/${alert.id}`, { status: 'acknowledged' })
    alert.status = 'acknowledged'
  } catch {}
}

onMounted(async () => {
  try {
    const [sRes, aRes, acRes] = await Promise.all([
      http.get(import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH),
      http.get(import.meta.env.VITE_ALERTS_ENDPOINT_PATH),
      http.get(import.meta.env.VITE_PREVENTIVE_ACTIONS_ENDPOINT_PATH)
    ])
    staff.value   = sRes.data
    alerts.value  = aRes.data
    actions.value = acRes.data
  } finally { loading.value = false }

  // Chart — fatiga equipo 24h
  const ctx = document.getElementById('fatigaTeamChart')?.getContext('2d')
  if (ctx) {
    fatigueTeamChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h'],
        datasets: [
          {
            label: t('dashboard.supervisor.chartAverageFatigue'),
            data: [40,42,55,68,82,90,88,75,60,50,45,48],
            borderColor: '#45DDE5', backgroundColor: 'rgba(69,221,229,0.07)',
            borderWidth: 2.5, pointBackgroundColor: '#45DDE5', pointRadius: 3, tension: 0.4, fill: true
          },
          {
            label: t('dashboard.supervisor.criticalThreshold'),
            data: Array(12).fill(85),
            borderColor: '#EF4444', borderDash: [5,5], borderWidth: 1.5, pointRadius: 0, fill: false
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } }
        }
      }
    })
  }
})

onBeforeUnmount(() => {
  fatigueTeamChart?.destroy()
})
</script>

<style scoped>
.alert-item {
  display: flex; align-items: center; gap: 14px;
  padding: 12px; border-radius: 10px; border: 1px solid transparent;
}
.alert-item-critical  { background: #FEF2F2; border-color: #FECACA; }
.alert-item-high      { background: #FFF7ED; border-color: #FED7AA; }
.alert-item-moderate  { background: #FFFBEB; border-color: #FDE68A; }
.alert-item-low       { background: #F0FDF4; border-color: #A7F3D0; }
.alert-sev-icon       { font-size: 20px; }
</style>
