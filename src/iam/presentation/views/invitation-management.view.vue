<template>
  <section>
    <header class="page-header"><h1>Gestión de Invitaciones</h1><p>Crea y administra <strong>invitaciones</strong> para nuevos usuarios de CortiSense.</p></header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-envelope"></i></div><p>Total de invitaciones</p><h2>{{ orgInvitations.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-clock"></i></div><p>Pendientes</p><h2 class="warning-text">{{ countByStatus('PENDING') }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Aceptadas</p><h2 class="success-text">{{ countByStatus('ACCEPTED') }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-times-circle"></i></div><p>Canceladas</p><h2 class="danger-text">{{ countByStatus('CANCELLED') }}</h2></article>
    </section>

    <section class="management-grid">
      <article class="form-card">
        <h2>Nueva invitación</h2>
        <p>El usuario podrá completar su registro con el correo invitado.</p>
        <form @submit.prevent="createInvitation">
          <div class="field"><label>Correo electrónico</label><input v-model.trim="form.email" class="input" type="email" placeholder="usuario@cortisense.com" required></div>
          <div class="field"><label>Rol</label><select v-model="form.role" class="select"><option value="DOCTOR">Personal médico</option><option value="SUPERVISOR">Supervisor clínico</option></select></div>
          <button class="btn primary" type="submit" style="width:100%"><i class="pi pi-send"></i>Enviar invitación</button>
        </form>
      </article>

      <article class="content-card">
        <div class="toolbar-row" style="grid-template-columns:minmax(260px,1fr) 160px">
          <input v-model.trim="search" class="input" placeholder="Buscar por correo o rol...">
          <select v-model="statusFilter" class="select"><option value="">Todas</option><option value="PENDING">Pendientes</option><option value="ACCEPTED">Aceptadas</option><option value="CANCELLED">Canceladas</option></select>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Correo</th><th>Rol</th><th>Estado</th><th>Fecha</th><th>Link</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr v-for="item in filteredInvitations" :key="item.id">
                <td><strong>{{ item.email }}</strong></td><td>{{ roleLabel(item.role) }}</td><td><span class="pill" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td><td>{{ formatDate(item.createdAt) }}</td>
                <td><button v-if="item.status === 'PENDING'" class="btn ghost" @click="copyLink(item)"><i class="pi pi-copy"></i>Copiar link</button><span v-else>—</span></td>
                <td style="display:flex;gap:8px;flex-wrap:wrap"><button v-if="item.status === 'PENDING'" class="btn warning" @click="cancelInvitation(item)"><i class="pi pi-ban"></i>Cancelar</button><button class="btn danger" @click="deleteInvitation(item)"><i class="pi pi-trash"></i>Eliminar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../application/auth.store.js'
import { listResource, patchResource, deleteResource } from '../../../shared/infrastructure/api.service.js'
import { invitationApi } from '../../infrastructure/invitation.api.js'
const toast = useToast(); const authStore = useAuthStore()
const invitations = ref([]), search = ref(''), statusFilter = ref('')
const form = reactive({ email: '', role: 'DOCTOR' })
const orgId = computed(() => authStore.user?.organizationId || 1)
const orgInvitations = computed(() => invitations.value.filter(item => Number(item.organizationId) === Number(orgId.value)))
const filteredInvitations = computed(() => orgInvitations.value.filter(item => {
  const text = `${item.email} ${roleLabel(item.role)}`.toLowerCase()
  return (!search.value || text.includes(search.value.toLowerCase())) && (!statusFilter.value || item.status === statusFilter.value)
}))
onMounted(loadData)
async function loadData () { invitations.value = await listResource('invitations') }
async function createInvitation () { await invitationApi.createInvitation({ ...form, organizationId: orgId.value }); form.email = ''; form.role = 'DOCTOR'; await loadData() }
async function cancelInvitation (item) { await patchResource('invitations', item.id, { status: 'CANCELLED' }); await loadData() }
async function deleteInvitation (item) { await deleteResource('invitations', item.id); await loadData() }
async function copyLink (item) { const link = `${window.location.origin}/accept-invitation?token=${item.token}`; await navigator.clipboard?.writeText(link); toast.add({ severity: 'success', summary: 'CortiSense', detail: 'Link copiado', life: 2500 }) }
function countByStatus (status) { return orgInvitations.value.filter(item => item.status === status).length }
function roleLabel (role) { return role === 'SUPERVISOR' ? 'Supervisor clínico' : 'Personal médico' }
function statusLabel (status) { return status === 'PENDING' ? 'Pendiente' : status === 'ACCEPTED' ? 'Aceptada' : 'Cancelada' }
function statusClass (status) { return status === 'PENDING' ? 'warning' : status === 'ACCEPTED' ? 'success' : 'danger' }
function formatDate (value) { if (!value) return '—'; const date = new Date(value); return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
</script>
