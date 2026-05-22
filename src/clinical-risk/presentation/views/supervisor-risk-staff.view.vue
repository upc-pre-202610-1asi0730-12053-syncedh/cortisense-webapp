<!--
  @file supervisor-risk-staff.view.vue
  @description Personal en riesgo — cards clínicas fiel a la demo.
  Usa clinical-risk.store.js
-->
<template>
  <div>
    <div class="section-label">{{ $t('riskStaff.moduleLabel') }}</div>
    <h1 class="cs-page-title">{{ $t('riskStaff.title') }}</h1>
    <p class="cs-page-subtitle">{{ $t('riskStaff.subtitle') }}</p>

    <!-- Alerta superior si hay críticos o altos -->
    <div v-if="criticalOrHigh.length > 0" class="risk-alert-banner">
      <span style="font-size:20px;">🚨</span>
      <div>
        <strong>{{ $t(criticalOrHigh.length > 1 ? 'riskStaff.immediateAttentionMany' : 'riskStaff.immediateAttentionOne', { count: criticalOrHigh.length }) }}</strong>
        {{ $t('riskStaff.reviewBefore') }}
      </div>
    </div>

    <div v-if="store.loading" style="text-align:center;padding:3rem;color:var(--text-muted);">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;"></i>
    </div>

    <!-- Cards críticos/altos -->
    <div v-else>
      <div class="risk-grid" v-if="criticalOrHigh.length > 0">
        <div
          v-for="m in criticalOrHigh" :key="m.id"
          class="risk-card"
          :class="m.riskLevel"
        >
          <div class="risk-card-header">
            <div class="cs-avatar" :style="{ background: riskColor(m.riskLevel), width:'40px', height:'40px', fontSize:'14px' }">
              {{ ((m.firstName?.[0]||'') + (m.lastName?.[0]||'')).toUpperCase() }}
            </div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:15px;">{{ m.firstName }} {{ m.lastName }}</div>
              <div style="font-size:12px;color:#64748B;">{{ specialtyLabel(m.specialty) }} · {{ areaLabel(m.area) }}</div>
              <span class="cs-badge" :class="`cs-badge-${m.riskLevel}`" style="margin-top:4px;display:inline-block;">{{ riskLabel(m.riskLevel) }}</span>
            </div>
          </div>

          <div class="risk-stat"><span class="risk-stat-label">⏱ {{ $t('riskStaff.shiftHours') }}</span><span class="risk-stat-value">{{ shiftHours(m.id) }}</span></div>
          <div class="risk-stat">
            <span class="risk-stat-label">🧪 Cortisol</span>
            <span class="risk-stat-value" :style="{ color: getLatest(m.id, 'cortisol') > 600 ? '#EF4444' : 'inherit' }">
              {{ getLatest(m.id, 'cortisol') }} nmol/L
            </span>
          </div>
          <div class="risk-stat">
            <span class="risk-stat-label">❤️ HRV</span>
            <span class="risk-stat-value" :style="{ color: getLatest(m.id, 'hrv') < 30 ? '#EF4444' : '#F97316' }">
              {{ getLatest(m.id, 'hrv') }} ms
            </span>
          </div>
          <div class="risk-stat"><span class="risk-stat-label">💓 {{ $t('riskStaff.heartRateShort') }}</span><span class="risk-stat-value">{{ getLatest(m.id, 'heartRate') }} bpm</span></div>

          <div style="margin-top:10px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
              <span>{{ $t('riskStaff.fatigue') }}</span>
              <span style="font-weight:700;" :style="{ color: riskColor(m.riskLevel) }">{{ m.fatigueLevel }}%</span>
            </div>
            <div class="fatigue-bar">
              <div class="fatigue-bar-fill" :class="m.riskLevel === 'moderate' ? 'medium' : m.riskLevel" :style="{ width: m.fatigueLevel + '%' }"></div>
            </div>
          </div>

          <div class="risk-actions">
            <button class="cs-btn cs-btn-sm cs-btn-danger" style="flex:1;" @click="openRestModal(m)">
              🛌 {{ $t('riskStaff.assignRest') }}
            </button>
            <button class="cs-btn cs-btn-sm cs-btn-secondary" @click="contactStaff(m)">📞</button>
          </div>
        </div>
      </div>

      <!-- Personal en niveles aceptables -->
      <div style="margin-top:24px;" v-if="acceptable.length > 0">
        <h2 style="font-size:16px;font-weight:700;margin-bottom:14px;color:#64748B;">{{ $t('riskStaff.acceptableLevels') }}</h2>
        <div class="risk-grid">
          <div v-for="m in acceptable" :key="m.id" class="risk-card">
            <div class="risk-card-header">
              <div class="cs-avatar" :style="{ background: riskColor(m.riskLevel), width:'38px', height:'38px', fontSize:'13px' }">
                {{ ((m.firstName?.[0]||'') + (m.lastName?.[0]||'')).toUpperCase() }}
              </div>
              <div style="flex:1;">
                <div style="font-weight:700;">{{ m.firstName }} {{ m.lastName }}</div>
                <div style="font-size:12px;color:#64748B;">{{ specialtyLabel(m.specialty) }} · {{ areaLabel(m.area) }}</div>
                <span class="cs-badge" :class="`cs-badge-${m.riskLevel}`" style="margin-top:4px;display:inline-block;">{{ riskLabel(m.riskLevel) }}</span>
              </div>
            </div>
            <div class="risk-stat"><span class="risk-stat-label">⏱ {{ $t('riskStaff.shiftHours') }}</span><span class="risk-stat-value">{{ shiftHours(m.id) }}</span></div>
            <div class="risk-stat">
              <span class="risk-stat-label">💓 {{ $t('riskStaff.fatigue') }}</span>
              <span class="risk-stat-value" :style="{ color: riskColor(m.riskLevel) }">{{ m.fatigueLevel }}%</span>
            </div>
            <div class="risk-actions">
              <RouterLink :to="`/supervisor/preventive-actions`" class="cs-btn cs-btn-sm cs-btn-secondary" style="text-decoration:none;display:flex;align-items:center;justify-content:center;flex:1;">{{ $t('riskStaff.detail') }}</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal descanso -->
    <Dialog v-model:visible="showRest" modal :header="$t('riskStaff.restDialogTitle')" style="width:420px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🛌</div>
      <p style="font-size:13px;color:#64748B;margin-bottom:20px;">
        {{ $t('riskStaff.restDialogText') }} <strong>{{ restTarget?.firstName }} {{ restTarget?.lastName }}</strong>.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button class="cs-btn cs-btn-secondary cs-btn-full" @click="confirmRest(15)">⏱ {{ $t('riskStaff.min15') }}</button>
        <button class="cs-btn cs-btn-secondary cs-btn-full" @click="confirmRest(30)">⏱ {{ $t('riskStaff.min30') }}</button>
        <button class="cs-btn cs-btn-secondary cs-btn-full" @click="confirmRest(60)">⏱ {{ $t('riskStaff.hour1') }}</button>
        <button class="cs-btn cs-btn-danger cs-btn-full" @click="confirmRest(120)">⏱ {{ $t('riskStaff.hour2Urgent') }}</button>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" severity="secondary" text @click="showRest = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClinicalRiskStore } from '../../application/clinical-risk.store.js'
