<template>
  <section>
    <header class="page-header">
      <h1>{{ $t('clinical.riskStaff.title') }}</h1>
      <p>{{ $t('clinical.riskStaff.subtitle-before') }} <strong>{{ $t('clinical.riskStaff.subtitle-highlight') }}</strong> {{ $t('clinical.riskStaff.subtitle-after') }}</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon blue"><i class="pi pi-users"></i></div>
        <p>{{ $t('clinical.riskStaff.metrics.total') }}</p>
        <h2>{{ scopedRisks.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon warning"><i class="pi pi-bell"></i></div>
        <p>{{ $t('clinical.riskStaff.metrics.moderate') }}</p>
        <h2 class="warning-text">{{ moderateCount }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon orange"><i class="pi pi-exclamation-triangle"></i></div>
        <p>{{ $t('clinical.riskStaff.metrics.high') }}</p>
        <h2 class="orange-text">{{ highCount }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon danger"><i class="pi pi-bolt"></i></div>
        <p>{{ $t('clinical.riskStaff.metrics.critical') }}</p>
        <h2 class="danger-text">{{ criticalCount }}</h2>
      </article>
    </section>

    <article class="content-card full-width supervisor-list-card">
      <div class="toolbar-row compact-toolbar risk-toolbar">
        <input v-model.trim="search" class="input" :placeholder="$t('clinical.riskStaff.search-placeholder')">
        <select v-model="riskFilter" class="select">
          <option value="">{{ $t('clinical.riskStaff.filters.all') }}</option>
          <option value="MODERATE">{{ $t('clinical.labels.moderate') }}</option>
          <option value="HIGH">{{ $t('clinical.labels.high') }}</option>
          <option value="CRITICAL">{{ $t('clinical.labels.critical') }}</option>
        </select>
      </div>

      <section class="risk-staff-list">
        <article v-for="risk in filtered" :key="risk.id" class="risk-staff-card" :class="riskTone(risk.riskLevel)">
          <div class="staff-main">
            <div class="avatar">{{ initials(userById(risk.userId)) }}</div>
            <div class="staff-info">
              <h2>{{ fullName(userById(risk.userId)) }}</h2>
              <p>{{ userById(risk.userId)?.email }}</p>
              <span class="team-badge">{{ $t('clinical.riskStaff.team') }}: {{ teamNameForUser(risk.userId) }}</span>
            </div>
          </div>

          <div class="risk-panel">
            <span class="risk-pill" :class="riskTone(risk.riskLevel)">{{ riskLabel(risk.riskLevel) }}</span>
            <strong>{{ risk.fatigueLevel }}%</strong>
            <small>{{ $t('clinical.riskStaff.fatigue') }}</small>
          </div>

          <div class="vitals-grid risk-vitals-grid">
            <div class="vital-item">
              <span>{{ $t('clinical.riskStaff.heart-rate') }}</span>
              <strong>{{ risk.heartRate }} bpm</strong>
            </div>
            <div class="vital-item">
              <span>{{ $t('clinical.riskStaff.hrv') }}</span>
              <strong>{{ risk.hrv }} ms</strong>
            </div>
            <div class="vital-item">
              <span>{{ $t('clinical.riskStaff.active-alerts') }}</span>
              <strong>{{ activeAlertsForUser(risk.userId) }}</strong>
            </div>
            <div class="vital-item">
              <span>{{ $t('clinical.riskStaff.last-reading') }}</span>
              <strong>{{ formatTime(risk.lastUpdatedAt) }}</strong>
            </div>
          </div>

          <div class="progress-track">
            <div class="progress-fill" :class="riskTone(risk.riskLevel)" :style="{ width: `${risk.fatigueLevel}%` }"></div>
          </div>
        </article>

        <p v-if="filtered.length === 0" class="empty-state">{{ $t('clinical.riskStaff.empty') }}</p>
      </section>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, fullName, initials } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const users = ref([]), teams = ref([]), members = ref([]), risks = ref([]), alerts = ref([])
const search = ref(''), riskFilter = ref('')

onMounted(async () => {
  ;[users.value, teams.value, members.value, risks.value, alerts.value] = await Promise.all([
    listResource('users'),
    listResource('careTeams'),
    listResource('teamMembers'),
    listResource('riskAssessments'),
    listResource('clinicalAlerts')
  ])
})

const myTeamIds = computed(() => teams.value.filter(t => Number(t.supervisorId) === Number(authStore.user?.id)).map(t => Number(t.id)))
const myDoctorIds = computed(() => [...new Set(members.value.filter(m => myTeamIds.value.includes(Number(m.teamId))).map(m => Number(m.userId)))])
const scopedRisks = computed(() => risks.value.filter(r => myDoctorIds.value.includes(Number(r.userId))).sort((a, b) => Number(b.fatigueLevel) - Number(a.fatigueLevel)))
const filtered = computed(() => scopedRisks.value.filter(r => {
  const u = userById(r.userId)
  const text = `${fullName(u)} ${u?.email || ''} ${teamNameForUser(r.userId)}`.toLowerCase()
  const normalizedRisk = normalizeRisk(r.riskLevel)
  return (!search.value || text.includes(search.value.toLowerCase())) && (!riskFilter.value || normalizedRisk === riskFilter.value)
}))
const moderateCount = computed(() => scopedRisks.value.filter(r => normalizeRisk(r.riskLevel) === 'MODERATE').length)
const highCount = computed(() => scopedRisks.value.filter(r => normalizeRisk(r.riskLevel) === 'HIGH').length)
const criticalCount = computed(() => scopedRisks.value.filter(r => normalizeRisk(r.riskLevel) === 'CRITICAL').length)

function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function teamForUser (userId) {
  const member = members.value.find(m => Number(m.userId) === Number(userId) && myTeamIds.value.includes(Number(m.teamId)))
  return teams.value.find(t => Number(t.id) === Number(member?.teamId))
}
function teamNameForUser (userId) { return teamForUser(userId)?.name || '—' }
function normalizeRisk (value) { return value === 'MEDIUM' ? 'MODERATE' : String(value || 'LOW').toUpperCase() }
function riskTone (value) {
  const risk = normalizeRisk(value)
  if (risk === 'CRITICAL') return 'critical'
  if (risk === 'HIGH') return 'high'
  if (risk === 'MODERATE') return 'moderate'
  return 'low'
}
function riskLabel (value) { return { LOW: 'Bajo', MODERATE: 'Moderado', MEDIUM: 'Moderado', HIGH: 'Alto', CRITICAL: 'Crítico' }[normalizeRisk(value)] || value }
function activeAlertsForUser (userId) { return alerts.value.filter(a => Number(a.userId) === Number(userId) && a.status === 'ACTIVE').length }
function formatTime (value) { return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }
</script>
