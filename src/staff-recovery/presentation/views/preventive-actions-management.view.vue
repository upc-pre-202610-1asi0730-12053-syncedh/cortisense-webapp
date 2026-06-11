<template>
  <section>
    <header class="page-header">
      <h1>Acciones preventivas</h1>
      <p>Crea y monitorea acciones para reducir <strong>fatiga y riesgo clínico</strong>.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-clipboard"></i></div><p>Total de acciones</p><h2>{{ assignedActions.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-clock"></i></div><p>Pendientes</p><h2 class="warning-text">{{ pendingActions.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Completadas</p><h2 class="success-text">{{ completedActions.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-times-circle"></i></div><p>Canceladas</p><h2 class="danger-text">{{ cancelledActions.length }}</h2></article>
    </section>

    <section class="management-grid">
      <article class="form-card">
        <h2>Nueva acción</h2>
        <p>Asigna una acción preventiva al personal médico.</p>
        <small v-if="errorMessage" class="form-error">{{ errorMessage }}</small>
        <form @submit.prevent="createAction">
          <div class="field">
            <label>Personal médico</label>
            <select v-model.number="form.userId" class="select" :disabled="assignedDoctors.length === 0">
              <option v-if="assignedDoctors.length" :value="0">Selecciona personal</option>
              <option v-else :value="0">No hay personal médico asignado</option>
              <option v-for="doctor in assignedDoctors" :key="doctor.id" :value="doctor.id">{{ fullName(doctor) }}</option>
            </select>
          </div>
          <div class="field">
            <label>Tipo</label>
            <select v-model="form.type" class="select">
              <option value="RECOVERY_BREAK">Pausa de recuperación</option>
              <option value="HYDRATION">Hidratación</option>
              <option value="MEDICAL_EVALUATION">Evaluación médica</option>
              <option value="SUPERVISOR_CHECK_IN">Seguimiento del supervisor</option>
              <option value="REST_DAY">Descanso programado</option>
            </select>
          </div>
          <div class="field">
            <label>Notas</label>
            <textarea v-model.trim="form.notes" class="textarea" placeholder="Describe la acción preventiva..." required></textarea>
          </div>
          <button class="btn primary" type="submit" :disabled="assignedDoctors.length === 0"><i class="pi pi-plus"></i>Crear acción</button>
        </form>
      </article>

      <section class="actions-panel">
        <article class="content-card">
          <div class="toolbar-row compact-toolbar">
            <input v-model.trim="search" class="input" placeholder="Buscar por personal, tipo o notas...">
            <select v-model="statusFilter" class="select"><option value="">Todas</option><option value="PENDING">Pendientes</option><option value="COMPLETED">Completadas</option><option value="CANCELLED">Canceladas</option></select>
          </div>
        </article>

        <section class="actions-list">
          <article v-for="action in filteredActions" :key="action.id" class="action-card" :class="action.status.toLowerCase()">
            <div class="action-main">
              <div class="action-icon"><i class="pi pi-heart"></i></div>
              <div class="action-content">
                <div class="action-header">
                  <div><h2>{{ actionTypeLabel(action.type) }}</h2><p>{{ fullName(userById(action.userId)) }}</p></div>
                  <span class="status-pill" :class="statusClass(action.status)">{{ actionStatusLabel(action.status) }}</span>
                </div>
                <p class="action-notes">{{ action.notes }}</p>
                <div class="action-meta"><span>Creado: {{ formatDate(action.createdAt) }}</span><span v-if="action.completedAt">Completado: {{ formatDate(action.completedAt) }}</span></div>
              </div>
            </div>
            <div class="action-buttons">
              <button v-if="action.status === 'PENDING'" class="btn ghost" @click="complete(action)"><i class="pi pi-check-circle"></i>Completar</button>
              <button v-if="action.status === 'PENDING'" class="btn danger" @click="cancel(action)"><i class="pi pi-times-circle"></i>Cancelar</button>
              <span v-if="action.status !== 'PENDING'" class="muted-text">Acción cerrada</span>
            </div>
          </article>
          <article v-if="filteredActions.length === 0" class="content-card empty-card"><h2>Sin acciones</h2><p>No hay acciones preventivas para mostrar.</p></article>
        </section>
      </section>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { createResource, listResource, patchResource, fullName } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const users = ref([]), teams = ref([]), members = ref([]), actions = ref([])
const search = ref(''), statusFilter = ref(''), errorMessage = ref('')
const form = reactive({ userId: 0, type: 'RECOVERY_BREAK', notes: '' })

onMounted(loadData)
async function loadData () {
  ;[users.value, teams.value, members.value, actions.value] = await Promise.all([
    listResource('users'), listResource('careTeams'), listResource('teamMembers'), listResource('preventiveActions')
  ])
}

const myTeamIds = computed(() => teams.value.filter(t => Number(t.supervisorId) === Number(authStore.user?.id)).map(t => Number(t.id)))
const myDoctorIds = computed(() => [...new Set(members.value.filter(m => myTeamIds.value.includes(Number(m.teamId))).map(m => Number(m.userId)))])
const assignedDoctors = computed(() => users.value.filter(u => myDoctorIds.value.includes(Number(u.id)) && u.role === 'DOCTOR' && u.status === 'ACTIVE'))
const assignedActions = computed(() => actions.value.filter(a => myDoctorIds.value.includes(Number(a.userId))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
const pendingActions = computed(() => assignedActions.value.filter(a => a.status === 'PENDING'))
const completedActions = computed(() => assignedActions.value.filter(a => a.status === 'COMPLETED'))
const cancelledActions = computed(() => assignedActions.value.filter(a => a.status === 'CANCELLED'))
const filteredActions = computed(() => assignedActions.value.filter(a => {
  const u = userById(a.userId)
  const text = `${fullName(u)} ${a.type} ${a.notes}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!statusFilter.value || a.status === statusFilter.value)
}))

function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function formatDate (value) { return value ? new Date(value).toLocaleString() : '—' }
function statusClass (status) { return status === 'COMPLETED' ? 'active' : status === 'CANCELLED' ? 'inactive' : 'pending' }
function actionStatusLabel (status) { return { PENDING: 'Pendiente', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }[status] || status }
function actionTypeLabel (type) { return { RECOVERY_BREAK: 'Pausa de recuperación', HYDRATION: 'Hidratación', MEDICAL_EVALUATION: 'Evaluación médica', SUPERVISOR_CHECK_IN: 'Seguimiento del supervisor', REST_DAY: 'Descanso programado' }[type] || type }
async function createAction () {
  errorMessage.value = ''
  if (!form.userId || !form.notes.trim()) { errorMessage.value = 'Selecciona un médico y escribe una nota.'; return }
  await createResource('preventiveActions', { organizationId: authStore.user?.organizationId || 1, supervisorId: authStore.user?.id, userId: Number(form.userId), type: form.type, status: 'PENDING', notes: form.notes.trim(), createdAt: new Date().toISOString(), completedAt: null })
  Object.assign(form, { userId: 0, type: 'RECOVERY_BREAK', notes: '' })
  await loadData()
}
async function complete (action) { await patchResource('preventiveActions', action.id, { status: 'COMPLETED', completedAt: new Date().toISOString() }); await loadData() }
async function cancel (action) { await patchResource('preventiveActions', action.id, { status: 'CANCELLED', completedAt: null }); await loadData() }
</script>
