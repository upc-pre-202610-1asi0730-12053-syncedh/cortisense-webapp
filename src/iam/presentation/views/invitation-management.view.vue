<template>
  <section>
    <header class="page-header">
      <h1>{{ $t('iam.invitations.title') }}</h1>
      <p>
        {{ $t('iam.invitations.subtitle-before') }}
        <strong>{{ $t('iam.invitations.subtitle-highlight') }}</strong>
        {{ $t('iam.invitations.subtitle-after') }}
      </p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card">
        <div class="metric-icon blue">
          <i class="pi pi-envelope"></i>
        </div>
        <p>{{ $t('iam.invitations.metrics.total') }}</p>
        <h2>{{ invitationRows.length }}</h2>
      </article>

      <article class="metric-card">
        <div class="metric-icon warning">
          <i class="pi pi-clock"></i>
        </div>
        <p>{{ $t('iam.invitations.metrics.pending') }}</p>
        <h2 class="warning-text">{{ countByStatus('PENDING') }}</h2>
      </article>

      <article class="metric-card">
        <div class="metric-icon success">
          <i class="pi pi-check-circle"></i>
        </div>
        <p>{{ $t('iam.invitations.metrics.accepted') }}</p>
        <h2 class="success-text">{{ countByStatus('ACCEPTED') }}</h2>
      </article>

      <article class="metric-card">
        <div class="metric-icon danger">
          <i class="pi pi-times-circle"></i>
        </div>
        <p>{{ $t('iam.invitations.metrics.cancelled') }}</p>
        <h2 class="danger-text">{{ countByStatus('CANCELLED') }}</h2>
      </article>
    </section>

    <section class="management-grid">
      <article class="form-card">
        <h2>{{ $t('iam.invitations.new-title') }}</h2>
        <p>{{ $t('iam.invitations.new-subtitle') }}</p>

        <form @submit.prevent="createInvitation">
          <div class="field">
            <label>{{ $t('iam.invitations.email') }}</label>
            <input
              v-model.trim="form.email"
              class="input"
              type="email"
              :placeholder="$t('iam.invitations.email-placeholder')"
              @input="invitationError = ''"
            >
          </div>

          <div class="field">
            <label>{{ $t('iam.invitations.role') }}</label>
            <select
              v-model="form.role"
              class="select"
              @change="invitationError = ''"
            >
              <option value="DOCTOR">{{ $t('iam.roles.doctor') }}</option>
              <option value="SUPERVISOR">{{ $t('iam.roles.supervisor') }}</option>
            </select>
          </div>

          <small v-if="invitationError" class="form-error">
            {{ $t(invitationError) }}
          </small>

          <button class="btn primary" type="submit" style="width:100%" :disabled="sending">
            <i class="pi pi-send"></i>
            <span v-if="sending">{{ $t('iam.invitations.sending') }}</span>
            <span v-else>{{ $t('iam.invitations.send') }}</span>
          </button>
        </form>
      </article>

      <article class="content-card">
        <div class="toolbar-row" style="grid-template-columns:minmax(260px,1fr) 170px">
          <input
            v-model.trim="search"
            class="input"
            :placeholder="$t('iam.invitations.search-placeholder')"
          >

          <select v-model="statusFilter" class="select">
            <option value="">{{ $t('iam.invitations.filters.all') }}</option>
            <option value="PENDING">{{ $t('iam.invitations.filters.pending') }}</option>
            <option value="ACCEPTED">{{ $t('iam.invitations.filters.accepted') }}</option>
            <option value="CANCELLED">{{ $t('iam.invitations.filters.cancelled') }}</option>
          </select>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ $t('iam.invitations.table.email') }}</th>
                <th>{{ $t('iam.invitations.table.role') }}</th>
                <th>{{ $t('iam.invitations.table.status') }}</th>
                <th>{{ $t('iam.invitations.table.email-status') }}</th>
                <th>{{ $t('iam.invitations.table.date') }}</th>
                <th>{{ $t('iam.invitations.table.link') }}</th>
                <th>{{ $t('iam.invitations.table.actions') }}</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in filteredInvitations" :key="item.id">
                <td>
                  <strong>{{ item.email }}</strong>
                  <small v-if="item.emailError" class="muted-text">{{ item.emailError }}</small>
                </td>

                <td>{{ roleLabel(item.role) }}</td>

                <td>
                  <span class="pill" :class="statusClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>

                <td>
                  <span class="pill" :class="emailStatusClass(item.emailStatus)">
                    {{ emailStatusLabel(item.emailStatus) }}
                  </span>
                </td>

                <td>{{ formatDate(item.createdAt) }}</td>

                <td>
                  <button
                    class="btn ghost"
                    type="button"
                    :disabled="!item.token"
                    @click="copyLink(item)"
                  >
                    {{ $t('iam.invitations.copy-link') }}
                  </button>
                </td>

                <td>
                  <div class="table-actions">
                    <button
                      v-if="isActiveInvitation(item)"
                      class="btn warning"
                      type="button"
                      @click="cancelInvitation(item)"
                    >
                      {{ $t('iam.invitations.cancel') }}
                    </button>

                    <button
                      v-if="!isAcceptedInvitation(item)"
                      class="btn danger"
                      type="button"
                      @click="deleteInvitation(item)"
                    >
                      {{ $t('iam.invitations.delete') }}
                    </button>

                    <span v-if="isAcceptedInvitation(item)" class="muted-text">
                      {{ $t('iam.invitations.accepted-cannot-be-deleted') }}
                    </span>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredInvitations.length === 0">
                <td colspan="7">
                  <div class="empty-state">
                    {{ $t('iam.invitations.empty') }}
                  </div>
                </td>
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
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../application/auth.store.js'
import { invitationApi } from '../../infrastructure/invitation.api.js'

