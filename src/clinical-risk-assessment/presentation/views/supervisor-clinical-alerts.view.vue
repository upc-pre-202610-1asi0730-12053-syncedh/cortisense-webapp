<template>
  <section>
    <header class="page-header">
      <h1>Alertas clínicas</h1>
      <p>Gestiona alertas de <strong>fatiga, HRV y frecuencia cardíaca</strong> detectadas en tus equipos.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon warning"><i class="pi pi-bell"></i></div>
        <p>Activas</p>
        <h2 class="warning-text">{{ activeAlerts.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon danger"><i class="pi pi-exclamation-triangle"></i></div>
        <p>Alta prioridad</p>
        <h2 class="danger-text">{{ highPriorityAlerts.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon success"><i class="pi pi-check-circle"></i></div>
        <p>Resueltas</p>
        <h2 class="success-text">{{ resolvedAlerts.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon blue"><i class="pi pi-users"></i></div>
        <p>Total</p>
        <h2>{{ scopedAlerts.length }}</h2>
      </article>
    </section>

    <article class="content-card full-width supervisor-list-card">
      <div class="toolbar-row alert-toolbar">
        <input v-model.trim="search" class="input" placeholder="Buscar por personal o mensaje...">
        <select v-model="status" class="select">
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activa</option>
          <option value="RESOLVED">Resuelta</option>
        </select>
        <select v-model="severity" class="select">
          <option value="">Todas las severidades</option>
          <option value="LOW">Baja</option>
          <option value="MODERATE">Moderada</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </select>
      </div>

      <section class="alerts-list visual-alerts-list">
        <article v-for="alert in filtered" :key="alert.id" class="alert-card visual-alert-card" :class="riskTone(alert.severity)">
          <div class="alert-main">
            <div class="alert-icon"><i class="pi pi-bell"></i></div>
            <div class="alert-content">
              <div class="alert-header">
                <div>
                  <h2>{{ fullName(userById(alert.userId)) }}</h2>
                  <p>{{ userById(alert.userId)?.email || '—' }}</p>
                </div>
                <div class="alert-badges">
                  <span class="risk-pill" :class="riskTone(alert.severity)">{{ riskLabel(alert.severity) }}</span>
                  <span class="status-pill" :class="alert.status.toLowerCase()">{{ statusLabel(alert.status) }}</span>
                </div>
              </div>

              <p class="alert-message">{{ alert.message }}</p>
              <div class="alert-meta">
                <span>Creada: {{ formatDate(alert.createdAt) }}</span>
                <span v-if="riskByUser(alert.userId)">Fatiga: <strong>{{ riskByUser(alert.userId)?.fatigueLevel }}%</strong></span>
                <span v-if="alert.resolvedAt">Resuelta: {{ formatDate(alert.resolvedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="alert-actions">
            <button v-if="alert.status === 'ACTIVE'" class="primary-action" @click="resolveAlert(alert)">
              <i class="pi pi-check-circle"></i>
              Resolver
            </button>
            <span v-else class="muted-text">Ya resuelta</span>
          </div>
        </article>

        <p v-if="filtered.length === 0" class="empty-state">No hay alertas para mostrar.</p>
      </section>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, patchResource, fullName } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const users = ref([]), teams = ref([]), members = ref([]), alerts = ref([]), risks = ref([])
const search = ref(''), status = ref(''), severity = ref('')

onMounted(loadData)
async function loadData () {
  ;[users.value, teams.value, members.value, alerts.value, risks.value] = await Promise.all([
    listResource('users'),
    listResource('careTeams'),
    listResource('teamMembers'),
    listResource('clinicalAlerts'),
    listResource('riskAssessments')
  ])
}

const myTeamIds = computed(() => teams.value.filter(t => Number(t.supervisorId) === Number(authStore.user?.id)).map(t => Number(t.id)))
const myDoctorIds = computed(() => [...new Set(members.value.filter(m => myTeamIds.value.includes(Number(m.teamId))).map(m => Number(m.userId)))])
const scopedAlerts = computed(() => alerts.value.filter(a => myDoctorIds.value.includes(Number(a.userId))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
const activeAlerts = computed(() => scopedAlerts.value.filter(a => a.status === 'ACTIVE'))
const resolvedAlerts = computed(() => scopedAlerts.value.filter(a => a.status === 'RESOLVED'))
const highPriorityAlerts = computed(() => scopedAlerts.value.filter(a => ['HIGH', 'CRITICAL'].includes(normalizeRisk(a.severity))))
const filtered = computed(() => scopedAlerts.value.filter(a => {
  const u = userById(a.userId)
  const text = `${fullName(u)} ${u?.email || ''} ${a.message}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!status.value || a.status === status.value) && (!severity.value || normalizeRisk(a.severity) === severity.value)
}))

function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function riskByUser (userId) { return risks.value.find(r => Number(r.userId) === Number(userId)) }
function formatDate (value) { return value ? new Date(value).toLocaleString() : '—' }
function normalizeRisk (value) { return value === 'MEDIUM' ? 'MODERATE' : String(value || 'LOW').toUpperCase() }
function riskTone (value) {
  const risk = normalizeRisk(value)
  if (risk === 'CRITICAL') return 'critical'
  if (risk === 'HIGH') return 'high'
  if (risk === 'MODERATE') return 'moderate'
  return 'low'
}
function riskLabel (value) { return { LOW: 'Baja', MODERATE: 'Moderada', MEDIUM: 'Moderada', HIGH: 'Alta', CRITICAL: 'Crítica' }[value] || value }
function statusLabel (value) { return { ACTIVE: 'Activa', RESOLVED: 'Resuelta' }[value] || value }
async function resolveAlert (alert) {
  await patchResource('clinicalAlerts', alert.id, { status: 'RESOLVED', resolvedAt: new Date().toISOString(), resolvedBy: authStore.user?.id })
  await loadData()
}
</script>
