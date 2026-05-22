<!--
  @file supervisor-preventive-actions.view.vue
  @description Acciones preventivas — KPIs, historial tipo timeline, modal funcional.
  Usa incident.store.js con flujo completo de cascada.
-->
<template>
  <div>
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h1 class="cs-page-title">{{ $t('preventiveActions.title') }}</h1>
        <p class="cs-page-subtitle">{{ $t('preventiveActions.subtitle') }}</p>
      </div>
      <button class="cs-btn cs-btn-primary" @click="showNew = true">
        <i class="pi pi-plus"></i> {{ $t('preventiveActions.registerManual') }}
      </button>
    </div>

    <!-- KPIs -->
    <div class="cs-kpi-grid">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">✅</div>
        <div class="cs-kpi-label">{{ $t('preventiveActions.executedToday') }}</div>
        <div class="cs-kpi-value success">{{ store.todayActions.length }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⏳</div>
        <div class="cs-kpi-label">{{ $t('preventiveActions.pending') }}</div>
        <div class="cs-kpi-value warning">{{ pendingCount }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🛌</div>
        <div class="cs-kpi-label">{{ $t('preventiveActions.assignedRests') }}</div>
        <div class="cs-kpi-value primary">{{ restCount }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🔄</div>
        <div class="cs-kpi-label">{{ $t('preventiveActions.rescheduledShifts') }}</div>
        <div class="cs-kpi-value">{{ reassignCount }}</div>
      </div>
    </div>

    <!-- Historial tipo timeline -->
    <div class="cs-card" style="margin-bottom:0;">
      <div class="cs-card-header">
        <div class="cs-card-title">{{ $t('preventiveActions.actionsHistory') }}</div>
        <div class="filters-bar" style="margin-bottom:0;">
          <input class="filter-input" v-model="search" :placeholder="$t('preventiveActions.searchPlaceholder')" style="width:180px;" />
          <select class="filter-select" v-model="filterType">
            <option value="">{{ $t('preventiveActions.allTypes') }}</option>
            <option value="rest_recommendation">{{ $t('preventiveActions.types.rest_recommendation') }}</option>
            <option value="urgent_rest">{{ $t('preventiveActions.types.urgent_rest') }}</option>
            <option value="shift_reassignment">{{ $t('preventiveActions.types.shift_reassignment') }}</option>
            <option value="medical_evaluation">{{ $t('preventiveActions.types.medical_evaluation') }}</option>
          </select>
        </div>
      </div>

      <div v-if="store.loading" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</div>
      <div v-else-if="filtered.length === 0" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('preventiveActions.noActions') }}</div>

      <div class="timeline" v-else>
        <div v-for="action in filtered" :key="action.id" class="timeline-item">
          <div class="timeline-dot" :style="{ background: typeColor(action.type) }"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-type">{{ typeLabel(action.type) }}</span>
              <span class="cs-badge" :class="`cs-badge-${action.status}`">{{ statusLabel(action.status) }}</span>
              <span class="timeline-date">{{ formatDate(action.createdAt) }}</span>
            </div>
            <div class="timeline-staff">
              👤 {{ staffName(action.staffId) }} · {{ areaLabel(staffArea(action.staffId)) }}
            </div>
            <div v-if="action.notes" class="timeline-notes">{{ notesLabel(action.notes) }}</div>
            <div class="action-btns" style="margin-top:8px;">
              <button v-if="action.status === 'pending'" class="btn-link btn-link-view" @click="doInProgress(action)">{{ $t('preventiveActions.start') }}</button>
              <button v-if="action.status === 'in_progress'" class="btn-link btn-link-edit" @click="doComplete(action)">{{ $t('preventiveActions.complete') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nueva acción -->
    <Dialog v-model:visible="showNew" modal :header="$t('preventiveActions.dialogTitle')" style="width:520px;">
      <div class="cs-form-group">
        <label class="cs-form-label">{{ $t('preventiveActions.affectedStaff') }}</label>
        <select class="filter-select" v-model="newForm.staffId" style="width:100%;color:var(--text-primary);">
          <option value="">{{ $t('preventiveActions.selectDoctor') }}</option>
          <option v-for="s in staffList" :key="s.id" :value="s.id">
            {{ s.firstName }} {{ s.lastName }} — {{ areaLabel(s.area) }}
          </option>
        </select>
      </div>
      <div class="cs-form-group">
        <label class="cs-form-label">{{ $t('preventiveActions.relatedAlert') }}</label>
        <select class="filter-select" v-model="newForm.alertId" style="width:100%;color:var(--text-primary);">
          <option value="">{{ $t('preventiveActions.noRelatedAlert') }}</option>
          <option v-for="a in store.pendingAlerts" :key="a.id" :value="a.id">
            {{ a.staffName }} — {{ alertMessage(a).slice(0,50) }}
          </option>
        </select>
      </div>
      <div class="cs-form-group">
        <label class="cs-form-label">{{ $t('preventiveActions.actionType') }}</label>
        <select class="filter-select" v-model="newForm.type" style="width:100%;color:var(--text-primary);">
          <option value="rest_recommendation">{{ $t('preventiveActions.types.rest_recommendation') }}</option>
          <option value="urgent_rest">{{ $t('preventiveActions.types.urgent_rest_2h') }}</option>
          <option value="shift_reassignment">{{ $t('preventiveActions.types.shift_reassignment') }}</option>
          <option value="medical_evaluation">{{ $t('preventiveActions.types.medical_evaluation') }}</option>
        </select>
      </div>
      <div class="cs-form-group">
        <label class="cs-form-label">{{ $t('preventiveActions.additionalNotes') }}</label>
        <textarea
          class="filter-input"
          v-model="newForm.notes"
          rows="3"
          style="height:auto;resize:vertical;"
          :placeholder="$t('preventiveActions.notesPlaceholder')"
        ></textarea>
      </div>

      <div v-if="['rest_recommendation','urgent_rest'].includes(newForm.type)" class="action-info-hint">
        <i class="pi pi-info-circle"></i>
        {{ $t('preventiveActions.actionHint') }}
      </div>

      <template #footer>
        <Button :label="$t('common.cancel')" severity="secondary" text @click="showNew = false" />
        <Button :label="$t('preventiveActions.registerAction')" @click="createAction" :loading="saving"
          :disabled="!newForm.staffId" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useIncidentStore } from '../../application/incident.store.js'
import { useClinicalRiskStore } from '../../../clinical-risk/application/clinical-risk.store.js'
import { useI18n } from 'vue-i18n'

const store    = useIncidentStore()
const riskStore = useClinicalRiskStore()
const { t, locale } = useI18n({ useScope: 'global' })

const showNew    = ref(false)
const saving     = ref(false)
const search     = ref('')
const filterType = ref('')
const newForm    = reactive({ staffId: '', alertId: '', type: 'rest_recommendation', notes: '' })

const staffList = computed(() => riskStore.staff)

const pendingCount  = computed(() => store.actions.filter(a => a.status === 'pending').length)
const restCount     = computed(() => store.actions.filter(a => ['rest_recommendation','urgent_rest'].includes(a.type)).length)
const reassignCount = computed(() => store.actions.filter(a => a.type === 'shift_reassignment').length)

const filtered = computed(() => store.actions.filter(a => {
  const q = search.value.toLowerCase()
  return (!q || staffName(a.staffId).toLowerCase().includes(q) || (a.notes||'').toLowerCase().includes(q))
    && (!filterType.value || a.type === filterType.value)
}).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))

const TYPE_COLORS = { rest_recommendation: '#45DDE5', urgent_rest: '#EF4444', shift_reassignment: '#7C3AED', medical_evaluation: '#F97316' }
const typeColor  = (type) => TYPE_COLORS[type] || '#94A3B8'
const typeLabel  = (type) => type ? t(`preventiveActions.types.${type}`) : '—'
const statusLabel = (status) => status ? t(`preventiveActions.status.${status}`) : '—'
const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area


function notesLabel (notes = '') {
  const map = {
    'Se recomiendan 8 horas de descanso antes del siguiente turno.': 'notes.rest8BeforeNextShift',
    'Turno reasignado para evitar sobrecarga.': 'notes.shiftReassignedAvoidOverload',
    'Derivado a evaluación de estrés médico.': 'notes.referredStressEvaluation',
    'Descanso urgente de 2 horas asignado por indicadores críticos.': 'notes.urgentRest2hCritical'
  }
  return map[notes] ? t(map[notes]) : notes
}

function alertMessage (alert) {
  const name = alert?.staffName || ''
  const percent = alert?.message?.match(/\((\d+)%\)/)?.[1]
  if (alert?.type === 'fatigue') return t('alertsText.fatigueCritical', { name, percent: percent || '—' })
  if (alert?.type === 'risk') return t('alertsText.criticalRisk', { name, percent: percent || '—' })
  if (alert?.type === 'cortisol') return t('alertsText.highCortisol')
  if (alert?.type === 'hrv') return t('alertsText.lowHrv')
  if (alert?.type === 'heartRate') return t('alertsText.highHeartRate')
  return alert?.message || '—'
}

function staffName (id) { const s = staffList.value.find(x => x.id === id); return s ? `${s.firstName} ${s.lastName}` : id || '—' }
function staffArea (id) { return staffList.value.find(x => x.id === id)?.area || '' }
function formatDate (iso) { if (!iso) return '—'; return new Date(iso).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) }

