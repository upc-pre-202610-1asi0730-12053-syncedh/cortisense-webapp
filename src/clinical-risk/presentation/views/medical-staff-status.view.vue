<!--
  @file medical-staff-status.view.vue
  @description Mi Estado de Salud — KPIs biométricos, chart de métricas y estado/sincronización del dispositivo IoT.
  Bounded context: clinical-risk
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('status.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('status.subtitle') }}</p>
    </div>

    <div v-if="loading" style="text-align:center;padding:2rem;color:var(--text-muted);">
      <i class="pi pi-spin pi-spinner"></i> {{ $t('status.loadingClinical') }}
    </div>

    <div v-else-if="!myProfile" class="cs-card" style="text-align:center;padding:2.5rem;">
      <div style="font-size:42px;margin-bottom:12px;">🩺</div>
      <div style="font-weight:800;color:var(--text-primary);margin-bottom:6px;">{{ $t('status.profileNotFound') }}</div>
      <div style="font-size:13px;color:var(--text-muted);">{{ $t('status.profileMissing') }}</div>
    </div>

    <template v-else>
      <!-- Banner de alerta si riesgo alto -->
      <div v-if="riskLevel === 'critical' || riskLevel === 'high'" class="status-alert-banner" :class="`alert-banner-${riskLevel}`">
        <span style="font-size:20px;">{{ riskLevel === 'critical' ? '🚨' : '⚠️' }}</span>
        <div>
          <strong>{{ $t('status.highFatigue', { level: riskLevel === 'critical' ? $t('risk.critical').toLowerCase() : $t('risk.high').toLowerCase(), percent: myProfile?.fatigueLevel }) }}</strong>
          {{ $t('status.supervisorNotified') }}
          <RouterLink to="/medical-staff/recovery" style="color:#EF4444;font-weight:600;margin-left:4px;">{{ $t('status.viewRecommendations') }}</RouterLink>
        </div>
      </div>

      <!-- KPIs -->
      <div class="cs-kpi-grid">
        <div class="cs-kpi-card">
          <div class="cs-kpi-icon">😴</div>
          <div class="cs-kpi-label">{{ $t('vitals.fatigue') }}</div>
          <div class="cs-kpi-value" :style="{ color: riskColor(riskLevel) }">{{ myProfile?.fatigueLevel ?? '—' }}%</div>
          <div class="cs-kpi-sub">{{ riskLabel(riskLevel) }}</div>
        </div>
        <div class="cs-kpi-card">
          <div class="cs-kpi-icon">💓</div>
          <div class="cs-kpi-label">{{ $t('vitals.heartRate') }}</div>
          <div class="cs-kpi-value">{{ lastRecord?.heartRate ?? '—' }} <span style="font-size:16px;font-weight:500;">bpm</span></div>
          <div class="cs-kpi-sub">{{ $t('status.normalHeartRate') }}</div>
        </div>
        <div class="cs-kpi-card">
          <div class="cs-kpi-icon">❤️</div>
          <div class="cs-kpi-label">{{ $t('vitals.hrv') }}</div>
          <div class="cs-kpi-value" :style="{ color: (lastRecord?.hrv < 30) ? '#EF4444' : 'inherit' }">{{ lastRecord?.hrv ?? '—' }} <span style="font-size:16px;font-weight:500;">ms</span></div>
          <div class="cs-kpi-sub">{{ lastRecord?.hrv < 30 ? $t('status.belowThreshold') : $t('status.normalRange') }}</div>
        </div>
        <div class="cs-kpi-card">
          <div class="cs-kpi-icon">💊</div>
          <div class="cs-kpi-label">{{ $t('vitals.cortisol') }}</div>
          <div class="cs-kpi-value primary">{{ recordValue(lastRecord, 'cortisol', 'cortisolLevel') }} <span style="font-size:14px;font-weight:500;">nmol/L</span></div>
          <div class="cs-kpi-sub">{{ $t('status.normalCortisol') }}</div>
        </div>
      </div>

      <div class="cs-grid-2">
        <!-- Gráfico métricas 8h -->
        <div class="cs-card" style="margin-bottom:0;">
          <div class="cs-card-header">
            <div class="cs-card-title">{{ $t('status.metricsLast8h') }}</div>
          </div>
          <div v-if="sortedRec.length" style="height:220px;position:relative;">
            <canvas ref="metricsCanvas"></canvas>
          </div>
          <div v-else style="height:220px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px;">
            {{ $t('status.noBiometricRecords') }}
          </div>
        </div>

        <!-- Dispositivo IoT -->
        <div class="cs-card" style="margin-bottom:0;">
          <div class="cs-card-header">
            <div class="cs-card-title">{{ $t('status.deviceStatus') }}</div>
            <button class="cs-btn cs-btn-sm cs-btn-primary" @click="syncDevice" :disabled="syncing">
              <i class="pi" :class="syncing ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              {{ syncing ? $t('status.syncing') : (device ? $t('status.sync') : $t('status.linkDevice')) }}
            </button>
          </div>
          <div v-if="device" style="display:flex;align-items:center;gap:16px;padding:16px;background:#F0FEFE;border-radius:10px;border:1px solid #A5F3F3;margin-bottom:16px;">
            <span style="font-size:36px;">⌚</span>
            <div>
              <div style="font-weight:700;font-size:15px;">{{ device.model || 'CortiWatch Pro' }}</div>
              <div style="font-size:12px;color:#64748B;">{{ $t('status.deviceId') }}: {{ device.id }}</div>
              <div style="margin-top:4px;"><span class="cs-badge cs-badge-active">{{ $t('status.connected') }}</span></div>
            </div>
          </div>
          <div v-else style="padding:16px;background:#F8FAFC;border-radius:10px;border:1px solid var(--border);margin-bottom:16px;color:var(--text-muted);font-size:13px;">
            📵 {{ $t('status.noDevice') }} {{ $t('status.noDeviceHint') }}
          </div>
          <div v-if="device">
            <div class="metric-row"><span class="metric-label">{{ $t('status.lastSync') }}</span><span class="metric-value">{{ lastSyncLabel }}</span></div>
            <div class="metric-row"><span class="metric-label">{{ $t('status.battery') }}</span><span class="metric-value">🔋 {{ device.batteryLevel ?? 72 }}%</span></div>
            <div class="metric-row"><span class="metric-label">{{ $t('status.firmware') }}</span><span class="metric-value">{{ device.firmwareVersion || 'v2.4.1' }} ✅</span></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { http } from '../../../shared/infrastructure/http.js'

Chart.register(...registerables)

const { t, locale } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const myProfile = ref(null)
const records = ref([])
const device = ref(null)
const loading = ref(true)
const syncing = ref(false)
const metricsCanvas = ref(null)
let metricsChart = null

const STAFF_PATH = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH
const BIOMETRICS_PATH = import.meta.env.VITE_BIOMETRIC_RECORDS_ENDPOINT_PATH
const DEVICES_PATH = import.meta.env.VITE_DEVICES_ENDPOINT_PATH

const riskColorMap = { critical:'#EF4444', high:'#F97316', moderate:'#F59E0B', low:'#10B981' }
const riskColor = (l) => riskColorMap[l] || '#94A3B8'
const riskLabel = (l) => ({
  critical: t('riskLabels.criticalLevel'),
  high: t('riskLabels.highLevel'),
  moderate: t('riskLabels.moderateLevel'),
  low: t('riskLabels.lowLevel')
}[l] || '—')

const riskLevel = computed(() => myProfile.value?.riskLevel || 'low')
const sortedRec = computed(() => [...records.value].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)).slice(-8))
const lastRecord = computed(() => sortedRec.value.at(-1) || null)
const lastSyncLabel = computed(() => {
  if (!device.value?.lastSyncAt) return t('status.never')
  const minutes = Math.max(0, Math.round((Date.now() - new Date(device.value.lastSyncAt).getTime()) / 60000))
  return minutes <= 90 ? t('status.minutesAgo', { minutes }) : new Date(device.value.lastSyncAt).toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', { hour:'2-digit', minute:'2-digit' })
})

