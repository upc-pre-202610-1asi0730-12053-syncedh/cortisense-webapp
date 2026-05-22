<!--
  @file admin-staff-list.view.vue
  @description Gestión de personal médico — lista con filtros, acciones y edición sincronizada con usuarios.
-->
<template>
  <div>
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h1 class="cs-page-title">{{ $t('staff.title') }}</h1>
        <p class="cs-page-subtitle">{{ $t('staff.subtitle') }}</p>
      </div>
      <RouterLink to="/admin/invitations" class="cs-btn cs-btn-primary">
        <i class="pi pi-plus"></i> {{ $t('invitations.send') }}
      </RouterLink>
    </div>

    <div class="cs-kpi-grid">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">👥</div>
        <div class="cs-kpi-label">{{ $t('staff.totalStaff') }}</div>
        <div class="cs-kpi-value">{{ staffList.length }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">✅</div>
        <div class="cs-kpi-label">{{ $t('staff.activeStaff') }}</div>
        <div class="cs-kpi-value success">{{ activeCount }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⚠️</div>
        <div class="cs-kpi-label">{{ $t('staff.riskStaff') }}</div>
        <div class="cs-kpi-value critical">{{ riskCount }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">📵</div>
        <div class="cs-kpi-label">{{ $t('staff.withoutDevice') }}</div>
        <div class="cs-kpi-value warning">{{ noDeviceCount }}</div>
      </div>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="filters-bar">
        <input class="filter-input" v-model="search" :placeholder="$t('common.searchByNameOrEmail')" />
        <select class="filter-select" v-model="filterArea">
          <option value="">{{ $t('common.allAreas') }}</option>
          <option v-for="a in areas" :key="a" :value="a">{{ areaLabel(a) }}</option>
        </select>
        <select class="filter-select" v-model="filterRisk">
          <option value="">{{ $t('common.allRisks') }}</option>
          <option value="critical">{{ $t('risk.critical') }}</option>
          <option value="high">{{ $t('risk.high') }}</option>
          <option value="moderate">{{ $t('risk.moderate') }}</option>
          <option value="low">{{ $t('risk.low') }}</option>
        </select>
        <select class="filter-select" v-model="filterStatus">
          <option value="">{{ $t('common.allStatuses') }}</option>
          <option value="active">{{ $t('common.active') }}</option>
          <option value="inactive">{{ $t('common.inactive') }}</option>
        </select>
      </div>

      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ $t('common.name') }}</th>
              <th>{{ $t('common.email') }}</th>
              <th>{{ $t('common.role') }}</th>
              <th>{{ $t('common.area') }}</th>
              <th>{{ $t('common.specialty') }}</th>
              <th>{{ $t('common.status') }}</th>
              <th>{{ $t('common.riskLevel') }}</th>
              <th>{{ $t('staff.fatigue') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.noResults') }}</td>
            </tr>
            <tr v-for="member in filtered" :key="member.id">
              <td>
                <div class="user-cell">
                  <div class="cs-avatar" :style="{ background: riskColor(member.riskLevel), width:'32px', height:'32px', fontSize:'11px' }">
                    {{ initials(member) }}
                  </div>
                  <div class="user-cell-info">
                    <div class="name">{{ member.firstName }} {{ member.lastName }}</div>
                    <div class="sub">{{ roleLabel(member.staffRole || member.role) }}</div>
                  </div>
                </div>
              </td>
              <td>{{ member.email }}</td>
              <td>{{ roleLabel(member.staffRole || member.role) }}</td>
              <td>{{ areaLabel(member.area) }}</td>
              <td>{{ specialtyLabel(member.specialty) }}</td>
              <td>
                <span class="cs-badge" :class="`cs-badge-${member.status}`">
                  {{ member.status === 'active' ? $t('common.active') : $t('common.inactive') }}
                </span>
              </td>
              <td><span class="cs-badge" :class="`cs-badge-${member.riskLevel}`">{{ riskLabel(member.riskLevel) }}</span></td>
              <td>
                <div class="fatigue-bar-wrap">
                  <div class="fatigue-bar">
                    <div class="fatigue-bar-fill" :class="member.riskLevel === 'moderate' ? 'medium' : member.riskLevel" :style="{ width: member.fatigueLevel + '%' }"></div>
                  </div>
                  <span class="fatigue-label" :style="{ color: riskColor(member.riskLevel) }">{{ member.fatigueLevel }}%</span>
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-link btn-link-view" @click="openEdit(member)">{{ $t('common.edit') }}</button>
                  <button class="btn-link btn-link-delete" @click="confirmDelete(member)">{{ $t('common.delete') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Dialog v-model:visible="showEdit" modal :header="$t('staff.editDialog', { name: editing?.firstName || '' })" style="width:560px;">
      <div v-if="editing" class="form-grid-2">
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.name') }}</label>
          <InputText v-model="editing.firstName" style="width:100%;" />
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.lastName') }}</label>
          <InputText v-model="editing.lastName" style="width:100%;" />
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.area') }}</label>
          <InputText v-model="editing.area" style="width:100%;" />
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.specialty') }}</label>
          <InputText v-model="editing.specialty" style="width:100%;" />
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.status') }}</label>
          <select class="filter-select" v-model="editing.status" style="width:100%;">
            <option value="active">{{ $t('common.active') }}</option>
            <option value="inactive">{{ $t('common.inactive') }}</option>
          </select>
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('staff.riskLevel') }}</label>
          <select class="filter-select" v-model="editing.riskLevel" style="width:100%;">
            <option value="low">{{ $t('risk.low') }}</option>
            <option value="moderate">{{ $t('risk.moderate') }}</option>
            <option value="high">{{ $t('risk.high') }}</option>
            <option value="critical">{{ $t('risk.critical') }}</option>
          </select>
        </div>
        <div class="cs-form-group" style="grid-column:span 2;">
          <label class="cs-form-label">{{ $t('common.fatigueLevel') }} (%)</label>
          <InputText v-model.number="editing.fatigueLevel" type="number" min="0" max="100" style="width:100%;" />
        </div>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" severity="secondary" text @click="showEdit = false" />
        <Button :label="$t('settings.saveChanges')" @click="saveEdit" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { http } from '../../../shared/infrastructure/http.js'
import { useIncidentStore } from '../../../incident-alert-management/application/incident.store.js'

const { t } = useI18n({ useScope: 'global' })
const staffList   = ref([])
const loading     = ref(true)
const saving      = ref(false)
const showEdit    = ref(false)
const editing     = ref(null)
const search      = ref('')
const filterArea  = ref('')
const filterRisk  = ref('')
const filterStatus = ref('')
const alertCreated = ref(false)

const incidentStore = useIncidentStore()
const STAFF_PATH = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH
const USERS_PATH = import.meta.env.VITE_USERS_ENDPOINT_PATH
const INVITATIONS_PATH = import.meta.env.VITE_INVITATIONS_ENDPOINT_PATH
const DEVICES_PATH = import.meta.env.VITE_DEVICES_ENDPOINT_PATH
const BIOMETRICS_PATH = import.meta.env.VITE_BIOMETRIC_RECORDS_ENDPOINT_PATH
const SHIFTS_PATH = import.meta.env.VITE_SHIFTS_ENDPOINT_PATH
const RECOVERY_PATH = import.meta.env.VITE_RECOVERY_PLANS_ENDPOINT_PATH
const ALERTS_PATH = import.meta.env.VITE_ALERTS_ENDPOINT_PATH
const ACTIONS_PATH = import.meta.env.VITE_PREVENTIVE_ACTIONS_ENDPOINT_PATH
const AUDIT_LOGS_PATH = import.meta.env.VITE_AUDIT_LOGS_ENDPOINT_PATH

const riskColorMap = { critical: '#EF4444', high: '#F97316', moderate: '#F59E0B', low: '#10B981' }
const riskColor = (l) => riskColorMap[l] || '#94A3B8'
const riskLabel = (l) => t(`risk.${l}`)
const roleLabel = (role) => t(`roles.${role || 'medical_staff'}`)
const initials  = (m) => ((m.firstName?.[0] || '') + (m.lastName?.[0] || '')).toUpperCase()

const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area
const specialtyKey = (spec = '') => ({ 'Cardiología': 'cardiology', 'Medicina Interna': 'internalMedicine', 'Pediatría': 'pediatrics', 'Cirugía General': 'generalSurgery', 'Ginecología': 'gynecology' }[spec] || '')
const specialtyLabel = (spec) => specialtyKey(spec) ? t(`specialties.${specialtyKey(spec)}`) : spec

const areas = computed(() => [...new Set(staffList.value.map(s => s.area).filter(Boolean))])

const filtered = computed(() => staffList.value.filter(m => {
  const q = search.value.toLowerCase()
  const matchQ = !q || `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q)
  const matchA = !filterArea.value || m.area === filterArea.value
  const matchR = !filterRisk.value || m.riskLevel === filterRisk.value
  const matchS = !filterStatus.value || m.status === filterStatus.value
  return matchQ && matchA && matchR && matchS
}))

const activeCount   = computed(() => staffList.value.filter(s => s.status === 'active').length)
const riskCount     = computed(() => staffList.value.filter(s => ['high','critical'].includes(s.riskLevel)).length)
const noDeviceCount = computed(() => staffList.value.filter(s => !s.assignedDeviceId).length)

onMounted(async () => {
  try {
    const res = await http.get(STAFF_PATH)
    staffList.value = res.data
  } finally { loading.value = false }
})

function openEdit (member) {
  editing.value = { ...member }
  showEdit.value = true
  alertCreated.value = false
}

async function findRelatedUser (member) {
  if (member.userId) {
    try { return (await http.get(`${USERS_PATH}/${member.userId}`)).data } catch { /* noop */ }
  }
  const byEmail = await http.get(USERS_PATH, { params: { email: member.email } })
  return byEmail.data?.[0] || null
}

async function saveEdit () {
  saving.value = true
  try {
    const clean = {
      ...editing.value,
      workArea: editing.value.area,
      firstName: editing.value.firstName?.trim(),
      lastName: editing.value.lastName?.trim()
    }

    const updatedProfile = (await http.patch(`${STAFF_PATH}/${clean.id}`, clean)).data

    const relatedUser = await findRelatedUser(updatedProfile)
    if (relatedUser?.id) {
      await http.patch(`${USERS_PATH}/${relatedUser.id}`, {
        firstName: clean.firstName,
        lastName: clean.lastName,
        status: clean.status,
        medicalStaffId: clean.id
      })
    }

    const idx = staffList.value.findIndex(s => s.id === clean.id)
    if (idx >= 0) staffList.value[idx] = updatedProfile

    const shouldAlert = ['high','critical'].includes(clean.riskLevel) || clean.fatigueLevel >= 75
    if (shouldAlert) {
      await incidentStore.createAutoAlert(updatedProfile)
      alertCreated.value = true
    }

    showEdit.value = false
  } finally { saving.value = false }
}

async function deleteMany (path, params) {
  const res = await http.get(path, { params })
  await Promise.all((res.data || []).map(item => http.delete(`${path}/${item.id}`).catch(() => null)))
}

async function confirmDelete (member) {
  const message = `${t('common.confirmDelete', { name: `${member.firstName} ${member.lastName}` })}\n${t('staff.deleteCascadeNotice')}`
  if (!confirm(message)) return

  try {
    const relatedUser = await findRelatedUser(member)

    await Promise.all([
      deleteMany(INVITATIONS_PATH, { email: member.email }),
      deleteMany(DEVICES_PATH, { assignedTo: member.id }),
      member.assignedDeviceId ? http.delete(`${DEVICES_PATH}/${member.assignedDeviceId}`).catch(() => null) : Promise.resolve(),
      deleteMany(BIOMETRICS_PATH, { medicalStaffId: member.id }),
      deleteMany(SHIFTS_PATH, { medicalStaffId: member.id }),
      deleteMany(RECOVERY_PATH, { medicalStaffId: member.id }),
      deleteMany(ALERTS_PATH, { medicalStaffId: member.id }),
      deleteMany(ACTIONS_PATH, { staffId: member.id })
    ])

    await http.delete(`${STAFF_PATH}/${member.id}`)
    if (relatedUser?.id) await http.delete(`${USERS_PATH}/${relatedUser.id}`).catch(() => null)

    await http.post(AUDIT_LOGS_PATH, {
      id: `aul-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: 'admin@cortisense.com',
      action: 'medical_staff_deleted',
      module: 'iam',
      details: `Perfil eliminado: ${member.email}`,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1'
    }).catch(() => null)

    staffList.value = staffList.value.filter(s => s.id !== member.id)
  } catch {
    alert(t('staff.deleteError'))
  }
}
</script>
