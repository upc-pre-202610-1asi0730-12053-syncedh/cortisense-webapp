<!--
  @file admin-dashboard.view.vue
  @description Dashboard administrativo de CortiSense con KPIs, gráficos y tabla de fatiga.
  Bounded context: audit-compliance
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('dashboard.admin.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('dashboard.admin.subtitle') }}</p>
    </div>

    <!-- KPIs -->
    <div class="cs-kpi-grid">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">👥</div>
        <div class="cs-kpi-label">{{ $t('dashboard.admin.totalStaff') }}</div>
        <div class="cs-kpi-value">{{ stats.total }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.admin.registeredStaff', { count: stats.total }) }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⚠️</div>
        <div class="cs-kpi-label">{{ $t('dashboard.admin.highRisk') }}</div>
        <div class="cs-kpi-value critical">{{ stats.highRisk }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.admin.highOrCritical') }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🔔</div>
        <div class="cs-kpi-label">{{ $t('dashboard.admin.activeAlerts') }}</div>
        <div class="cs-kpi-value warning">{{ stats.activeAlerts }}</div>
        <div class="cs-kpi-sub">{{ $t('dashboard.admin.criticalAlerts', { count: stats.criticalAlerts }) }}</div>
      </div>
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">⏱️</div>
        <div class="cs-kpi-label">{{ $t('dashboard.admin.activeSubscription') }}</div>
        <div class="cs-kpi-value primary">{{ subPlan }}</div>
        <div class="cs-kpi-sub">{{ subStatus }}</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="cs-grid-2" style="margin-bottom:20px;">
      <!-- Fatigue trend -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="cs-card-header">
          <div>
            <div class="cs-card-title">{{ $t('dashboard.admin.fatigueEvolution7d') }}</div>
            <div class="cs-card-subtitle">{{ $t('dashboard.admin.activeStaffAverage') }}</div>
          </div>
        </div>
        <div style="height:220px;position:relative;">
          <canvas id="fatigaChart"></canvas>
        </div>
      </div>

      <!-- Risk distribution -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="cs-card-header">
          <div>
            <div class="cs-card-title">{{ $t('dashboard.admin.riskSummary') }}</div>
            <div class="cs-card-subtitle">{{ $t('dashboard.admin.currentStaffStatus') }}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:24px;height:220px;">
          <canvas id="riskChart" style="max-width:200px;"></canvas>
          <div style="flex:1;">
            <div class="metric-row"><span class="metric-label">🔴 {{ $t('risk.critical') }}</span><span class="metric-value" style="color:#EF4444;">{{ riskCounts.critical }}</span></div>
            <div class="metric-row"><span class="metric-label">🟠 {{ $t('risk.high') }}</span><span class="metric-value" style="color:#F97316;">{{ riskCounts.high }}</span></div>
            <div class="metric-row"><span class="metric-label">🟡 {{ $t('risk.moderate') }}</span><span class="metric-value" style="color:#F59E0B;">{{ riskCounts.moderate }}</span></div>
            <div class="metric-row"><span class="metric-label">🟢 {{ $t('risk.low') }}</span><span class="metric-value" style="color:#10B981;">{{ riskCounts.low }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top fatigued staff -->
    <div class="cs-card" style="margin-bottom:0;">
      <div class="cs-card-header">
        <div class="cs-card-title">{{ $t('dashboard.admin.topFatigue') }}</div>
        <RouterLink to="/admin/staff/list" class="cs-btn cs-btn-secondary cs-btn-sm">{{ $t('dashboard.admin.viewAllStaff') }}</RouterLink>
      </div>
      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ $t('common.staff') }}</th><th>{{ $t('common.area') }}</th><th>{{ $t('common.riskLevel') }}</th><th>{{ $t('vitals.fatigue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in topFatigued" :key="member.id">
              <td>
                <div class="user-cell">
                  <div class="cs-avatar" :style="{ background: riskColor(member.riskLevel), width:'32px', height:'32px', fontSize:'11px' }">
                    {{ initials(member) }}
                  </div>
                  <div class="user-cell-info">
                    <div class="name">{{ member.firstName }} {{ member.lastName }}</div>
                    <div class="sub">{{ specialtyLabel(member.specialty) }}</div>
                  </div>
                </div>
              </td>
              <td>{{ areaLabel(member.area) }}</td>
              <td><span class="cs-badge" :class="`cs-badge-${member.riskLevel}`">{{ $t(`risk.${member.riskLevel}`) }}</span></td>
              <td>
                <div class="fatigue-bar-wrap">
                  <div class="fatigue-bar">
                    <div class="fatigue-bar-fill" :class="member.riskLevel === 'moderate' ? 'medium' : member.riskLevel" :style="{ width: member.fatigueLevel + '%' }"></div>
                  </div>
                  <span class="fatigue-label" :style="{ color: riskColor(member.riskLevel) }">{{ member.fatigueLevel }}%</span>
                </div>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { http } from '../../../shared/infrastructure/http.js'
import { useI18n } from 'vue-i18n'

Chart.register(...registerables)

const { t, locale } = useI18n({ useScope: 'global' })

const staffList  = ref([])
const alerts     = ref([])
const subscription = ref(null)
const plan       = ref(null)
const loading    = ref(true)
let fatigueChart = null
let riskChart = null

const stats = computed(() => ({
  total:         staffList.value.length,
  highRisk:      staffList.value.filter(s => ['high','critical'].includes(s.riskLevel)).length,
  activeAlerts:  alerts.value.filter(a => a.status === 'pending').length,
  criticalAlerts: alerts.value.filter(a => a.severity === 'critical').length
}))

const topFatigued = computed(() =>
  [...staffList.value].sort((a, b) => b.fatigueLevel - a.fatigueLevel).slice(0, 5)
)

const riskCounts = computed(() => ({
  critical: staffList.value.filter(s => s.riskLevel === 'critical').length,
  high:     staffList.value.filter(s => s.riskLevel === 'high').length,
  moderate: staffList.value.filter(s => s.riskLevel === 'moderate').length,
  low:      staffList.value.filter(s => s.riskLevel === 'low').length
}))

const subPlan   = computed(() => plan.value?.name ? t(`subscription.plans.${planKey(plan.value.name)}`) : t('subscription.plans.clinical'))
const subStatus = computed(() => subscription.value ? `${subscription.value.staffUsed || subscription.value.usedStaff || 0}/${subscription.value.staffLimit} ${t('common.staff').toLowerCase()}` : '')

const riskColorMap = { critical: '#EF4444', high: '#F97316', moderate: '#F59E0B', low: '#10B981' }
const riskColor = (level) => riskColorMap[level] || '#94A3B8'
const initials  = (m) => ((m.firstName?.[0] || '') + (m.lastName?.[0] || '')).toUpperCase()
const planKey = (name = '') => name.toLowerCase().includes('starter') ? 'starter' : name.toLowerCase().includes('enterprise') ? 'enterprise' : 'clinical'

const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'Cirugía': 'surgery', 'Obstetricia': 'obstetrics', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area
const specialtyKey = (spec = '') => ({ 'Cardiología': 'cardiology', 'Medicina Interna': 'internalMedicine', 'Pediatría': 'pediatrics', 'Cirugía General': 'generalSurgery', 'Ginecología': 'gynecology' }[spec] || '')
const specialtyLabel = (spec) => specialtyKey(spec) ? t(`specialties.${specialtyKey(spec)}`) : spec
const weekLabels = computed(() => locale.value === 'es' ? ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])

onMounted(async () => {
  try {
    const [staffRes, alertRes, subRes] = await Promise.all([
      http.get(import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH),
      http.get(import.meta.env.VITE_ALERTS_ENDPOINT_PATH),
      http.get(import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH)
    ])
    staffList.value  = staffRes.data
    alerts.value     = alertRes.data
    subscription.value = subRes.data[0] || null

    if (subscription.value?.planId) {
      const planRes = await http.get(`${import.meta.env.VITE_PLANS_ENDPOINT_PATH}/${subscription.value.planId}`)
      plan.value = planRes.data
    }
  } finally {
    loading.value = false
  }

  // Chart — Fatigue line
  const ctx1 = document.getElementById('fatigaChart')?.getContext('2d')
  if (ctx1) {
    fatigueChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: weekLabels.value,
        datasets: [{
          label: t('dashboard.admin.chartAverageFatigue'),
          data: [52, 58, 61, 74, 68, 55, 63],
          borderColor: '#45DDE5', backgroundColor: 'rgba(69,221,229,0.08)',
          borderWidth: 2.5, pointBackgroundColor: '#45DDE5',
          pointRadius: 4, tension: 0.4, fill: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
          x: { grid: { display: false },                     ticks: { font: { size: 11 }, color: '#94A3B8' } }
        }
      }
    })
  }

  // Chart — Risk donut
  const ctx2 = document.getElementById('riskChart')?.getContext('2d')
  if (ctx2) {
    riskChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: [t('risk.critical'), t('risk.high'), t('risk.moderate'), t('risk.low')],
        datasets: [{
          data: [riskCounts.value.critical, riskCounts.value.high, riskCounts.value.moderate, riskCounts.value.low],
          backgroundColor: ['#EF4444','#F97316','#F59E0B','#10B981'],
          borderWidth: 0, hoverOffset: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false } }
      }
    })
  }
})

onBeforeUnmount(() => {
  fatigueChart?.destroy()
  riskChart?.destroy()
})
</script>