const toast = useToast()
const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()

const invitations = ref([])
const search = ref('')
const statusFilter = ref('')
const sending = ref(false)
const invitationError = ref('')

const form = reactive({
  email: '',
  role: 'DOCTOR'
})

const organizationId = computed(() => Number(authStore.user?.organizationId || 0))

const invitationRows = computed(() => invitations.value.map(item => ({
  ...item,
  status: normalizeStatus(item.status),
  emailStatus: normalizeEmailStatus(item.emailStatus),
  role: normalizeRole(item.role)
})))

const filteredInvitations = computed(() => {
  const term = search.value.trim().toLowerCase()

  return invitationRows.value.filter(item => {
    const matchesSearch = !term ||
      String(item.email || '').toLowerCase().includes(term) ||
      roleLabel(item.role).toLowerCase().includes(term)

    const matchesStatus = !statusFilter.value || item.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

onMounted(loadData)

async function loadData () {
  if (!organizationId.value) {
    invitationError.value = 'iam.invitations.error.no-session'
    return
  }

  try {
    invitations.value = await invitationApi.getInvitationsByOrganizationId(organizationId.value)
  } catch {
    invitationError.value = 'iam.invitations.error.load-failed'
  }
}

function isValidEmail (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function createInvitation () {
  invitationError.value = ''

  if (!organizationId.value) {
    invitationError.value = 'iam.invitations.error.no-session'
    return
  }

  if (!form.email) {
    invitationError.value = 'iam.invitations.error.email-required'
    return
  }

  if (!isValidEmail(form.email)) {
    invitationError.value = 'iam.invitations.error.email-invalid'
    return
  }

  sending.value = true

  try {
    await invitationApi.sendInvitation({
      organizationId: organizationId.value,
      email: form.email,
      role: form.role
    })

    form.email = ''
    form.role = 'DOCTOR'

    toast.add({
      severity: 'success',
      summary: 'CortiSense',
      detail: t('iam.invitations.sent-success'),
      life: 2500
    })

    await loadData()
  } catch {
    invitationError.value = 'iam.invitations.error.create-failed'
  } finally {
    sending.value = false
  }
}

async function cancelInvitation (item) {
  try {
    await invitationApi.updateInvitation(item.id, {
      status: 'CANCELLED'
    })

    await loadData()
  } catch {
    invitationError.value = 'iam.invitations.error.cancel-failed'
  }
}

async function deleteInvitation (item) {
  if (isAcceptedInvitation(item)) {
    invitationError.value = 'iam.invitations.error.accepted-cannot-be-deleted'
    return
  }

  try {
    await invitationApi.cancelInvitation(item.id)
    await loadData()
  } catch {
    invitationError.value = 'iam.invitations.error.delete-failed'
  }
}

async function copyLink (item) {
  if (!item.token) return

  const link = `${window.location.origin}/accept-invitation?token=${encodeURIComponent(item.token)}`

  await navigator.clipboard?.writeText(link)

  toast.add({
    severity: 'success',
    summary: 'CortiSense',
    detail: t('iam.invitations.link-copied'),
    life: 2500
  })
}

function countByStatus (status) {
  return invitationRows.value.filter(item => item.status === status).length
}

function normalizeRole (role) {
  const value = String(role || '').toUpperCase()

  if (value === 'SUPERVISOR' || value === 'CLINICAL_SUPERVISOR') return 'SUPERVISOR'

  return 'DOCTOR'
}

function normalizeStatus (status) {
  const value = String(status || '').toUpperCase()

  if (value === 'ACCEPTED') return 'ACCEPTED'
  if (value === 'CANCELLED') return 'CANCELLED'
  if (value === 'EXPIRED') return 'CANCELLED'

  return 'PENDING'
}

function normalizeEmailStatus (status) {
  const value = String(status || '').toUpperCase()

  if (value === 'SENT') return 'SENT'
  if (value === 'FAILED') return 'FAILED'
  if (value === 'SKIPPED') return 'SKIPPED'

  return 'PENDING'
}

function isActiveInvitation (item) {
  return item.status === 'PENDING'
}

function isAcceptedInvitation (item) {
  return item.status === 'ACCEPTED'
}

function roleLabel (role) {
  return normalizeRole(role) === 'SUPERVISOR'
    ? t('iam.roles.supervisor')
    : t('iam.roles.doctor')
}

function statusLabel (status) {
  return status === 'ACCEPTED'
    ? t('iam.invitations.status.accepted')
    : status === 'CANCELLED'
      ? t('iam.invitations.status.cancelled')
      : t('iam.invitations.status.pending')
}

function emailStatusLabel (status) {
  return status === 'SENT'
    ? t('iam.invitations.email-status.sent')
    : status === 'FAILED'
      ? t('iam.invitations.email-status.failed')
      : status === 'SKIPPED'
        ? t('iam.invitations.email-status.skipped')
        : t('iam.invitations.email-status.pending')
}

function statusClass (status) {
  return status === 'ACCEPTED'
    ? 'success'
    : status === 'CANCELLED'
      ? 'danger'
      : 'warning'
}

function emailStatusClass (status) {
  return status === 'SENT'
    ? 'success'
    : status === 'FAILED'
      ? 'danger'
      : status === 'SKIPPED'
        ? 'info'
        : 'warning'
}

function formatDate (value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>