function recordValue (record, primaryKey, fallbackKey) {
  if (!record) return '—'
  return record[primaryKey] ?? record[fallbackKey] ?? '—'
}

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeId (prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function computeRiskLevel (fatigue) {
  if (fatigue >= 80) return 'critical'
  if (fatigue >= 65) return 'high'
  if (fatigue >= 45) return 'moderate'
  return 'low'
}

function resolveMyProfile (staff) {
  const currentUserId = authStore._userResource?.id
  const currentStaffId = authStore._userResource?.medicalStaffId
  return staff.find(s => s.id === currentStaffId || s.userId === currentUserId) || null
}

async function loadData () {
  const [sRes, bRes, dRes] = await Promise.all([
    http.get(STAFF_PATH),
    http.get(BIOMETRICS_PATH),
    http.get(DEVICES_PATH)
  ])

  myProfile.value = resolveMyProfile(sRes.data)
  records.value = myProfile.value?.id
    ? bRes.data.filter(b => b.medicalStaffId === myProfile.value.id)
    : []
  device.value = myProfile.value?.id
    ? dRes.data.find(d => d.assignedTo === myProfile.value.id || d.id === myProfile.value.assignedDeviceId) || null
    : null
}

function buildRandomRecord (hoursBack = 0) {
  const fatigueScore = randomInt(25, 68)
  const cortisolLevel = randomInt(160, 560)
  const recordedAt = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
  return {
    id: makeId('br'),
    medicalStaffId: myProfile.value.id,
    recordedAt,
    sleepHours: Number((Math.random() * 2.2 + 5.8).toFixed(1)),
    heartRate: randomInt(62, 98),
    hrv: randomInt(31, 76),
    cortisolLevel,
    cortisol: cortisolLevel,
    steps: randomInt(2200, 9500),
    activityLevel: ['low', 'moderate'][randomInt(0, 1)],
    stressLevel: randomInt(22, 68),
    fatigueScore,
    fatigueLevel: fatigueScore,
    riskLevel: computeRiskLevel(fatigueScore)
  }
}

async function syncDevice () {
  if (!myProfile.value?.id) return
  syncing.value = true
  try {
    let currentDevice = device.value
    if (!currentDevice) {
      const devicePayload = {
        id: makeId('dev'),
        serialNumber: `CS-WS-${randomInt(1000, 9999)}`,
        model: 'CortiWatch Pro',
        assignedTo: myProfile.value.id,
        status: 'active',
        batteryLevel: randomInt(65, 98),
        firmwareVersion: 'v2.4.1',
        lastSyncAt: new Date().toISOString()
      }
      currentDevice = (await http.post(DEVICES_PATH, devicePayload)).data
      await http.patch(`${STAFF_PATH}/${myProfile.value.id}`, { assignedDeviceId: currentDevice.id })
    } else {
      currentDevice = (await http.patch(`${DEVICES_PATH}/${currentDevice.id}`, {
        batteryLevel: Math.max(10, (currentDevice.batteryLevel ?? 80) - randomInt(0, 3)),
        lastSyncAt: new Date().toISOString(),
        status: 'active'
      })).data
    }

    const newRecords = records.value.length
      ? [buildRandomRecord(0)]
      : Array.from({ length: 8 }, (_, idx) => buildRandomRecord(7 - idx))

    await Promise.all(newRecords.map(record => http.post(BIOMETRICS_PATH, record)))
    const latest = newRecords.at(-1)
    const updatedProfile = (await http.patch(`${STAFF_PATH}/${myProfile.value.id}`, {
      fatigueLevel: latest.fatigueScore,
      riskLevel: latest.riskLevel,
      assignedDeviceId: currentDevice.id
    })).data

    device.value = currentDevice
    myProfile.value = updatedProfile
    records.value = [...records.value, ...newRecords]
    await nextTick()
    renderChart()
  } finally {
    syncing.value = false
  }
}

function renderChart () {
  metricsChart?.destroy()
  const ctx = metricsCanvas.value?.getContext('2d')
  if (!ctx || !sortedRec.value.length) return

  const labels = sortedRec.value.map(r => new Date(r.recordedAt).toLocaleTimeString(locale.value === 'es' ? 'es-PE' : 'en-US', { hour:'2-digit', minute:'2-digit' }))
  metricsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('vitals.fatigue') + ' (%)',
          data: sortedRec.value.map(r => r.fatigueLevel ?? r.fatigueScore ?? 0),
          borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.07)',
          borderWidth: 2.5, pointRadius: 3, tension: 0.4, fill: true
        },
        {
          label: t('vitals.heartRate') + ' (bpm)',
          data: sortedRec.value.map(r => r.heartRate),
          borderColor: '#45DDE5', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 3, tension: 0.4, borderDash: [5,3]
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } },
      scales: {
        y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } }
      }
    }
  })
}

onMounted(async () => {
  try {
    await loadData()
    await nextTick()
    renderChart()
  } finally { loading.value = false }
})

onBeforeUnmount(() => {
  metricsChart?.destroy()
})
</script>

<style scoped>
.status-alert-banner {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 18px; border-radius: 12px; border: 1px solid transparent;
  margin-bottom: 20px; font-size: 13px;
}
.alert-banner-critical { background: #FEF2F2; border-color: #FECACA; color: #991B1B; }
.alert-banner-high     { background: #FFF7ED; border-color: #FED7AA; color: #92400E; }
</style>
