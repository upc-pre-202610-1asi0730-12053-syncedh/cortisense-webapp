<!--
  @file admin-invitations.view.vue
  @description Gestión de invitaciones — lista + formulario de nueva invitación.
-->
<template>
  <div>
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h1 class="cs-page-title">{{ $t('invitations.title') }}</h1>
        <p class="cs-page-subtitle">{{ $t('invitations.subtitle') }}</p>
      </div>
      <button class="cs-btn cs-btn-primary" @click="showNew = true">
        <i class="pi pi-plus"></i> {{ $t('invitations.send') }}
      </button>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="filters-bar">
        <input class="filter-input" v-model="search" :placeholder="$t('common.searchByEmail')" />
        <select class="filter-select" v-model="filterStatus">
          <option value="">{{ $t('common.allStatuses') }}</option>
          <option value="pending">{{ $t('common.pending') }}</option>
          <option value="accepted">{{ $t('common.accepted') }}</option>
        </select>
        <select class="filter-select" v-model="filterRole">
          <option value="">{{ $t('common.allRoles') }}</option>
          <option value="medical_staff">{{ $t('roles.medical_staff') }}</option>
          <option value="clinical_supervisor">{{ $t('roles.clinical_supervisor') }}</option>
        </select>
      </div>

      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ $t('common.email') }}</th>
              <th>{{ $t('invitations.assignedRole') }}</th>
              <th>{{ $t('common.status') }}</th>
              <th>{{ $t('invitations.sentAt') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('invitations.noInvitations') }}</td></tr>
            <tr v-for="inv in filtered" :key="inv.id">
              <td style="font-family:monospace;font-size:13px;">{{ inv.email }}</td>
              <td>{{ roleLabel(inv.role) }}</td>
              <td>
                <span class="cs-badge" :class="inv.status === 'pending' ? 'cs-badge-pending' : 'cs-badge-accepted'">
                  {{ inv.status === 'pending' ? $t('common.pending') : $t('common.accepted') }}
                </span>
              </td>
              <td>{{ formatDate(inv.createdAt) }}</td>
              <td>
                <button
                  class="btn-link btn-link-delete"
                  @click="revokeInvitation(inv)"
                >{{ $t('invitations.revoke') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Dialog v-model:visible="showNew" modal :header="$t('invitations.send')" style="width:460px;">
      <div class="cs-form-group">
        <label class="cs-form-label">{{ $t('invitations.guestEmail') }}</label>
        <InputText v-model="newForm.email" type="email" placeholder="correo@hospital.com" style="width:100%;" />
        <small v-if="formError" style="color:#ef4444;font-size:11px;">{{ formError }}</small>
      </div>
      <div class="cs-form-group">
        <label class="cs-form-label">{{ $t('invitations.assignRole') }}</label>
        <select class="filter-select" v-model="newForm.role" style="width:100%;color:var(--text-primary);">
          <option value="medical_staff">{{ $t('roles.medical_staff') }}</option>
          <option value="clinical_supervisor">{{ $t('roles.clinical_supervisor') }}</option>
        </select>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" severity="secondary" text @click="showNew = false" />
        <Button :label="$t('invitations.send')" @click="sendInvitation" :loading="sending" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http } from '../../../shared/infrastructure/http.js'

const { t, locale } = useI18n({ useScope: 'global' })
const INV_PATH = import.meta.env.VITE_INVITATIONS_ENDPOINT_PATH
const STAFF_PATH = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH

const invitations  = ref([])
const loading      = ref(true)
const showNew      = ref(false)
const sending      = ref(false)
const search       = ref('')
const filterStatus = ref('')
const filterRole   = ref('')
const formError    = ref('')
const newForm      = ref({ email: '', role: 'medical_staff' })

const filtered = computed(() => invitations.value.filter(inv => {
  const q = search.value.toLowerCase()
  return (!q || inv.email.toLowerCase().includes(q))
    && (!filterStatus.value || inv.status === filterStatus.value)
    && (!filterRole.value   || inv.role   === filterRole.value)
}))

function roleLabel (role) {
  return t(`roles.${role || 'medical_staff'}`)
}

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadInvitations () {
  const [invRes, staffRes] = await Promise.all([
    http.get(INV_PATH),
    http.get(STAFF_PATH)
  ])

  const staffEmails = new Set(staffRes.data.map(s => s.email?.toLowerCase()).filter(Boolean))
  const orphanAccepted = invRes.data.filter(inv =>
    inv.status === 'accepted' && !staffEmails.has(inv.email?.toLowerCase())
  )
  await Promise.all(orphanAccepted.map(inv => http.delete(`${INV_PATH}/${inv.id}`).catch(() => null)))

  invitations.value = invRes.data.filter(inv => !orphanAccepted.some(orphan => orphan.id === inv.id))
}

onMounted(async () => {
  try { await loadInvitations() }
  finally { loading.value = false }
})

async function sendInvitation () {
  formError.value = ''
  const email = newForm.value.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    formError.value = t('common.validEmail')
    return
  }
  sending.value = true
  try {
    const existing = await http.get(INV_PATH, { params: { email } })
    await Promise.all((existing.data || []).map(inv => http.delete(`${INV_PATH}/${inv.id}`).catch(() => null)))

    const res = await http.post(INV_PATH, {
      email,
      role:      newForm.value.role,
      status:    'pending',
      createdAt: new Date().toISOString()
    })
    invitations.value = [res.data, ...invitations.value.filter(inv => inv.email !== email)]
    newForm.value = { email: '', role: 'medical_staff' }
    showNew.value = false
  } finally { sending.value = false }
}

async function revokeInvitation (inv) {
  if (!confirm(t('common.confirmRevoke', { email: inv.email }))) return
  await http.delete(`${INV_PATH}/${inv.id}`)
  invitations.value = invitations.value.filter(i => i.id !== inv.id)
}
</script>
