<template>
  <section>
    <header class="page-header">
      <h1>Panel de Supervisión</h1>
      <p>Monitorea el <strong>riesgo clínico</strong> del personal asignado a tus equipos.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-users"></i></div><p>Personal asignado</p><h2>{{ assignedDoctors.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-exclamation-triangle"></i></div><p>Riesgo alto/crítico</p><h2 class="danger-text">{{ highRisk.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-bell"></i></div><p>Alertas activas</p><h2 class="warning-text">{{ activeAlerts.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Acciones del día</p><h2 class="success-text">{{ actionsToday.length }}</h2></article>
    </section>

    <section class="content-grid supervisor-grid">
      <article class="content-card">
        <div class="section-header">
          <div>
            <h2>Fatiga del equipo</h2>
            <p>Resumen del personal médico bajo tu supervisión.</p>
          </div>
          <div class="average-fatigue">
            <span>{{ averageFatigue }}%</span>
            <small>Promedio</small>
          </div>
        </div>

        <div class="doctor-risk-list">
          <div v-for="doctor in assignedDoctors" :key="doctor.id" class="doctor-risk-item">
            <div class="staff-profile">
              <div class="avatar">{{ initials(doctor) }}</div>
              <div>
                <strong>{{ fullName(doctor) }}</strong>
                <span>{{ doctor.email }}</span>
              </div>
            </div>
            <template v-if="riskByUserId(doctor.id)">
              <div class="risk-info">
                <span class="risk-pill" :class="riskClass(riskByUserId(doctor.id).riskLevel)">{{ riskLabel(riskByUserId(doctor.id).riskLevel) }}</span>
                <strong>{{ riskByUserId(doctor.id).fatigueLevel }}%</strong>
              </div>
              <div class="progress-track"><div class="progress-fill" :class="riskClass(riskByUserId(doctor.id).riskLevel)" :style="{ width: `${riskByUserId(doctor.id).fatigueLevel}%` }"></div></div>
            </template>
            <span v-else class="muted-text">Sin datos de riesgo</span>
          </div>
          <p v-if="assignedDoctors.length === 0" class="empty-state">No tienes personal médico asignado todavía.</p>
        </div>
      </article>

      <article class="content-card">
        <div class="section-header">
          <div>
            <h2>Alertas clínicas activas</h2>
            <p>Eventos críticos o preventivos pendientes.</p>
          </div>
        </div>

        <div class="alerts-list">
          <div v-for="alert in activeAlerts" :key="alert.id" class="alert-item" :class="riskClass(alert.severity)">
            <div class="alert-icon"><i class="pi pi-bell"></i></div>
            <div>
              <strong>{{ fullName(userById(alert.userId)) }}</strong>
              <p>{{ alert.message }}</p>
              <span>{{ formatDate(alert.createdAt) }}</span>
            </div>
          </div>
          <p v-if="activeAlerts.length === 0" class="empty-state">No hay alertas activas para tus equipos.</p>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, fullName, initials, riskClass } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const users = ref([])
const teams = ref([])
const members = ref([])
const risks = ref([])
const alerts = ref([])
const actions = ref([])

onMounted(async () => {
  ;[users.value, teams.value, members.value, risks.value, alerts.value, actions.value] = await Promise.all([
    listResource('users'),
    listResource('careTeams'),
    listResource('teamMembers'),
    listResource('riskAssessments'),
    listResource('clinicalAlerts'),
    listResource('preventiveActions')
  ])
})

const myTeamIds = computed(() => teams.value.filter(t => Number(t.supervisorId) === Number(authStore.user?.id)).map(t => Number(t.id)))
const myDoctorIds = computed(() => [...new Set(members.value.filter(m => myTeamIds.value.includes(Number(m.teamId))).map(m => Number(m.userId)))])
const assignedDoctors = computed(() => users.value.filter(u => myDoctorIds.value.includes(Number(u.id)) && u.role === 'DOCTOR' && u.status === 'ACTIVE'))
const assignedRisks = computed(() => risks.value.filter(r => myDoctorIds.value.includes(Number(r.userId))))
const highRisk = computed(() => assignedRisks.value.filter(r => ['HIGH', 'CRITICAL'].includes(r.riskLevel)))
const activeAlerts = computed(() => alerts.value.filter(a => myDoctorIds.value.includes(Number(a.userId)) && a.status === 'ACTIVE'))
const actionsToday = computed(() => actions.value.filter(a => Number(a.supervisorId) === Number(authStore.user?.id) && isToday(a.createdAt)))
const averageFatigue = computed(() => assignedRisks.value.length ? Math.round(assignedRisks.value.reduce((sum, r) => sum + Number(r.fatigueLevel || 0), 0) / assignedRisks.value.length) : 0)

function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function riskByUserId (id) { return assignedRisks.value.find(r => Number(r.userId) === Number(id)) }
function isToday (value) { if (!value) return false; const d = new Date(value); const now = new Date(); return d.toDateString() === now.toDateString() }
function formatDate (value) { return value ? new Date(value).toLocaleString() : '—' }
function riskLabel (value) { return { LOW: 'Bajo', MODERATE: 'Moderado', MEDIUM: 'Moderado', HIGH: 'Alto', CRITICAL: 'Crítico' }[value] || value }
</script>
