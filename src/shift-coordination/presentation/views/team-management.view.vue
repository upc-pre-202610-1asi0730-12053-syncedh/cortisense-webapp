<template>
  <section>
    <header class="page-header">
      <h1>Gestión de Equipos</h1>
      <p>Organiza al personal en <strong>grupos clínicos</strong> con supervisores asignados.</p>
    </header>

    <small v-if="errorMessage" class="form-error">{{ errorMessage }}</small>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon blue"><i class="pi pi-users"></i></div>
        <p>Total de equipos</p>
        <h2>{{ orgTeams.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon success"><i class="pi pi-users"></i></div>
        <p>Equipos activos</p>
        <h2 class="success-text">{{ activeTeams.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon purple"><i class="pi pi-shield"></i></div>
        <p>Supervisores activos</p>
        <h2 class="purple-text">{{ supervisors.length }}</h2>
      </article>
      <article class="metric-card">
        <div class="metric-icon cyan"><i class="pi pi-briefcase"></i></div>
        <p>Miembros asignados</p>
        <h2 class="cyan-text">{{ assignedDoctorMembers.length }}</h2>
      </article>
    </section>

    <section class="management-grid">
      <article class="form-card">
        <h2>Nuevo equipo</h2>
        <p>Crea un grupo y asigna un supervisor clínico.</p>

        <form @submit.prevent="saveTeam">
          <div class="field">
            <label>Nombre del equipo</label>
            <input v-model.trim="form.name" class="input" placeholder="Ej: Grupo A" required>
          </div>

          <div class="field">
            <label>Área de trabajo</label>
            <select v-model.number="form.workAreaId" class="select" required>
              <option :value="0">Selecciona un área</option>
              <option v-for="area in workAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
            </select>
          </div>

          <div class="field">
            <label>Supervisor clínico</label>
            <select v-model.number="form.supervisorId" class="select" :disabled="availableSupervisorsForNewTeam.length === 0">
              <option v-if="availableSupervisorsForNewTeam.length" :value="0">Sin supervisor</option>
              <option v-else :value="0">No hay supervisor disponible</option>
              <option v-for="supervisor in availableSupervisorsForNewTeam" :key="supervisor.id" :value="supervisor.id">
                {{ fullName(supervisor) }}
              </option>
            </select>
            <small v-if="availableSupervisorsForNewTeam.length === 0" class="helper-text danger-text">No hay supervisor disponible</small>
          </div>

          <button class="btn primary" type="submit">
            <i class="pi pi-plus"></i>
            Crear equipo
          </button>
        </form>
      </article>

      <section class="teams-panel">
        <article class="content-card">
          <div class="toolbar-row compact-toolbar">
            <input v-model.trim="search" class="input" placeholder="Buscar por nombre o área...">
            <select v-model.number="areaFilter" class="select">
              <option :value="0">Todas las áreas</option>
              <option v-for="area in workAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
            </select>
          </div>
        </article>

        <section class="teams-list">
          <article v-for="team in filteredTeams" :key="team.id" class="team-card">
            <div class="team-card-header">
              <div>
                <h2>{{ team.name }}</h2>
                <p>{{ areaName(team.workAreaId) }}</p>
              </div>
              <div class="team-actions">
                <span class="status-pill" :class="team.status === 'ACTIVE' ? 'active' : 'inactive'">
                  {{ team.status === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
                </span>
                <button class="btn" :class="team.status === 'ACTIVE' ? 'danger' : 'ghost'" @click="toggleTeam(team)">
                  {{ team.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="btn danger" @click="deleteTeam(team)">Eliminar</button>
              </div>
            </div>

            <div class="team-section">
              <label>Supervisor asignado</label>
              <select class="select" :value="team.supervisorId || 0" @change="updateSupervisor(team, $event.target.value)">
                <option :value="0">Sin supervisor</option>
                <option v-for="supervisor in availableSupervisorsForTeam(team)" :key="supervisor.id" :value="supervisor.id">
                  {{ fullName(supervisor) }}
                </option>
                <option v-if="availableSupervisorsForTeam(team).length === 0" disabled>No hay supervisor disponible</option>
              </select>
              <small v-if="availableSupervisorsForTeam(team).length === 0" class="helper-text">No hay supervisor disponible para cambiar.</small>
            </div>

            <div class="team-section">
              <label>Agregar personal médico</label>
              <div class="member-add-row">
                <select v-model.number="selectedMemberByTeam[team.id]" class="select" :disabled="availableDoctorsForTeam(team).length === 0">
                  <option v-if="availableDoctorsForTeam(team).length" :value="0">Selecciona un miembro</option>
                  <option v-else :value="0">No hay personal médico disponible</option>
                  <option v-for="doctor in availableDoctorsForTeam(team)" :key="doctor.id" :value="doctor.id">
                    {{ fullName(doctor) }}
                  </option>
                </select>
                <button class="btn ghost" :disabled="availableDoctorsForTeam(team).length === 0 || !selectedMemberByTeam[team.id]" @click="addMember(team)">
                  <i class="pi pi-plus"></i>
                  Agregar
                </button>
              </div>
              <small v-if="availableDoctorsForTeam(team).length === 0" class="helper-text">No hay personal médico disponible</small>
            </div>

            <div class="member-list">
              <div v-for="member in membersForTeam(team.id)" :key="member.id" class="member-item">
                <div class="member-main">
                  <div class="avatar">{{ initials(userById(member.userId)) }}</div>
                  <div>
                    <strong>{{ fullName(userById(member.userId)) }}</strong>
                    <small>{{ userById(member.userId)?.email }}</small>
                  </div>
                </div>
                <button class="btn danger icon" @click="removeMember(member)"><i class="pi pi-trash"></i></button>
              </div>
              <p v-if="membersForTeam(team.id).length === 0" class="empty-members">Este equipo todavía no tiene personal médico asignado.</p>
            </div>
          </article>
        </section>
      </section>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { createResource, deleteResource, listResource, patchResource, fullName, initials } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const teams = ref([])
const users = ref([])
const members = ref([])
const workAreas = ref([])
const search = ref('')
const areaFilter = ref(0)
const errorMessage = ref('')
const selectedMemberByTeam = reactive({})
const form = reactive({ name: '', organizationId: 1, workAreaId: 0, supervisorId: 0, status: 'ACTIVE' })

const orgId = computed(() => Number(authStore.user?.organizationId || 1))

onMounted(loadData)

async function loadData () {
  ;[teams.value, users.value, members.value, workAreas.value] = await Promise.all([
    listResource('careTeams'),
    listResource('users'),
    listResource('teamMembers'),
    listResource('workAreas')
  ])
  form.organizationId = orgId.value
}

const orgTeams = computed(() => teams.value.filter(t => Number(t.organizationId) === orgId.value))
const activeTeams = computed(() => orgTeams.value.filter(t => t.status === 'ACTIVE'))
const orgUsers = computed(() => users.value.filter(u => Number(u.organizationId) === orgId.value))
const supervisors = computed(() => orgUsers.value.filter(u => u.role === 'SUPERVISOR' && u.status === 'ACTIVE'))
const doctors = computed(() => orgUsers.value.filter(u => u.role === 'DOCTOR' && u.status === 'ACTIVE'))
const assignedSupervisorIds = computed(() => new Set(orgTeams.value.map(t => Number(t.supervisorId)).filter(Boolean)))
const assignedDoctorIds = computed(() => new Set(orgMembers.value.map(m => Number(m.userId)).filter(Boolean)))
const orgMembers = computed(() => members.value.filter(m => orgTeams.value.some(t => Number(t.id) === Number(m.teamId))))
const assignedDoctorMembers = computed(() => orgMembers.value.filter(m => userById(m.userId)?.role === 'DOCTOR' && userById(m.userId)?.status === 'ACTIVE'))

const availableSupervisorsForNewTeam = computed(() => supervisors.value.filter(supervisor => !assignedSupervisorIds.value.has(Number(supervisor.id))))

const filteredTeams = computed(() => orgTeams.value.filter(t => {
  const text = `${t.name} ${areaName(t.workAreaId)} ${fullName(userById(t.supervisorId))}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!areaFilter.value || Number(t.workAreaId) === Number(areaFilter.value))
}))

function userById (id) {
  return users.value.find(u => Number(u.id) === Number(id))
}

function areaName (id) {
  return workAreas.value.find(a => Number(a.id) === Number(id))?.name || '—'
}

function membersForTeam (id) {
  return members.value.filter(m => Number(m.teamId) === Number(id) && userById(m.userId)?.role === 'DOCTOR')
}

function availableSupervisorsForTeam (team) {
  return supervisors.value.filter(supervisor => Number(supervisor.id) === Number(team.supervisorId) || !assignedSupervisorIds.value.has(Number(supervisor.id)))
}

function availableDoctorsForTeam () {
  return doctors.value.filter(doctor => !assignedDoctorIds.value.has(Number(doctor.id)))
}

async function saveTeam () {
  errorMessage.value = ''
  if (!form.name.trim() || !form.workAreaId) return
  if (form.supervisorId && assignedSupervisorIds.value.has(Number(form.supervisorId))) {
    errorMessage.value = 'El supervisor seleccionado ya está asignado a otro equipo.'
    return
  }
  await createResource('careTeams', {
    name: form.name.trim(),
    organizationId: orgId.value,
    workAreaId: Number(form.workAreaId),
    supervisorId: Number(form.supervisorId) || null,
    status: 'ACTIVE'
  })
  Object.assign(form, { name: '', organizationId: orgId.value, workAreaId: 0, supervisorId: 0, status: 'ACTIVE' })
  await loadData()
}

async function updateSupervisor (team, supervisorId) {
  errorMessage.value = ''
  const nextSupervisorId = Number(supervisorId) || null
  if (nextSupervisorId && assignedSupervisorIds.value.has(nextSupervisorId) && Number(team.supervisorId) !== nextSupervisorId) {
    errorMessage.value = 'El supervisor seleccionado ya está asignado a otro equipo.'
    return
  }
  await patchResource('careTeams', team.id, { supervisorId: nextSupervisorId })
  await loadData()
}

async function toggleTeam (team) {
  await patchResource('careTeams', team.id, { status: team.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
  await loadData()
}

async function deleteTeam (team) {
  const teamMemberIds = membersForTeam(team.id).map(member => member.id)
  await Promise.all(teamMemberIds.map(id => deleteResource('teamMembers', id)))
  await deleteResource('careTeams', team.id)
  await loadData()
}

async function addMember (team) {
  errorMessage.value = ''
  const userId = Number(selectedMemberByTeam[team.id])
  if (!userId) return
  if (assignedDoctorIds.value.has(userId)) {
    errorMessage.value = 'El personal médico seleccionado ya pertenece a un equipo.'
    return
  }
  await createResource('teamMembers', { teamId: team.id, userId, assignedAt: new Date().toISOString() })
  selectedMemberByTeam[team.id] = 0
  await loadData()
}

async function removeMember (member) {
  await deleteResource('teamMembers', member.id)
  await loadData()
}
</script>
