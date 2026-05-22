<!--
  @file medical-staff-recovery.view.vue
  @description Mi Recuperación — plan activo con aceptar/rechazar y historial.
  Usa recovery.store.js con flujo completo de audit log.
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('recovery.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('recovery.subtitle') }}</p>
    </div>

    <div v-if="store.loading" style="text-align:center;padding:3rem;">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--text-muted);"></i>
    </div>

    <!-- Notificación de descanso urgente asignado por supervisor -->
    <div v-if="activePlan && activePlan.triggeredBy === 'supervisor'" class="urgent-rest-banner">
      <span style="font-size:24px;">🛌</span>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;">
          {{ recoveryMessage(activePlan) }}
        </div>
        <div style="font-size:12px;opacity:0.8;">
          {{ $t('recovery.startDate') }}: {{ formatDate(activePlan.startDate) }} · {{ $t('recovery.estimatedEnd') }}: {{ formatDate(activePlan.endDate) }}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="cs-btn cs-btn-sm" style="background:#15803D;color:#fff;" @click="accept(activePlan)" :disabled="activePlan.status !== 'active'">
          <i class="pi pi-check"></i> {{ $t('recovery.accept') }}
        </button>
        <button class="cs-btn cs-btn-sm cs-btn-secondary" @click="reject(activePlan)" :disabled="activePlan.status !== 'active'">
          {{ $t('recovery.reject') }}
        </button>
      </div>
    </div>

    <!-- Sin plan activo -->
    <div v-else-if="!store.loading && !activePlan" class="cs-card" style="text-align:center;padding:3rem;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:16px;">💚</div>
      <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">{{ $t('recovery.noActivePlan') }}</div>
      <div style="font-size:13px;color:var(--text-muted);">{{ $t('recovery.wellnessOptimal') }}</div>
    </div>

    <!-- Plan activo (aceptado/activo) -->
    <template v-if="activePlan">
      <div class="cs-grid-2" style="margin-bottom:20px;">
        <!-- Detalles del plan -->
        <div class="cs-card" style="margin-bottom:0;">
          <div class="section-label">{{ $t('recovery.activePlan') }}</div>
          <div style="margin-top:12px;">
            <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">
              {{ planTypeLabel(activePlan.type, false) }}
            </div>
            <span class="cs-badge" :class="planStatusBadge(activePlan.status)">{{ planStatusLabel(activePlan.status) }}</span>

            <div style="margin-top:16px;">
              <div class="metric-row"><span class="metric-label">{{ $t('recovery.startDate') }}</span><span class="metric-value">{{ formatDate(activePlan.startDate) }}</span></div>
              <div class="metric-row"><span class="metric-label">{{ $t('recovery.endDate') }}</span><span class="metric-value">{{ formatDate(activePlan.endDate) }}</span></div>
            </div>

            <div style="margin-top:20px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:6px;">
                <span>{{ $t('recovery.progress') }}</span><span>{{ recoveryPct }}%</span>
              </div>
              <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div :style="{ width: recoveryPct + '%', background: 'var(--primary)', height:'100%', borderRadius:'4px', transition:'width 0.5s' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recomendaciones -->
        <div class="cs-card" style="margin-bottom:0;">
          <div class="section-label">{{ $t('recovery.recommendations') }}</div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
            <div
              v-for="(rec, idx) in (activePlan.recommendations?.length ? activePlan.recommendations.map(translateRecommendation) : defaultRecs)"
              :key="idx"
              style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--bg-content);border-radius:8px;"
            >
              <span style="font-size:18px;flex-shrink:0;">{{ recIcons[idx % recIcons.length] }}</span>
              <span style="font-size:13px;color:var(--text-secondary);">{{ rec }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Historial -->
    <div class="cs-card" style="margin-bottom:0;">
      <div class="cs-card-header">
        <div class="cs-card-title">{{ $t('recovery.plansHistory') }}</div>
      </div>
      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr><th>{{ $t('recovery.type') }}</th><th>{{ $t('recovery.startDate') }}</th><th>{{ $t('recovery.endDate') }}</th><th>{{ $t('common.status') }}</th></tr>
          </thead>
          <tbody>
            <tr v-if="store.loading"><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td></tr>
            <tr v-else-if="store.plans.length === 0"><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('recovery.noHistory') }}</td></tr>
            <tr v-for="plan in store.plans" :key="plan.id">
              <td>{{ planTypeLabel(plan.type, true) }}</td>
              <td style="font-size:12px;">{{ formatDate(plan.startDate) }}</td>
              <td style="font-size:12px;">{{ formatDate(plan.endDate) }}</td>
              <td><span class="cs-badge" :class="planStatusBadge(plan.status)">{{ planStatusLabel(plan.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRecoveryStore } from '../../application/recovery.store.js'
import { useClinicalRiskStore } from '../../../clinical-risk/application/clinical-risk.store.js'
import { useI18n } from 'vue-i18n'

const store     = useRecoveryStore()
const riskStore = useClinicalRiskStore()
const { t, locale, tm } = useI18n({ useScope: 'global' })

const activePlan = computed(() => store.activePlan)
const recoveryPct = computed(() => {
  if (!activePlan.value) return 0
  const start = new Date(activePlan.value.startDate).getTime()
  const end   = new Date(activePlan.value.endDate).getTime()
  const now   = Date.now()
  return Math.min(Math.round(((now - start) / (end - start)) * 100), 100)
})

const STATUS_BADGE = { active:'cs-badge-active', accepted:'cs-badge-resolved', rejected:'cs-badge-critical', completed:'cs-badge-resolved' }
const planStatusLabel = (s) => s ? t(`recovery.status.${s}`) : '—'
const planStatusBadge = (s) => STATUS_BADGE[s] || 'cs-badge-inactive'

const recIcons    = ['💤','🥗','🚶','🧘','💧','📵']
const defaultRecs = computed(() => tm('recovery.defaultRecs'))


function planTypeLabel (type, short = false) {
  if (type === 'rest') return `😴 ${t('recovery.types.rest')}`
  return `🏥 ${short ? t('recovery.types.medical_leave_short') : t('recovery.types.medical_leave')}`
}

function recoveryMessage (plan) {
  if (!plan?.message) return t('recovery.urgentRestFallback')
  if (plan.message.includes('Descanso urgente asignado')) return t('recovery.urgentRestFallback')
  if (plan.message.includes('Licencia médica')) return t('recovery.types.medical_leave')
  return plan.message
}

function translateRecommendation (rec) {
  const map = {
    'Descansar al menos 8 horas por noche.': 'recommendationText.rest8',
    'No realizar guardias nocturnas en 3 días.': 'recommendationText.noNightShifts3',
    'Solo actividad física ligera.': 'recommendationText.lightActivityOnly',
    'Hidratarse correctamente.': 'recommendationText.hydrate',
    'Hidratarse y alimentarse correctamente.': 'recommendationText.hydrateEat',
    'Descanso completo durante 7 días.': 'recommendationText.completeRest7',
    'Evaluación médica el día 3.': 'recommendationText.medicalEvaluationDay3',
    'Sin obligaciones clínicas.': 'recommendationText.noClinicalDuties',
    'Evitar actividad física intensa.': 'recommendationText.avoidIntenseActivity',
    'No reingresar al turno sin evaluación médica.': 'recommendationText.noReturnWithoutEvaluation',
    'Descansar al menos 8 horas.': 'recommendationText.rest8'
  }
  return map[rec] ? t(map[rec]) : rec
}

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', { year:'numeric', month:'long', day:'numeric' })
}

async function accept (plan) {
  await store.acceptPlan(plan.id)
}

async function reject (plan) {
  if (!confirm(t('recovery.rejectConfirm'))) return
  await store.rejectPlan(plan.id)
}

onMounted(async () => {
  await riskStore.fetchStaff()
  const profile = riskStore.getMyProfile()
  if (profile?.id) await store.fetchMyPlans(profile.id)
})
</script>

<style scoped>
.urgent-rest-banner {
  display: flex; align-items: center; gap: 16px;
  background: #FFF7ED; border: 2px solid #FED7AA;
  border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;
  color: #92400E;
}
</style>
