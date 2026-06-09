<template>
  <section>
    <header class="page-header"><h1>Suscripción</h1><p>Gestiona el <strong>plan activo</strong> del centro médico.</p></header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-credit-card"></i></div><p>Plan actual</p><h2 style="font-size:1.55rem">{{ currentPlan?.name || '—' }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Estado</p><h2 class="success-text" style="font-size:1.75rem">{{ statusLabel(currentSubscription?.status) }}</h2></article>
      <article class="metric-card"><div class="metric-icon purple"><i class="pi pi-sparkles"></i></div><p>Costo mensual</p><h2>${{ currentPlan?.price || 0 }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-refresh"></i></div><p>Pagos registrados</p><h2 class="warning-text">{{ orgSessions.length }}</h2></article>
    </section>

    <section class="content-grid">
      <article class="plan-current">
        <div class="section-header"><div><h2>Plan actual</h2><p>Información de la suscripción activa del centro médico.</p></div><span class="pill success">Activo</span></div>
        <div class="plan-banner"><div class="metric-icon blue"><i class="pi pi-credit-card"></i></div><div><span style="color:#0FB7C2;text-transform:uppercase;letter-spacing:.1em;font-size:.75rem;font-weight:900">Plan activo</span><h2 style="margin:6px 0 0">{{ currentPlan?.name || '—' }}</h2></div></div>
        <div class="plan-price">${{ currentPlan?.price || 0 }} <span>/ mes</span></div>
        <div class="plan-meta-grid"><div class="plan-meta"><span>Código del plan</span><strong>{{ currentPlan?.code || '—' }}</strong></div><div class="plan-meta"><span>Inicio</span><strong>{{ shortDate(currentSubscription?.startedAt) }}</strong></div><div class="plan-meta"><span>Último pago</span><strong>{{ shortDate(lastSession?.createdAt) }}</strong></div></div>
      </article>

      <article class="content-card">
        <div class="section-header"><div><h2>Planes disponibles</h2><p>Puedes simular un cambio de plan para la demo.</p></div></div>
        <div class="list-stack">
          <div v-for="plan in otherPlans" :key="plan.id" class="available-plan">
            <div><span class="code">{{ plan.code }}</span><h3>{{ plan.name }}</h3><div class="plan-price" style="font-size:1.55rem">${{ plan.price }} <span>/ mes</span></div></div>
            <button class="btn primary" @click="changePlan(plan)"><i class="pi pi-refresh"></i>Cambiar plan</button>
          </div>
        </div>
      </article>

      <article class="content-card full-width">
        <div class="section-header"><div><h2>Historial de pagos</h2><p>Sesiones de checkout registradas para la organización.</p></div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Plan</th><th>Estado</th><th>Sesión</th></tr></thead><tbody><tr v-for="item in orgSessions" :key="item.id"><td>{{ compactDate(item.createdAt) }}</td><td>{{ item.planCode }}</td><td><span class="pill success">Completado</span></td><td>#{{ item.id }}</td></tr></tbody></table></div>
      </article>
    </section>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { createResource, listResource, patchResource } from '../../../shared/infrastructure/api.service.js'
const authStore = useAuthStore()
const plans = ref([]); const subscriptions = ref([]); const sessions = ref([])
const orgId = computed(() => authStore.user?.organizationId || 1)
const currentSubscription = computed(() => subscriptions.value.find(s => Number(s.organizationId) === Number(orgId.value)) || subscriptions.value[0])
const currentPlan = computed(() => plans.value.find(plan => Number(plan.id) === Number(currentSubscription.value?.planId)))
const orgSessions = computed(() => sessions.value.filter(s => Number(s.organizationId) === Number(orgId.value)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)))
const lastSession = computed(() => orgSessions.value[0])
const otherPlans = computed(() => plans.value.filter(plan => Number(plan.id) !== Number(currentPlan.value?.id)))
onMounted(loadData)
async function loadData () { [plans.value, subscriptions.value, sessions.value] = await Promise.all([listResource('plans'), listResource('subscriptions'), listResource('checkoutSessions')]) }
async function changePlan (plan) { if (!currentSubscription.value) return; await patchResource('subscriptions', currentSubscription.value.id, { planId: plan.id }); await createResource('checkoutSessions', { organizationId: orgId.value, administratorId: authStore.user?.id || 1, subscriptionId: currentSubscription.value.id, planId: plan.id, planCode: plan.code, status: 'COMPLETED', createdAt: new Date().toISOString() }); await loadData() }
function statusLabel (value) { return String(value || '').toUpperCase() === 'ACTIVE' ? 'Activo' : value || '—' }
function shortDate (value) { return value ? String(value).slice(0,10) : '—' }
function compactDate (value) { if (!value) return '—'; return String(value).replace('T',' ').slice(0,16) }
</script>