async function createAction () {
  if (!newForm.staffId) return
  saving.value = true
  try {
    const s = staffList.value.find(x => x.id === newForm.staffId)
    await store.registerAction({
      staffId:   newForm.staffId,
      alertId:   newForm.alertId || null,
      type:      newForm.type,
      notes:     newForm.notes,
      staffName: s ? `${s.firstName} ${s.lastName}` : '',
      area:      s?.area || ''
    })
    showNew.value = false
    Object.assign(newForm, { staffId: '', alertId: '', type: 'rest_recommendation', notes: '' })
  } finally { saving.value = false }
}

async function doInProgress (action) {
  const updated = { ...action, status: 'in_progress' }
  const { incidentApi } = await import('../../infrastructure/incident.api.js')
  await incidentApi.patchPreventiveAction(action.id, { status: 'in_progress' })
  const idx = store.actions.findIndex(a => a.id === action.id)
  if (idx >= 0) store.actions[idx] = updated
}

async function doComplete (action) {
  const { incidentApi } = await import('../../infrastructure/incident.api.js')
  await incidentApi.patchPreventiveAction(action.id, { status: 'completed' })
  const idx = store.actions.findIndex(a => a.id === action.id)
  if (idx >= 0) store.actions[idx] = { ...action, status: 'completed' }
}

onMounted(async () => {
  await Promise.all([store.fetchActions(), store.fetchAlerts(), riskStore.fetchStaff()])
})
</script>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
.timeline::before {
  content: ''; position: absolute; left: 7px; top: 0; bottom: 0;
  width: 2px; background: var(--border);
}
.timeline-item { display: flex; gap: 16px; padding: 12px 0; position: relative; }
.timeline-dot {
  width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
  margin-top: 3px; z-index: 1; border: 2px solid var(--bg-card);
}
.timeline-content { flex: 1; }
.timeline-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.timeline-type { font-weight: 600; font-size: 13px; }
.timeline-date { font-size: 11px; color: var(--text-muted); margin-left: auto; }
.timeline-staff { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.timeline-notes { font-size: 12px; color: var(--text-muted); font-style: italic; }

.action-info-hint {
  display: flex; align-items: center; gap: 8px;
  background: rgba(69,221,229,0.08); border: 1px solid rgba(69,221,229,0.2);
  border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #0E7490;
  margin-top: 4px;
}
</style>
