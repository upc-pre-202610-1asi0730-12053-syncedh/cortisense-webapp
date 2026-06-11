<template>
  <section>
    <header class="page-header">
      <h1>Anomalías biométricas</h1>
      <p>Revisa eventos anómalos de <strong>signos vitales</strong> en el personal asignado.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon warning"><i class="pi pi-bolt"></i></div>
        <p>Abiertas</p>
        <h2 class="warning-text">{{ openAnomalies.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon danger"><i class="pi pi-exclamation-triangle"></i></div>
        <p>Críticas</p>
        <h2 class="danger-text">{{ criticalAnomalies.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon success"><i class="pi pi-check-circle"></i></div>
        <p>Revisadas</p>
        <h2 class="success-text">{{ reviewedAnomalies.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon blue"><i class="pi pi-users"></i></div>
        <p>Total</p>
        <h2>{{ scopedAnomalies.length }}</h2>
      </article>
    </section>

    <article class="content-card full-width supervisor-list-card">
      <div class="toolbar-row alert-toolbar">
        <input v-model.trim="search" class="input" placeholder="Buscar por personal, tipo o mensaje...">
        <select v-model="status" class="select">
          <option value="">Todos los estados</option>
          <option value="OPEN">Abierta</option>
          <option value="REVIEWED">Revisada</option>
          <option value="DISMISSED">Descartada</option>
        </select>
        <select v-model="severity" class="select">
          <option value="">Todas las severidades</option>
          <option value="LOW">Baja</option>
          <option value="MODERATE">Moderada</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </select>
      </div>

      <section class="anomalies-list visual-anomalies-list">
        <article v-for="item in filtered" :key="item.id" class="anomaly-card" :class="riskTone(item.severity)">
          <div class="anomaly-main">
            <div class="anomaly-icon"><i class="pi pi-bolt"></i></div>
            <div class="anomaly-content">
              <div class="anomaly-header">
                <div>
                  <h2>{{ typeLabel(item.type) }}</h2>
                  <p>{{ fullName(userById(item.userId)) }} · {{ userById(item.userId)?.email || '—' }}</p>
                </div>
                <div class="anomaly-badges">
                  <span class="risk-pill" :class="riskTone(item.severity)">{{ riskLabel(item.severity) }}</span>
                  <span class="status-pill" :class="String(item.status).toLowerCase()">{{ statusLabel(item.status) }}</span>
                </div>
              </div>

              <p class="anomaly-message">{{ item.message }}</p>
              <div class="anomaly-values">
                <div class="value-item"><span>Valor</span><strong>{{ item.value }}</strong></div>
                <div class="value-item"><span>Umbral</span><strong>{{ item.threshold }}</strong></div>
                <div class="value-item"><span>Detectada</span><strong>{{ formatDate(item.detectedAt) }}</strong></div>
              </div>
              <div class="anomaly-meta">
                <span v-if="item.reviewedAt">Revisada: {{ formatDate(item.reviewedAt) }}</span>
                <span v-if="item.reviewedBy">Por supervisor #{{ item.reviewedBy }}</span>
              </div>
            </div>
          </div>

          <div class="anomaly-actions">
            <button v-if="item.status === 'OPEN'" class="action-button success" @click="review(item)">
              <i class="pi pi-check-circle"></i>
              Revisar
            </button>
            <button v-if="item.status === 'OPEN'" class="action-button danger" @click="dismiss(item)">
              <i class="pi pi-times-circle"></i>
              Descartar
            </button>
            <span v-if="item.status !== 'OPEN'" class="muted-text">Cerrada</span>
          </div>
        </article>

        <p v-if="filtered.length === 0" class="empty-state">No hay anomalías para mostrar.</p>
      </section>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, patchResource, fullName } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const users = ref([]), teams = ref([]), members = ref([]), anomalies = ref([])
const search = ref(''), status = ref(''), severity = ref('')

onMounted(loadData)
async function loadData () {
  ;[users.value, teams.value, members.value, anomalies.value] = await Promise.all([
    listResource('users'),
    listResource('careTeams'),
    listResource('teamMembers'),
    listResource('vitalSignAnomalies')
  ])
}

const myTeamIds = computed(() => teams.value.filter(t => Number(t.supervisorId) === Number(authStore.user?.id)).map(t => Number(t.id)))
const myDoctorIds = computed(() => [...new Set(members.value.filter(m => myTeamIds.value.includes(Number(m.teamId))).map(m => Number(m.userId)))])
const scopedAnomalies = computed(() => anomalies.value.filter(a => myDoctorIds.value.includes(Number(a.userId))).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt)))
const openAnomalies = computed(() => scopedAnomalies.value.filter(a => a.status === 'OPEN'))
const reviewedAnomalies = computed(() => scopedAnomalies.value.filter(a => a.status === 'REVIEWED'))
const criticalAnomalies = computed(() => scopedAnomalies.value.filter(a => normalizeRisk(a.severity) === 'CRITICAL'))
const filtered = computed(() => scopedAnomalies.value.filter(a => {
  const u = userById(a.userId)
  const text = `${fullName(u)} ${u?.email || ''} ${a.type} ${a.message}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!status.value || a.status === status.value) && (!severity.value || normalizeRisk(a.severity) === severity.value)
}))

function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function normalizeRisk (value) { return value === 'MEDIUM' ? 'MODERATE' : String(value || 'LOW').toUpperCase() }
function riskTone (value) {
  const risk = normalizeRisk(value)
  if (risk === 'CRITICAL') return 'critical'
  if (risk === 'HIGH') return 'high'
  if (risk === 'MODERATE') return 'moderate'
  return 'low'
}
function riskLabel (value) { return { LOW: 'Baja', MODERATE: 'Moderada', MEDIUM: 'Moderada', HIGH: 'Alta', CRITICAL: 'Crítica' }[value] || value }
function statusLabel (value) { return { OPEN: 'Abierta', REVIEWED: 'Revisada', DISMISSED: 'Descartada' }[value] || value }
function typeLabel (value) { return String(value || '').replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase()) }
function formatDate (value) { return value ? new Date(value).toLocaleString() : '—' }
async function review (item) {
  await patchResource('vitalSignAnomalies', item.id, { status: 'REVIEWED', reviewedAt: new Date().toISOString(), reviewedBy: authStore.user?.id })
  await loadData()
}
async function dismiss (item) {
  await patchResource('vitalSignAnomalies', item.id, { status: 'DISMISSED', reviewedAt: new Date().toISOString(), reviewedBy: authStore.user?.id })
  await loadData()
}
</script>
