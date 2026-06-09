<template>
  <section>
    <header class="page-header">
      <h1>{{ $t('clinical.doctor.title') }}</h1>
      <p>{{ $t('clinical.doctor.subtitle-before') }} <strong>{{ fullName(authStore.user) }}</strong> {{ $t('clinical.doctor.subtitle-after') }}</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon blue"><i class="pi pi-heart"></i></div>
        <p>{{ $t('clinical.doctor.metrics.fatigue') }}</p>
        <h2>{{ latestRisk?.fatigueLevel || 0 }}%</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon danger"><i class="pi pi-bolt"></i></div>
        <p>{{ $t('clinical.doctor.metrics.heart-rate') }}</p>
        <h2>{{ latestReading?.heartRate || latestRisk?.heartRate || 0 }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon purple"><i class="pi pi-shield"></i></div>
        <p>{{ $t('clinical.doctor.metrics.hrv') }}</p>
        <h2>{{ latestReading?.hrv || latestRisk?.hrv || 0 }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon warning"><i class="pi pi-bell"></i></div>
        <p>{{ $t('clinical.doctor.metrics.active-alerts') }}</p>
        <h2 class="warning-text">{{ activeAlerts.length }}</h2>
      </article>
    </section>

    <section class="content-grid doctor-health-grid">
      <article class="health-card" :class="riskTone(latestRisk?.riskLevel)">
        <div v-if="latestRisk" class="health-status-header">
          <div>
            <span class="risk-pill" :class="riskTone(latestRisk.riskLevel)">{{ riskLabel(latestRisk.riskLevel) }}</span>
            <h2>{{ $t('clinical.doctor.current-status-title') }}</h2>
            <p>{{ healthMessage }}</p>
          </div>
          <div class="fatigue-score" :class="riskTone(latestRisk.riskLevel)">
            <strong>{{ latestRisk.fatigueLevel }}%</strong>
            <span>{{ $t('clinical.doctor.fatigue-level') }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <h2>{{ $t('clinical.doctor.no-risk-title') }}</h2>
          <p>{{ $t('clinical.doctor.no-risk-subtitle') }}</p>
        </div>

        <div v-if="latestRisk" class="progress-track">
          <div class="progress-fill" :class="riskTone(latestRisk.riskLevel)" :style="{ width: `${latestRisk.fatigueLevel}%` }"></div>
        </div>

        <div v-if="latestRisk" class="vitals-grid doctor-vitals-summary">
          <div class="vital-item">
            <span>{{ $t('clinical.doctor.vitals.heart-rate') }}</span>
            <strong>{{ latestRisk.heartRate }} bpm</strong>
          </div>
          <div class="vital-item">
            <span>{{ $t('clinical.doctor.vitals.hrv') }}</span>
            <strong>{{ latestRisk.hrv }} ms</strong>
          </div>
          <div class="vital-item">
            <span>{{ $t('clinical.doctor.vitals.updated') }}</span>
            <strong>{{ formatHour(latestRisk.lastUpdatedAt) }}</strong>
          </div>
        </div>
      </article>

      <article class="content-card">
        <div class="section-header">
          <div>
            <h2>{{ $t('clinical.doctor.recommendations-title') }}</h2>
            <p>{{ $t('clinical.doctor.recommendations-subtitle') }}</p>
          </div>
        </div>
        <div class="recommendations-list">
          <div v-for="recommendation in recommendations" :key="recommendation" class="recommendation-item">
            <div class="recommendation-icon"><i class="pi pi-check-circle"></i></div>
            <p>{{ recommendation }}</p>
          </div>
        </div>
      </article>

      <article class="content-card alerts-card">
        <div class="section-header">
          <div>
            <h2>{{ $t('clinical.doctor.alerts-title') }}</h2>
            <p>{{ $t('clinical.doctor.alerts-subtitle') }}</p>
          </div>
        </div>
        <div class="alerts-list doctor-alert-list">
          <div v-for="alert in activeAlerts" :key="alert.id" class="alert-item" :class="riskTone(alert.severity)">
            <div class="alert-icon"><i class="pi pi-exclamation-triangle"></i></div>
            <div>
              <strong>{{ riskLabel(alert.severity) }}</strong>
              <p>{{ alert.message }}</p>
              <span>{{ formatDate(alert.createdAt) }}</span>
            </div>
          </div>
          <p v-if="activeAlerts.length === 0" class="empty-state-text">{{ $t('clinical.doctor.no-active-alerts') }}</p>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, fullName } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const { t } = useI18n()
const risks = ref([]), readings = ref([]), alerts = ref([])

onMounted(loadData)
async function loadData () {
  ;[risks.value, readings.value, alerts.value] = await Promise.all([
    listResource('riskAssessments', { userId: authStore.user?.id }),
    listResource('vitalSignReadings', { userId: authStore.user?.id }),
    listResource('clinicalAlerts', { userId: authStore.user?.id })
  ])
}

const sortedReadings = computed(() => [...readings.value].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)))
const latestRisk = computed(() => [...risks.value].sort((a, b) => new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt)).at(-1))
const latestReading = computed(() => sortedReadings.value.at(-1))
const activeAlerts = computed(() => alerts.value.filter(a => a.status === 'ACTIVE').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
const healthMessage = computed(() => {
  const risk = normalizeRisk(latestRisk.value?.riskLevel)
  if (risk === 'CRITICAL') return t('clinical.doctor.message.critical')
  if (risk === 'HIGH') return t('clinical.doctor.message.high')
  if (risk === 'MODERATE') return t('clinical.doctor.message.moderate')
  return t('clinical.doctor.message.low')
})
const recommendations = computed(() => {
  const risk = normalizeRisk(latestRisk.value?.riskLevel)
  if (risk === 'CRITICAL') return [t('clinical.doctor.recommendations.stop-activity'), t('clinical.doctor.recommendations.immediate-support'), t('clinical.doctor.recommendations.notify-supervisor')]
  if (risk === 'HIGH') return [t('clinical.doctor.recommendations.recovery-break'), t('clinical.doctor.recommendations.keep-hydrated'), t('clinical.doctor.recommendations.keep-monitoring')]
  if (risk === 'MODERATE') return [t('clinical.doctor.recommendations.short-break'), t('clinical.doctor.recommendations.breathing'), t('clinical.doctor.recommendations.keep-monitoring')]
  return [t('clinical.doctor.recommendations.keep-hydrated'), t('clinical.doctor.recommendations.keep-monitoring')]
})

function normalizeRisk (value) { return value === 'MEDIUM' ? 'MODERATE' : String(value || 'LOW').toUpperCase() }
function riskTone (value) {
  const risk = normalizeRisk(value)
  if (risk === 'CRITICAL') return 'critical'
  if (risk === 'HIGH') return 'high'
  if (risk === 'MODERATE') return 'moderate'
  return 'low'
}
function riskLabel (value) { return t(`clinical.labels.${normalizeRisk(value).toLowerCase()}`) }
function formatDate (value) { return value ? new Date(value).toLocaleString() : '—' }
function formatHour (value) { return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }
</script>
