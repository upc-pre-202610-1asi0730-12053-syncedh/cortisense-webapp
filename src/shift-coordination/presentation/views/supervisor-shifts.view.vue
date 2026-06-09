<template>
  <section class="supervisor-shifts-page">
    <header class="page-header">
      <h1>Turnos del equipo</h1>
      <p>Programa y controla turnos del <strong>personal médico asignado</strong>.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon blue"><i class="pi pi-calendar"></i></div>
        <p>Programados</p>
        <h2>{{ scheduled.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon warning"><i class="pi pi-clock"></i></div>
        <p>En curso</p>
        <h2 class="warning-text">{{ active.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon success"><i class="pi pi-check-circle"></i></div>
        <p>Completados</p>
        <h2 class="success-text">{{ completed.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon danger"><i class="pi pi-times-circle"></i></div>
        <p>Cancelados</p>
        <h2 class="danger-text">{{ cancelled.length }}</h2>
      </article>
    </section>

    <section class="supervisor-shift-grid">
      <article class="form-card shift-form-card">
        <div class="section-heading">
          <h2>Nuevo turno</h2>
          <p>Asigna un turno a un integrante de tus equipos.</p>
        </div>

        <small v-if="errorMessage" class="form-error">{{ errorMessage }}</small>

        <form class="shift-form" @submit.prevent="saveShift">
          <label>
            <span>Personal médico</span>
            <select v-model.number="form.userId" class="select" :disabled="assignedDoctors.length === 0">
              <option v-if="assignedDoctors.length" :value="0">Selecciona personal</option>
              <option v-else :value="0">No hay personal médico asignado</option>
              <option v-for="doctor in assignedDoctors" :key="doctor.id" :value="doctor.id">
                {{ fullName(doctor) }} · {{ teamNameForUser(doctor.id) }}
              </option>
            </select>
          </label>

          <label>
            <span>Tipo de turno</span>
            <select v-model="form.type" class="select">
              <option value="DAY">Día</option>
              <option value="NIGHT">Noche</option>
              <option value="EMERGENCY">Emergencia</option>
            </select>
          </label>

          <div class="form-row">
            <label>
              <span>Área</span>
              <select v-model.number="form.workAreaId" class="select">
                <option :value="0">Selecciona área</option>
                <option v-for="area in workAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
              </select>
            </label>
            <label>
              <span>Inicio</span>
              <input v-model="form.scheduledStart" class="input" type="datetime-local">
            </label>
            <label>
              <span>Fin</span>
              <input v-model="form.scheduledEnd" class="input" type="datetime-local">
            </label>
          </div>

          <button class="btn primary full-button" type="submit" :disabled="assignedDoctors.length === 0">
            <i class="pi pi-plus-circle"></i>
            Crear turno
          </button>
        </form>
      </article>

      <article class="doctors-card assigned-staff-card">
        <div class="section-heading">
          <h2>Personal asignado</h2>
          <p>Médicos que pertenecen a tus equipos activos.</p>
        </div>

        <div class="doctor-list">
          <div v-for="doctor in assignedDoctors" :key="doctor.id" class="doctor-item">
            <div class="avatar">{{ initials(doctor) }}</div>
            <div>
              <strong>{{ fullName(doctor) }}</strong>
              <span>{{ doctor.email }}</span>
              <small>{{ teamNameForUser(doctor.id) }} · {{ areaName(doctor.workAreaId) }}</small>
            </div>
          </div>
          <div v-if="assignedDoctors.length === 0" class="empty-state compact">No hay personal asignado.</div>
        </div>
      </article>
    </section>

    <section class="table-card supervisor-shifts-table-card">
      <div class="table-header">
        <div class="section-heading">
          <h2>Turnos programados</h2>
          <p>Historial operativo de turnos del personal asignado.</p>
        </div>
        <div class="filters">
          <input v-model.trim="search" class="input" placeholder="Buscar por personal, área o tipo...">
          <select v-model="statusFilter" class="select">
            <option value="">Todos los estados</option>
            <option value="SCHEDULED">Programado</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="COMPLETED">Completado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table shifts-table">
          <thead>
            <tr>
              <th>Personal</th>
              <th>Equipo</th>
              <th>Área</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Horas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="shift in filteredShifts" :key="shift.id">
              <td>
                <div class="staff-profile">
                  <div class="avatar">{{ initials(userById(shift.userId)) }}</div>
                  <div>
                    <strong>{{ fullName(userById(shift.userId)) }}</strong>
                    <span>{{ userById(shift.userId)?.email }}</span>
                  </div>
                </div>
              </td>
              <td>{{ teamNameForUser(shift.userId) }}</td>
              <td>{{ areaName(shift.workAreaId) }}</td>
              <td>{{ shiftTypeLabel(shift.type) }}</td>
              <td>{{ formatDay(shift.scheduledStart) }}</td>
              <td>{{ formatHour(shift.scheduledStart) }} - {{ formatHour(shift.scheduledEnd) }}</td>
              <td>{{ shiftHours(shift) }}</td>
              <td><span class="status-pill" :class="shiftStatusClass(shift.status)">{{ shiftStatusLabel(shift.status) }}</span></td>
              <td>
                <button v-if="shift.status === 'SCHEDULED'" class="danger-button" @click="cancelShift(shift)">Cancelar</button>
                <span v-else class="muted-text">Cerrado</span>
              </td>
            </tr>
            <tr v-if="filteredShifts.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <strong>No hay turnos programados</strong>
                  <span>No se encontraron turnos para los filtros seleccionados.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { createResource, listResource, patchResource, fullName, initials } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const shifts = ref([]), users = ref([]), workAreas = ref([]), teams = ref([]), members = ref([])
const search = ref(''), statusFilter = ref(''), errorMessage = ref('')
const form = reactive({ organizationId: 1, userId: 0, workAreaId: 0, type: 'DAY', scheduledStart: '', scheduledEnd: '' })

onMounted(loadData)
async function loadData () {
  ;[shifts.value, users.value, workAreas.value, teams.value, members.value] = await Promise.all([
    listResource('shiftRecords'), listResource('users'), listResource('workAreas'), listResource('careTeams'), listResource('teamMembers')
  ])
}

const myTeamIds = computed(() => teams.value.filter(t => Number(t.supervisorId) === Number(authStore.user?.id)).map(t => Number(t.id)))
const myDoctorIds = computed(() => [...new Set(members.value.filter(m => myTeamIds.value.includes(Number(m.teamId))).map(m => Number(m.userId)))])
const assignedDoctors = computed(() => users.value.filter(u => myDoctorIds.value.includes(Number(u.id)) && u.role === 'DOCTOR' && u.status === 'ACTIVE'))
const scopedShifts = computed(() => shifts.value.filter(s => myDoctorIds.value.includes(Number(s.userId))).sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart)))
const scheduled = computed(() => scopedShifts.value.filter(s => s.status === 'SCHEDULED'))
const active = computed(() => scopedShifts.value.filter(s => s.status === 'IN_PROGRESS'))
const completed = computed(() => scopedShifts.value.filter(s => s.status === 'COMPLETED'))
const cancelled = computed(() => scopedShifts.value.filter(s => s.status === 'CANCELLED'))
const filteredShifts = computed(() => scopedShifts.value.filter(s => {
  const u = userById(s.userId)
  const text = `${fullName(u)} ${u?.email || ''} ${teamNameForUser(s.userId)} ${areaName(s.workAreaId)} ${s.type}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!statusFilter.value || s.status === statusFilter.value)
}))

function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function teamForUser (userId) {
  const member = members.value.find(m => Number(m.userId) === Number(userId) && myTeamIds.value.includes(Number(m.teamId)))
  return teams.value.find(t => Number(t.id) === Number(member?.teamId))
}
function teamNameForUser (userId) { return teamForUser(userId)?.name || '—' }
function areaName (id) { return workAreas.value.find(a => Number(a.id) === Number(id))?.name || '—' }
function formatDay (value) { return value ? new Date(value).toISOString().slice(0, 10) : '—' }
function formatHour (value) { return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }
function shiftHours (shift) {
  const start = new Date(shift.scheduledStart)
  const end = new Date(shift.scheduledEnd)
  const hours = Math.max(0, (end - start) / 36e5)
  return `${hours.toFixed(hours % 1 ? 1 : 0)} h`
}
function shiftStatusClass (status) { return { SCHEDULED: 'scheduled', IN_PROGRESS: 'in-progress', COMPLETED: 'completed', CANCELLED: 'cancelled' }[status] || 'scheduled' }
function shiftStatusLabel (status) { return { SCHEDULED: 'Programado', IN_PROGRESS: 'En curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' }[status] || status }
function shiftTypeLabel (type) { return { DAY: 'Día', NIGHT: 'Noche', EMERGENCY: 'Emergencia' }[type] || type }
async function saveShift () {
  errorMessage.value = ''
  if (!form.userId || !form.workAreaId || !form.scheduledStart || !form.scheduledEnd) {
    errorMessage.value = 'Completa todos los campos del turno.'
    return
  }
  await createResource('shiftRecords', {
    organizationId: authStore.user?.organizationId || 1,
    userId: Number(form.userId),
    workAreaId: Number(form.workAreaId),
    type: form.type,
    status: 'SCHEDULED',
    scheduledStart: new Date(form.scheduledStart).toISOString(),
    scheduledEnd: new Date(form.scheduledEnd).toISOString(),
    checkInAt: null,
    checkOutAt: null
  })
  Object.assign(form, { organizationId: authStore.user?.organizationId || 1, userId: 0, workAreaId: 0, type: 'DAY', scheduledStart: '', scheduledEnd: '' })
  await loadData()
}
async function cancelShift (shift) { await patchResource('shiftRecords', shift.id, { status: 'CANCELLED' }); await loadData() }
</script>
