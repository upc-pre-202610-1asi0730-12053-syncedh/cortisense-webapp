<template>
  <section>
    <header class="page-header">
      <h1>Mi recuperación</h1>
      <p>Seguimiento preventivo personalizado para <strong>{{ fullName(authStore.user) }}</strong>.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-shield"></i></div><p>Puntaje de recuperación</p><h2>{{ recoveryScore }}%</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-clock"></i></div><p>Acciones pendientes</p><h2 class="warning-text">{{ pendingActions.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-exclamation-triangle"></i></div><p>Alertas activas</p><h2 class="danger-text">{{ activeAlerts.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Acciones completadas</p><h2 class="success-text">{{ completedActions.length }}</h2></article>
    </section>

    <section class="content-grid doctor-health-grid">
      <article class="recovery-card" :class="recoveryStatusClass">
        <div class="recovery-header">
          <div>
            <span class="risk-pill" :class="recoveryStatusClass">{{ recoveryStatusLabel }}</span>
            <h2>Estado de recuperación</h2>
            <p>{{ recoveryMessage }}</p>
          </div>
          <div class="recovery-score" :class="recoveryStatusClass"><strong>{{ recoveryScore }}%</strong><span>Recuperación</span></div>
        </div>
        <div class="progress-track"><div class="progress-fill" :class="recoveryStatusClass" :style="{ width: `${recoveryScore}%` }"></div></div>
        <div class="risk-summary" v-if="currentRisk">
          <div><span>Fatiga</span><strong>{{ currentRisk.fatigueLevel }}%</strong></div>
          <div><span>Frecuencia</span><strong>{{ currentRisk.heartRate }} bpm</strong></div>
          <div><span>HRV</span><strong>{{ currentRisk.hrv }} ms</strong></div>
        </div>
      </article>

      <article class="content-card">
        <div class="section-header"><div><h2>Recomendaciones</h2><p>Sugerencias según tu estado actual.</p></div></div>
        <div class="recommendations-list">
          <div v-for="item in recommendations" :key="item" class="recommendation-item"><div class="recommendation-icon"><i class="pi pi-heart"></i></div><p>{{ item }}</p></div>
        </div>
      </article>
    </section>

    <section class="content-grid lower-grid">
      <article class="content-card">
        <div class="section-header"><div><h2>Acciones pendientes</h2><p>Completa las acciones asignadas por tu supervisor.</p></div></div>
        <div class="actions-list compact-actions">
          <article v-for="action in pendingActions" :key="action.id" class="action-card pending">
            <div class="action-content"><span class="action-type">{{ actionTypeLabel(action.type) }}</span><h3>{{ action.notes }}</h3><p>Creado: {{ formatDate(action.createdAt) }}</p></div>
            <button class="btn ghost" @click="complete(action)"><i class="pi pi-check-circle"></i>Marcar completada</button>
          </article>
          <p v-if="pendingActions.length === 0" class="empty-state">No tienes acciones pendientes.</p>
        </div>
      </article>

      <article class="content-card">
        <div class="section-header"><div><h2>Historial de recuperación</h2><p>Acciones preventivas registradas.</p></div></div>
        <div class="history-list">
          <article v-for="action in actions" :key="action.id" class="history-item" :class="statusClass(action.status)">
            <div><span class="status-pill" :class="statusClass(action.status)">{{ statusLabel(action.status) }}</span><h3>{{ actionTypeLabel(action.type) }}</h3><p>{{ action.notes }}</p><small>{{ formatDate(action.createdAt) }}</small></div>
          </article>
          <p v-if="actions.length === 0" class="empty-state">Aún no tienes historial de recuperación.</p>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, patchResource, fullName } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const actions = ref([]), risks = ref([]), alerts = ref([])

onMounted(loadData)
async function loadData () {
  ;[actions.value, risks.value, alerts.value] = await Promise.all([
    listResource('preventiveActions', { userId: authStore.user?.id }),
    listResource('riskAssessments', { userId: authStore.user?.id }),
    listResource('clinicalAlerts', { userId: authStore.user?.id })
  ])
  actions.value = actions.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

const pendingActions = computed(() => actions.value.filter(a => a.status === 'PENDING'))
const completedActions = computed(() => actions.value.filter(a => a.status === 'COMPLETED'))
const activeAlerts = computed(() => alerts.value.filter(a => a.status === 'ACTIVE'))
const currentRisk = computed(() => [...risks.value].sort((a, b) => new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt)).at(-1))
const recoveryScore = computed(() => Math.max(0, Math.min(100, 100 - Number(currentRisk.value?.fatigueLevel || 0) + completedActions.value.length * 4)))
const recoveryStatusClass = computed(() => recoveryScore.value >= 75 ? 'success' : recoveryScore.value >= 50 ? 'info' : recoveryScore.value >= 30 ? 'warning' : 'danger')
const recoveryStatusLabel = computed(() => recoveryScore.value >= 75 ? 'Óptimo' : recoveryScore.value >= 50 ? 'En seguimiento' : recoveryScore.value >= 30 ? 'Requiere pausa' : 'Crítico')
const recoveryMessage = computed(() => recoveryScore.value >= 75 ? 'Tu recuperación se mantiene estable.' : recoveryScore.value >= 50 ? 'Mantén seguimiento de fatiga y pausas preventivas.' : recoveryScore.value >= 30 ? 'Prioriza descanso y completa tus acciones pendientes.' : 'Solicita apoyo del supervisor antes de continuar tareas críticas.')
const recommendations = computed(() => recoveryScore.value >= 75 ? ['Mantén hidratación durante el turno.', 'Realiza micro pausas programadas.', 'Revisa tus signos vitales al finalizar la jornada.'] : ['Completa tus acciones preventivas pendientes.', 'Toma una pausa de recuperación antes de una tarea crítica.', 'Comunica síntomas de fatiga a tu supervisor.'])

function formatDate (value) { return value ? new Date(value).toLocaleString() : '—' }
function statusClass (status) { return status === 'COMPLETED' ? 'active' : status === 'CANCELLED' ? 'inactive' : 'pending' }
function statusLabel (status) { return { PENDING: 'Pendiente', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }[status] || status }
function actionTypeLabel (type) { return { RECOVERY_BREAK: 'Pausa de recuperación', HYDRATION: 'Hidratación', MEDICAL_EVALUATION: 'Evaluación médica', SUPERVISOR_CHECK_IN: 'Seguimiento del supervisor', REST_DAY: 'Descanso programado' }[type] || type }
async function complete (action) { await patchResource('preventiveActions', action.id, { status: 'COMPLETED', completedAt: new Date().toISOString() }); await loadData() }
</script>
