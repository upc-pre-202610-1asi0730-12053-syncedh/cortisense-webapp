<template>
  <section>
    <header class="page-header">
      <h1>Gestión de Personal</h1>
      <p>Administra usuarios, <strong>roles</strong> y estados del personal médico.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-users"></i></div><p>Total de usuarios</p><h2>{{ orgUsers.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Usuarios activos</p><h2 class="success-text">{{ activeUsers.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon purple"><i class="pi pi-shield"></i></div><p>Supervisores</p><h2 class="purple-text">{{ planUsageLabel(supervisors.length, currentPlan?.maxSupervisors) }}</h2></article>
      <article class="metric-card"><div class="metric-icon cyan"><i class="pi pi-users"></i></div><p>Personal médico</p><h2 class="cyan-text">{{ planUsageLabel(doctors.length, currentPlan?.maxDoctors) }}</h2></article>
    </section>

    <article class="content-card full-width">
      <div class="toolbar-row">
        <input v-model.trim="search" class="input" placeholder="Buscar por nombre, correo o rol...">
        <select v-model="roleFilter" class="select">
          <option value="">Todos los roles</option>
          <option value="HOSPITAL_ADMIN">Administrador</option>
          <option value="SUPERVISOR">Supervisor clínico</option>
          <option value="DOCTOR">Personal médico</option>
        </select>
        <select v-model="statusFilter" class="select">
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Personal</th><th>Rol</th><th>Área</th><th>Especialidad</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredStaff" :key="item.id">
              <td><div class="staff-profile"><div class="avatar">{{ initials(item) }}</div><div><strong>{{ fullName(item) }}</strong><span>{{ item.email }}</span></div></div></td>
              <td>
                <strong v-if="item.role === 'HOSPITAL_ADMIN'">Administrador</strong>
                <select v-else class="select" style="max-width:230px" :value="item.role" @change="updateRole(item, $event.target.value)">
                  <option value="DOCTOR">Personal médico</option>
                  <option value="SUPERVISOR">Supervisor clínico</option>
                </select>
              </td>
              <td>{{ getWorkArea(item.workAreaId) }}</td>
              <td>{{ getSpecialty(item.specialtyId) }}</td>
              <td><span class="pill" :class="item.status === 'ACTIVE' ? 'success' : 'danger'">{{ item.status === 'ACTIVE' ? 'Activo' : 'Inactivo' }}</span></td>
              <td>
                <span v-if="item.role === 'HOSPITAL_ADMIN'" style="color:#8b9abb;font-weight:900">—</span>
                <button v-else class="btn danger" @click="toggleStatus(item)"><i class="pi pi-ban"></i>{{ item.status === 'ACTIVE' ? 'Desactivar' : 'Activar' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../application/auth.store.js'
import { listResource, patchResource, fullName, initials } from '../../../shared/infrastructure/api.service.js'
const authStore = useAuthStore()
const users = ref([]), workAreas = ref([]), specialties = ref([]), plans = ref([]), subscriptions = ref([])
const search = ref(''), roleFilter = ref(''), statusFilter = ref('')
const orgId = computed(() => authStore.user?.organizationId || 1)
const currentSubscription = computed(() => {
  return subscriptions.value.find(subscription =>
      Number(subscription.organizationId) === Number(orgId.value) &&
      String(subscription.status || '').toUpperCase() === 'ACTIVE'
  )
})

const currentPlan = computed(() => {
  return plans.value.find(plan =>
      Number(plan.id) === Number(currentSubscription.value?.planId)
  )
})
const orgUsers = computed(() => users.value.filter(user => Number(user.organizationId) === Number(orgId.value)))
const activeUsers = computed(() => orgUsers.value.filter(user => user.status === 'ACTIVE'))
const supervisors = computed(() => orgUsers.value.filter(user => user.role === 'SUPERVISOR' && user.status === 'ACTIVE'))
const doctors = computed(() => orgUsers.value.filter(user => user.role === 'DOCTOR' && user.status === 'ACTIVE'))
const filteredStaff = computed(() => orgUsers.value.filter(user => {
  const text = `${fullName(user)} ${user.email} ${roleLabel(user.role)}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!roleFilter.value || user.role === roleFilter.value) && (!statusFilter.value || user.status === statusFilter.value)
}))
onMounted(loadData)
async function loadData () {
  ;[users.value, workAreas.value, specialties.value, plans.value, subscriptions.value] = await Promise.all([
    listResource('users'),
    listResource('workAreas'),
    listResource('specialties'),
    listResource('plans'),
    listResource('subscriptions')
  ])
}
async function updateRole (item, role) { await patchResource('users', item.id, { role }); await loadData() }
async function toggleStatus (item) { await patchResource('users', item.id, { status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); await loadData() }
function getWorkArea (id) { return workAreas.value.find(item => Number(item.id) === Number(id))?.name || '—' }
function getSpecialty (id) { return specialties.value.find(item => Number(item.id) === Number(id))?.name || '—' }
function roleLabel (role) { if (role === 'HOSPITAL_ADMIN') return 'Administrador'; if (role === 'SUPERVISOR') return 'Supervisor clínico'; return 'Personal médico' }
function planUsageLabel (used, limit) {
  return limit === null || limit === undefined
      ? `${used} / ∞`
      : `${used} / ${limit}`
}
</script>
