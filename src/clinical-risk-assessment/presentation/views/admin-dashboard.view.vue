<template>
  <section>
    <header class="page-header">
      <h1>{{ $t('pages.adminDashboard.title') }}</h1>
      <p>Vista global del <strong>centro médico</strong> y su operación preventiva.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-users"></i></div><p>Personal activo</p><h2>{{ activeUsers.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon purple"><i class="pi pi-shield"></i></div><p>Supervisores activos</p><h2 class="purple-text">{{ activeSupervisors.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon cyan"><i class="pi pi-sitemap"></i></div><p>Equipos activos</p><h2 class="cyan-text">{{ activeTeams.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-exclamation-triangle"></i></div><p>Personal en riesgo</p><h2 class="danger-text">{{ staffAtRisk.length }}</h2></article>
    </section>

    <section class="summary-grid">
      <article class="summary-card fatigue-card">
        <div><h2>Fatiga promedio institucional</h2><p>Promedio calculado con las evaluaciones activas del personal médico.</p></div>
        <div class="fatigue-value"><strong>{{ averageFatigue }}%</strong><span>Promedio</span></div>
        <div class="progress-track"><div class="progress-fill" :style="{ width: `${averageFatigue}%` }"></div></div>
      </article>
      <article class="summary-card alert-card"><div class="metric-icon warning"><i class="pi pi-bell"></i></div><h2>{{ activeAlerts.length }}</h2><p>Alertas clínicas activas</p></article>
    </section>

    <section class="content-grid">
      <article class="content-card">
        <div class="section-header"><div><h2>Personal en riesgo</h2><p>Usuarios con fatiga alta o crítica.</p></div></div>
        <div class="risk-list">
          <div v-for="risk in staffAtRisk" :key="risk.id" class="risk-item">
            <div class="staff-profile"><div class="avatar">{{ initials(userById(risk.userId)) }}</div><div><strong>{{ fullName(userById(risk.userId)) }}</strong><span>{{ userById(risk.userId)?.email }}</span></div></div>
            <div class="risk-data"><span class="risk-pill" :class="riskClass(risk.riskLevel)">{{ riskLabel(risk.riskLevel) }}</span><strong>{{ risk.fatigueLevel }}%</strong></div>
          </div>
          <p v-if="!staffAtRisk.length" class="empty-state">No hay personal en riesgo.</p>
        </div>
      </article>
      <article class="content-card">
        <div class="section-header"><div><h2>Equipos activos</h2><p>Grupos clínicos operativos y supervisores asignados.</p></div></div>
        <div class="teams-list">
          <div v-for="team in activeTeams" :key="team.id" class="team-item">
            <div><strong>{{ team.name }}</strong><span>Supervisor: {{ fullName(userById(team.supervisorId)) }}</span></div>
            <div class="team-count"><strong>{{ memberCount(team.id) }}</strong><span>Miembros</span></div>
          </div>
          <p v-if="!activeTeams.length" class="empty-state">No hay equipos activos.</p>
        </div>
      </article>
    </section>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, fullName, initials, riskClass } from '../../../shared/infrastructure/api.service.js'
const authStore = useAuthStore()
const users = ref([]), risks = ref([]), alerts = ref([]), teams = ref([]), members = ref([])
onMounted(async () => { [users.value, risks.value, alerts.value, teams.value, members.value] = await Promise.all([listResource('users'), listResource('riskAssessments'), listResource('clinicalAlerts'), listResource('careTeams'), listResource('teamMembers')]) })
const orgId = computed(() => authStore.user?.organizationId || 1)
const orgUsers = computed(() => users.value.filter(u => Number(u.organizationId) === Number(orgId.value)))
const activeUsers = computed(() => orgUsers.value.filter(u => ['DOCTOR','SUPERVISOR'].includes(u.role) && u.status === 'ACTIVE'))
const activeSupervisors = computed(() => orgUsers.value.filter(u => u.role === 'SUPERVISOR' && u.status === 'ACTIVE'))
const activeTeams = computed(() => teams.value.filter(t => Number(t.organizationId) === Number(orgId.value) && t.status === 'ACTIVE'))
const activeAlerts = computed(() => alerts.value.filter(a => Number(a.organizationId) === Number(orgId.value) && ['ACTIVE','OPEN'].includes(a.status)))
const orgRisks = computed(() => risks.value.filter(r => Number(r.organizationId) === Number(orgId.value)))
const staffAtRisk = computed(() => orgRisks.value.filter(r => ['HIGH','CRITICAL'].includes(r.riskLevel)).sort((a,b) => b.fatigueLevel - a.fatigueLevel))
const averageFatigue = computed(() => orgRisks.value.length ? Math.round(orgRisks.value.reduce((sum, r) => sum + Number(r.fatigueLevel || 0), 0) / orgRisks.value.length) : 0)
function userById (id) { return users.value.find(u => Number(u.id) === Number(id)) }
function memberCount (teamId) { return members.value.filter(m => Number(m.teamId) === Number(teamId)).length }
function riskLabel (value) { return String(value).toUpperCase() === 'CRITICAL' ? 'Crítico' : String(value).toUpperCase() === 'HIGH' ? 'Alto' : value }
</script>