import { useIncidentStore } from '../../../incident-alert-management/application/incident.store.js'
import { useI18n } from 'vue-i18n'

const store   = useClinicalRiskStore()
const incident = useIncidentStore()
const { t } = useI18n({ useScope: 'global' })

const showRest   = ref(false)
const restTarget = ref(null)

const criticalOrHigh = computed(() => store.staff.filter(s => ['critical','high'].includes(s.riskLevel)))
const acceptable     = computed(() => store.staff.filter(s => ['moderate','low'].includes(s.riskLevel)))

const riskColorMap = { critical:'#EF4444', high:'#F97316', moderate:'#F59E0B', low:'#10B981' }
const riskColor = (l) => riskColorMap[l] || '#94A3B8'
const riskLabel = (l) => l ? t(`risk.${l}`) : '—'

const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area
const specialtyKey = (spec = '') => ({ 'Cardiología': 'cardiology', 'Medicina Interna': 'internalMedicine', 'Pediatría': 'pediatrics', 'Cirugía General': 'generalSurgery', 'Ginecología': 'gynecology' }[spec] || '')
const specialtyLabel = (spec) => specialtyKey(spec) ? t(`specialties.${specialtyKey(spec)}`) : spec

function getLatest (staffId, field) {
  const rec = store.getLatestBiometricFor(staffId)
  return rec ? rec[field] ?? '—' : '—'
}

function shiftHours (staffId) {
  // Mock: derivar horas de guardia de fatigueLevel como aproximación
  const s = store.staff.find(x => x.id === staffId)
  if (!s) return '—'
  const h = Math.round(s.fatigueLevel * 0.2)
  return `${h}h`
}

function openRestModal (m) { restTarget.value = m; showRest.value = true }
function contactStaff (m)  { alert(t('riskStaff.contactMessage', { name: `${m.firstName} ${m.lastName}` })) }

async function confirmRest (minutes) {
  if (!restTarget.value) return
  const type = minutes >= 120 ? 'urgent_rest' : 'rest_recommendation'
  await incident.registerAction({
    staffId:   restTarget.value.id,
    alertId:   null,
    type,
    notes:     t('riskStaff.restNotes', { minutes }),
    staffName: `${restTarget.value.firstName} ${restTarget.value.lastName}`,
    area:      restTarget.value.area
  })
  showRest.value = false
  alert(t('riskStaff.restAssignedMessage', { minutes, name: `${restTarget.value.firstName} ${restTarget.value.lastName}` }))
}

onMounted(async () => {
  await Promise.all([store.fetchStaff(), store.fetchBiometrics()])
})
</script>

<style scoped>
.risk-alert-banner {
  display: flex; align-items: flex-start; gap: 12px;
  background: #FEF2F2; border: 1px solid #FECACA;
  border-radius: 12px; padding: 14px 18px;
  margin: 12px 0 20px; font-size: 13px; color: #991B1B;
}
.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}
.risk-card {
  background: var(--bg-card); border-radius: 14px;
  border: 1px solid var(--border); padding: 20px;
  box-shadow: var(--shadow-sm); transition: all 0.2s;
}
.risk-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.risk-card.critical { border-left: 4px solid #EF4444; }
.risk-card.high     { border-left: 4px solid #F97316; }
.risk-card-header   { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.risk-stat {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px;
}
.risk-stat:last-of-type { border-bottom: none; }
.risk-stat-label { color: #64748B; }
.risk-stat-value  { font-weight: 700; }
.risk-actions { display: flex; gap: 8px; margin-top: 14px; }
.cs-btn-full { width: 100%; }
</style>
