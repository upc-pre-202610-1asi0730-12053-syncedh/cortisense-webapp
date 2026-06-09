<template>
  <section>
    <header class="page-header"><h1>Reportes</h1><p>Indicadores globales del <strong>centro médico</strong> para seguimiento operativo y preventivo.</p></header>
    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-users"></i></div><p>Personal médico activo</p><h2>{{ activeDoctors.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon purple"><i class="pi pi-users"></i></div><p>Equipos activos</p><h2 class="purple-text">{{ activeTeams.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-exclamation-triangle"></i></div><p>Riesgo alto/crítico</p><h2 class="danger-text">{{ highRisk.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-bell"></i></div><p>Alertas activas</p><h2 class="warning-text">{{ activeAlerts.length }}</h2></article>
    </section>

    <section class="summary-grid" style="grid-template-columns:minmax(0,1fr) repeat(3, 220px)">
      <article class="summary-card fatigue-card"><div><h2>Fatiga promedio institucional</h2><p>Promedio calculado sobre el personal médico activo.</p></div><div class="fatigue-value"><strong>{{ averageFatigue }}%</strong><span>Promedio</span></div><div class="progress-track"><div class="progress-fill" :style="{width:`${averageFatigue}%`}"></div></div></article>
      <article class="summary-card alert-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><h2 class="success-text">{{ resolvedAlerts.length }}</h2><p>Alertas resueltas</p></article>
      <article class="summary-card alert-card"><div class="metric-icon danger"><i class="pi pi-bolt"></i></div><h2>{{ openAnomalies.length }}</h2><p>Anomalías abiertas</p></article>
      <article class="summary-card alert-card"><div class="metric-icon blue"><i class="pi pi-clipboard"></i></div><h2 class="blue-text">{{ completedActions.length }}</h2><p>Acciones completadas</p></article>
    </section>

    <section class="report-grid">
      <article class="content-card"><div class="section-header"><div><h2>Resumen por personal médico</h2><p>Consolidado de riesgo, alertas, anomalías, acciones y turnos.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Personal</th><th>Equipo</th><th>Riesgo</th><th>Alertas</th><th>Anomalías</th><th>Acciones</th></tr></thead><tbody><tr v-for="item in staffSummary" :key="item.user.id"><td><div class="staff-profile"><div class="avatar">{{ initials(item.user) }}</div><div><strong>{{ fullName(item.user) }}</strong><span>{{ item.user.email }}</span></div></div></td><td>{{ item.team?.name || '—' }}</td><td><span class="risk-pill" :class="riskClass(item.risk?.riskLevel)">{{ riskLabel(item.risk?.riskLevel) }}</span><strong style="display:block;margin-top:6px">{{ item.risk?.fatigueLevel || 0 }}%</strong></td><td><span class="pill warning">{{ item.alerts }}</span></td><td><span class="pill danger">{{ item.anomalies }}</span></td><td><span class="pill info">{{ item.actions }}</span></td></tr></tbody></table></div></article>
      <article class="content-card"><div class="section-header"><div><h2>Resumen por equipos</h2><p>Equipos activos con supervisor y miembros asignados.</p></div></div><div class="teams-list"><div v-for="team in activeTeams" :key="team.id" class="team-item"><div><strong>{{ team.name }}</strong><span>Supervisor: {{ fullName(userById(team.supervisorId)) }}</span></div><div class="team-count"><strong>{{ memberCount(team.id) }}</strong><span>Miembros</span></div></div></div></article>
    </section>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, fullName, initials, riskClass } from '../../../shared/infrastructure/api.service.js'
const authStore=useAuthStore()
const users=ref([]), risks=ref([]), alerts=ref([]), shifts=ref([]), teams=ref([]), members=ref([]), anomalies=ref([]), actions=ref([])
const orgId = computed(() => authStore.user?.organizationId || 1)
onMounted(async()=>{[users.value,risks.value,alerts.value,shifts.value,teams.value,members.value,anomalies.value,actions.value]=await Promise.all([listResource('users'),listResource('riskAssessments'),listResource('clinicalAlerts'),listResource('shiftRecords'),listResource('careTeams'),listResource('teamMembers'),listResource('vitalSignAnomalies'),listResource('preventiveActions')])})
const orgUsers=computed(()=>users.value.filter(u=>Number(u.organizationId)===Number(orgId.value)))
const activeDoctors=computed(()=>orgUsers.value.filter(u=>u.role==='DOCTOR'&&u.status==='ACTIVE'))
const activeTeams=computed(()=>teams.value.filter(t=>Number(t.organizationId)===Number(orgId.value)&&t.status==='ACTIVE'))
const orgRisks=computed(()=>risks.value.filter(r=>Number(r.organizationId)===Number(orgId.value)))
const highRisk=computed(()=>orgRisks.value.filter(r=>['HIGH','CRITICAL'].includes(r.riskLevel)))
const activeAlerts=computed(()=>alerts.value.filter(a=>Number(a.organizationId)===Number(orgId.value)&&['ACTIVE','OPEN'].includes(a.status)))
const resolvedAlerts=computed(()=>alerts.value.filter(a=>Number(a.organizationId)===Number(orgId.value)&&['RESOLVED','REVIEWED'].includes(a.status)))
const openAnomalies=computed(()=>anomalies.value.filter(a=>Number(a.organizationId)===Number(orgId.value)&&['OPEN','ACTIVE'].includes(a.status)))
const completedActions=computed(()=>actions.value.filter(a=>Number(a.organizationId)===Number(orgId.value)&&a.status==='COMPLETED'))
const averageFatigue=computed(()=>orgRisks.value.length?Math.round(orgRisks.value.reduce((s,r)=>s+Number(r.fatigueLevel||0),0)/orgRisks.value.length):0)
const staffSummary=computed(()=>activeDoctors.value.map(user=>{const member=members.value.find(m=>Number(m.userId)===Number(user.id)); return { user, team: teams.value.find(t=>Number(t.id)===Number(member?.teamId)), risk: risks.value.find(r=>Number(r.userId)===Number(user.id)), alerts: alerts.value.filter(a=>Number(a.userId)===Number(user.id)).length, anomalies: anomalies.value.filter(a=>Number(a.userId)===Number(user.id)).length, actions: actions.value.filter(a=>Number(a.assignedUserId||a.userId)===Number(user.id)).length }}).slice(0,8))
function userById(id){return users.value.find(u=>Number(u.id)===Number(id))}
function memberCount(id){return members.value.filter(m=>Number(m.teamId)===Number(id)).length}
function riskLabel(value){ if(!value) return 'Bajo'; return String(value).toUpperCase()==='CRITICAL'?'Crítico':String(value).toUpperCase()==='HIGH'?'Alto':String(value).toUpperCase()==='MEDIUM'?'Medio':'Bajo'}
</script>
