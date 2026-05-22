<!--
  @file admin-audit.view.vue
  @description Auditoría — log enriquecido con KPIs, filtros y badges de criticidad.
  Usa audit.store.js
-->
<template>
  <div>
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h1 class="cs-page-title">{{ $t('audit.title') }}</h1>
        <p class="cs-page-subtitle">{{ $t('audit.subtitle') }}</p>
      </div>
      <button class="cs-btn cs-btn-secondary" @click="exportLog">
        <i class="pi pi-download"></i> {{ $t('audit.exportLog') }}
      </button>
    </div>

    <!-- Banner módulo -->
    <div class="audit-banner">
      <i class="pi pi-shield" style="font-size:20px;color:var(--primary);"></i>
      <div>
        <div style="font-weight:700;font-size:13px;">{{ $t('audit.enterpriseModule') }}</div>
        <div style="font-size:12px;color:var(--text-muted);">
          {{ $t('audit.enterpriseModuleDesc') }}
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="cs-kpi-grid">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">📋</div>
        <div class="cs-kpi-label">{{ $t('audit.eventsToday') }}</div>
        <div class="cs-kpi-value primary">{{ store.todayLogs.length }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🔴</div>
        <div class="cs-kpi-label">{{ $t('audit.criticalEvents') }}</div>
        <div class="cs-kpi-value critical">{{ store.criticalLogs.length }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⚙️</div>
        <div class="cs-kpi-label">{{ $t('audit.executedActions') }}</div>
        <div class="cs-kpi-value">{{ store.logs.length }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">👤</div>
        <div class="cs-kpi-label">{{ $t('audit.involvedActors') }}</div>
        <div class="cs-kpi-value">{{ uniqueActors }}</div>
      </div>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="filters-bar">
        <input class="filter-input" v-model="search" :placeholder="$t('audit.searchPlaceholder')" />
        <select class="filter-select" v-model="filterSeverity">
          <option value="">{{ $t('audit.allSeverities') }}</option>
          <option value="critical">{{ $t('audit.severity.critical') }}</option>
          <option value="warning">{{ $t('audit.severity.warning') }}</option>
          <option value="info">{{ $t('audit.severity.info') }}</option>
        </select>
        <select class="filter-select" v-model="filterModule">
          <option value="">{{ $t('audit.allModules') }}</option>
          <option v-for="m in modules" :key="m">{{ m }}</option>
        </select>
      </div>

      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ $t('audit.timestamp') }}</th>
              <th>{{ $t('audit.module') }}</th>
              <th>{{ $t('audit.action') }}</th>
              <th>{{ $t('audit.userId') }}</th>
              <th>{{ $t('audit.criticality') }}</th>
              <th>{{ $t('audit.description') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading"><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('audit.noLogs') }}</td></tr>
            <tr v-for="log in filtered" :key="log.id">
              <td style="white-space:nowrap;font-size:12px;">{{ formatDate(log.timestamp) }}</td>
              <td>
                <span class="cs-badge cs-badge-info">{{ moduleLabel(log.module) }}</span>
              </td>
              <td style="font-weight:600;font-size:13px;">{{ actionLabel(log.action) }}</td>
              <td>
                <div class="user-cell">
                  <div class="cs-avatar" style="width:26px;height:26px;font-size:10px;background:var(--primary);color:var(--bg-dark);">
                    {{ userInitials(log.userId) }}
                  </div>
                  <span style="font-size:12px;color:var(--text-muted);">{{ log.userId }}</span>
                </div>
              </td>
              <td>
                <span class="cs-badge" :class="severityBadge(log.severity)">
                  {{ severityLabel(log.severity) }}
                </span>
              </td>
              <td style="font-size:12px;color:var(--text-secondary);max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                {{ detailsLabel(log) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuditStore } from '../../application/audit.store.js'

const { t, locale } = useI18n({ useScope: 'global' })
const store         = useAuditStore()
const search        = ref('')
const filterSeverity = ref('')
const filterModule  = ref('')

const modules = computed(() => [...new Set(store.logs.map(l => moduleLabel(l.module)).filter(Boolean))])
const uniqueActors = computed(() => new Set(store.logs.map(l => l.userId).filter(Boolean)).size)

const filtered = computed(() => store.logs.filter(l => {
  const q = search.value.toLowerCase()
  return (!q || `${actionLabel(l.action)} ${detailsLabel(l)} ${l.userId}`.toLowerCase().includes(q))
    && (!filterSeverity.value || l.severity === filterSeverity.value)
    && (!filterModule.value   || moduleLabel(l.module) === filterModule.value)
}))


const moduleLabel = (m) => m ? t(`audit.modules.${m}`) : '—'


const actionLabel = (a) => a ? t(`audit.actions.${a}`) : '—'

const severityLabel = (s) => s ? t(`audit.severity.${s}`) : '—'
const severityBadge = (s) => ({ critical: 'cs-badge-critical', warning: 'cs-badge-high', info: 'cs-badge-info', error: 'cs-badge-critical' }[s] || 'cs-badge-inactive')

function detailsLabel (log) {
  const d = log?.details || ''
  const emailMatch = d.match(/(?:Invitación creada para|Perfil eliminado:)\s+([^\s]+)/i)
  if (d.startsWith('Invitación creada para') && emailMatch) return t('audit.details.invitationCreated', { email: emailMatch[1] })
  if (d.startsWith('Perfil eliminado:') && emailMatch) return t('audit.details.profileDeleted', { email: emailMatch[1] })

  const accepted = d.match(/Registro aceptado para\s+([^\s]+)\s+con rol\s+([^\s]+)/i)
  if (accepted) return t('audit.details.registrationAccepted', { email: accepted[1], role: t(`roles.${accepted[2]}`) })

  const alertAck = d.match(/Alerta\s+([^\s]+)\s+confirmada por supervisor/i)
  if (alertAck) return t('audit.details.alertAcknowledged', { id: alertAck[1] })

  const actionRegistered = d.match(/Acción preventiva registrada para\s+([^\.]+)\.\s*Tipo:\s*(.+)\.?/i)
  if (actionRegistered) return t('audit.details.preventiveActionRegistered', { staff: actionRegistered[1], type: actionRegistered[2] })

  const generated = d.match(/Reporte generado:\s*(.+)/i)
  if (generated) return t('audit.details.reportGenerated', { title: translateReportTitle(generated[1]) })

  const planAccepted = d.match(/Plan de descanso\s+([^\s]+)\s+aceptado por el médico\s+(.+)\.?/i)
  if (planAccepted) return t('audit.details.recoveryPlanAccepted', { id: planAccepted[1], name: planAccepted[2].replace(/\.$/, '') })

  const planStatus = d.match(/Plan de descanso\s+(aceptado|rechazado)\.\s*ID:\s*(.+)/i)
  if (planStatus) return t(planStatus[1].toLowerCase() === 'aceptado' ? 'audit.details.restPlanAcceptedId' : 'audit.details.restPlanRejectedId', { id: planStatus[2] })

  const action = d.match(/Acción:\s*([^\.]+)\.\s*(.*)/i)
  if (action) return t('audit.details.actionWithNotes', { type: typeLabel(action[1]), notes: notesLabel(action[2]) })

  return d
}

function translateReportTitle (title) {
  return title
    .replace('Anomalías biométricas', t('reports.types.anomaly'))
    .replace('Reporte de Cumplimiento Institucional', t('reports.types.compliance'))
    .replace('Resumen mensual de fatiga', t('reports.types.fatigue'))
    .replace('Semana', t('reports.week'))
}

function typeLabel (type) {
  const key = `preventiveActions.types.${type}`
  const translated = t(key)
  return translated === key ? type : translated
}

function notesLabel (notes = '') {
  const map = {
    'Se recomiendan 8 horas de descanso antes del siguiente turno.': 'notes.rest8BeforeNextShift',
    'Turno reasignado para evitar sobrecarga.': 'notes.shiftReassignedAvoidOverload',
    'Derivado a evaluación de estrés médico.': 'notes.referredStressEvaluation',
    'Descanso urgente de 2 horas asignado por indicadores críticos.': 'notes.urgentRest2hCritical'
  }
  return map[notes] ? t(map[notes]) : notes
}

function userInitials (userId) {
  if (!userId) return '?'
  const parts = userId.split('@')[0].split(/[._-]/)
  return parts.map(p => p[0] || '').join('').toUpperCase().slice(0, 2)
}

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
}

function exportLog () {
  const rows = [['Timestamp', t('audit.module'), t('audit.action'), t('audit.userId'), t('audit.criticality'), t('audit.description')],
    ...store.logs.map(l => [l.timestamp, moduleLabel(l.module), actionLabel(l.action), l.userId, severityLabel(l.severity), detailsLabel(l)])]
  const csv = rows.map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
  a.download = `cortisense-audit-${Date.now()}.csv`
  a.click()
}

onMounted(() => store.fetchLogs())
</script>

<style scoped>
.audit-banner {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(69,221,229,0.06); border: 1px solid rgba(69,221,229,0.2);
  border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;
}
</style>
