<!--
  @file admin-subscription.view.vue
  @description Suscripción admin — fiel a la demo: plan actual + comparar planes.
  Usa subscription.store.js
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('subscription.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('subscription.subtitle') }}</p>
    </div>

    <div v-if="store.loading" style="text-align:center;padding:3rem;color:var(--text-muted);">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;"></i>
    </div>

    <template v-else-if="store.subscription">
      <!-- Plan actual banner -->
      <div class="cs-card plan-current-banner">
        <div class="plan-current-top">
          <div>
            <div class="section-label">{{ $t('subscription.currentPlan') }}</div>
            <div class="plan-current-name">{{ currentPlanName }}</div>
            <div class="plan-current-meta">{{ store.subscription.hospitalName }} · {{ $t('subscription.activeSince') }} {{ formatDate(store.subscription.startedAt) }}</div>
          </div>
          <div class="plan-current-right">
            <div class="current-badge-inline">✅ {{ $t('subscription.activePlan') }}</div>
            <div class="plan-renewal">{{ $t('subscription.renewalAt') }}: <strong>{{ formatDate(store.subscription.renewalAt) }}</strong></div>
          </div>
        </div>

        <div class="plan-metrics">
          <div class="plan-metric">
            <div class="plan-metric-label">{{ $t('subscription.staff') }}</div>
            <div class="plan-metric-value">{{ store.staffCount }} / {{ store.subscription.staffLimit }}</div>
            <div class="fatigue-bar" style="margin-top:6px;">
              <div class="fatigue-bar-fill" :class="store.subscription.usagePercent > 80 ? 'high' : 'low'" :style="{ width: store.subscription.usagePercent + '%' }"></div>
            </div>
          </div>
          <div class="plan-metric">
            <div class="plan-metric-label">{{ $t('subscription.supervisors') }}</div>
            <div class="plan-metric-value">4</div>
          </div>
          <div class="plan-metric">
            <div class="plan-metric-label">{{ $t('subscription.devices') }}</div>
            <div class="plan-metric-value">{{ store.devicesCount }}</div>
          </div>
          <div class="plan-metric">
            <div class="plan-metric-label">{{ $t('subscription.billing') }}</div>
            <div class="plan-metric-value primary">S/ {{ store.subscription.billingMonthly }}/{{ $t('common.month') }}</div>
          </div>
        </div>
      </div>

      <!-- Comparar planes -->
      <h2 class="plans-section-title">{{ $t('subscription.comparePlans') }}</h2>
      <p class="plans-section-sub">{{ $t('subscription.comparePlansSubtitle') }}</p>

      <div class="plan-grid">
        <div
          v-for="plan in staticPlans" :key="plan.id"
          class="plan-card"
          :class="{ current: plan.key === currentPlanKey }"
        >
          <div v-if="plan.key === currentPlanKey" class="plan-badge">{{ $t('subscription.current') }}</div>
          <div class="plan-name" :style="{ color: plan.color }">{{ plan.name }}</div>
          <div class="plan-price">{{ plan.price }}<span>/{{ $t('common.month') }}</span></div>
          <div class="plan-desc">{{ plan.desc }}</div>
          <ul class="plan-features">
            <li v-for="f in plan.features" :key="f.text">
              <span :class="f.included ? 'check' : 'cross'">{{ f.included ? '✓' : '✗' }}</span>
              <span :class="{ 'font-bold': f.highlight }">{{ f.text }}</span>
            </li>
          </ul>
          <button
            class="cs-btn cs-btn-full"
            :class="plan.key === currentPlanKey ? 'cs-btn-secondary' : 'cs-btn-primary'"
            :style="plan.btnStyle || {}"
            :disabled="plan.key === currentPlanKey"
            @click="handleChangePlan(plan)"
          >
            {{ plan.key === currentPlanKey ? $t('subscription.current') : plan.btnLabel }}
          </button>
        </div>
      </div>
    </template>

    <div v-else class="cs-card" style="text-align:center;padding:3rem;">
      <p style="color:var(--text-muted);">{{ $t('subscription.noSubscription') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubscriptionStore } from '../../application/subscription.store.js'

const { t, locale } = useI18n({ useScope: 'global' })
const store = useSubscriptionStore()

const currentPlanKey = computed(() => planKey(store.subscription?.planName))
const currentPlanName = computed(() => t(`subscription.plans.${currentPlanKey.value}`))

function planKey (name = '') {
  const n = name.toLowerCase()
  if (n.includes('starter')) return 'starter'
  if (n.includes('enterprise') || n.includes('empresa')) return 'enterprise'
  return 'clinical'
}

const staticPlans = computed(() => [
  {
    id: 'starter', key: 'starter', name: t('subscription.plans.starter'), price: 'S/ 299', color: '#64748B',
    desc: t('subscription.planDesc.starter'),
    btnLabel: t('subscription.planButtons.starter'),
    features: [
      { text: t('subscription.features.upTo10'), included: true },
      { text: t('subscription.features.basicDashboard'), included: true },
      { text: t('subscription.features.fatigueAlerts'), included: true },
      { text: t('subscription.features.invitationManagement'), included: true },
      { text: t('subscription.features.advancedReports'), included: false },
      { text: t('subscription.features.fullAudit'), included: false },
      { text: t('subscription.features.prioritySupport'), included: false }
    ]
  },
  {
    id: 'clinical', key: 'clinical', name: t('subscription.plans.clinical'), price: 'S/ 699', color: 'var(--primary)',
    desc: t('subscription.planDesc.clinical'),
    btnLabel: t('subscription.current'),
    features: [
      { text: t('subscription.features.upTo50'), included: true },
      { text: t('subscription.features.fullDashboard'), included: true },
      { text: t('subscription.features.realTimeAlerts'), included: true },
      { text: t('subscription.features.invitationManagement'), included: true },
      { text: t('subscription.features.operationalReports'), included: true },
      { text: t('subscription.features.fullAudit'), included: false },
      { text: t('subscription.features.prioritySupport'), included: true }
    ]
  },
  {
    id: 'enterprise', key: 'enterprise', name: t('subscription.plans.enterprise'), price: 'S/ 1,499', color: '#7C3AED',
    desc: t('subscription.planDesc.enterprise'),
    btnLabel: t('subscription.planButtons.enterprise'),
    btnStyle: { background: '#7C3AED', borderColor: '#7C3AED' },
    features: [
      { text: t('subscription.features.unlimitedUsers'), included: true },
      { text: t('subscription.features.fullDashboard'), included: true },
      { text: t('subscription.features.realTimeAlerts'), included: true },
      { text: t('subscription.features.invitationManagement'), included: true },
      { text: t('subscription.features.advancedReportsPdf'), included: true },
      { text: t('subscription.features.fullAudit'), included: true, highlight: true },
      { text: t('subscription.features.dedicated247Support'), included: true }
    ]
  }
])

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function handleChangePlan (plan) {
  if (!confirm(t('subscription.changeConfirm', { plan: plan.name }))) return
  alert(t('subscription.changeRequest', { plan: plan.name }))
}

onMounted(() => store.fetchAll())
</script>

<style scoped>
.plan-current-banner { border-left: 4px solid var(--primary); margin-bottom: 28px; }
.plan-current-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-wrap: wrap; gap: 16px;
}
.plan-current-name { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.plan-current-meta { font-size: 13px; color: var(--text-muted); }
.plan-current-right { text-align: right; }
.current-badge-inline {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(69,221,229,0.1); color: var(--primary);
  border: 1px solid var(--primary); border-radius: 20px;
  font-size: 12px; font-weight: 700; padding: 6px 16px;
}
.plan-renewal { font-size: 12px; color: var(--text-muted); margin-top: 8px; }

.plan-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-top: 20px; padding-top: 20px;
  border-top: 1px solid var(--border);
}
.plan-metric-label {
  font-size: 11px; color: #94A3B8; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.plan-metric-value { font-size: 20px; font-weight: 800; margin-top: 2px; }
.plan-metric-value.primary { color: var(--primary); }

.plans-section-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.plans-section-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

.plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.plan-card {
  background: var(--bg-card); border-radius: 16px;
  border: 2px solid var(--border); padding: 28px;
  text-align: center; position: relative; transition: all 0.2s;
}
.plan-card:hover:not(.current) {
  border-color: var(--primary);
  box-shadow: 0 8px 32px rgba(69,221,229,0.1);
  transform: translateY(-2px);
}
.plan-card.current {
  border-color: var(--primary);
  box-shadow: 0 8px 32px rgba(69,221,229,0.15);
}
.plan-badge {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  background: var(--primary); color: var(--bg-dark);
  font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 20px;
}
.plan-name { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
.plan-price { font-size: 36px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.plan-price span { font-size: 16px; font-weight: 400; color: var(--text-muted); }
.plan-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
.plan-features { list-style: none; text-align: left; margin-bottom: 24px; padding: 0; }
.plan-features li {
  font-size: 13px; padding: 5px 0; display: flex; align-items: center;
  gap: 8px; color: var(--text-secondary);
}
.check { color: var(--primary); font-weight: 700; }
.cross { color: var(--text-muted); }
.font-bold { font-weight: 700; }
.cs-btn-full { width: 100%; }
</style>
