<template>
  <section>
    <header class="page-header"><h1>Auditoría</h1><p>Consulta la <strong>trazabilidad</strong> de acciones relevantes del sistema.</p></header>
    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-history"></i></div><p>Total de eventos</p><h2>{{ orgLogs.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-info-circle"></i></div><p>Informativos</p><h2 class="success-text">{{ countSeverity('INFO') }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-exclamation-circle"></i></div><p>Advertencias</p><h2 class="warning-text">{{ countSeverity('WARNING') }}</h2></article>
      <article class="metric-card"><div class="metric-icon danger"><i class="pi pi-times-circle"></i></div><p>Críticos</p><h2 class="danger-text">{{ criticalCount }}</h2></article>
    </section>
    <article class="content-card full-width">
      <div class="toolbar-row" style="grid-template-columns:minmax(320px,1fr) 220px">
        <input v-model.trim="search" class="input" placeholder="Buscar por tipo, recurso o detalle...">
        <select v-model="severity" class="select"><option value="">Todas las severidades</option><option>INFO</option><option>WARNING</option><option>ERROR</option><option>CRITICAL</option></select>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Severidad</th><th>Actor</th><th>Recurso</th><th>Detalle</th></tr></thead><tbody><tr v-for="log in filteredLogs" :key="log.id"><td>{{ formatDate(log.createdAt) }}</td><td><strong>{{ normalizeText(log.type) }}</strong></td><td><span class="pill" :class="severityClass(log.severity)">{{ log.severity }}</span></td><td>{{ fullName(userById(log.actorUserId)) }}</td><td>{{ log.resourceType }} #{{ log.resourceId }}</td><td>{{ log.description }}</td></tr></tbody></table></div>
    </article>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, fullName, normalizeText } from '../../../shared/infrastructure/api.service.js'
const authStore=useAuthStore(); const logs=ref([]), users=ref([]), search=ref(''), severity=ref('')
const orgId=computed(()=>authStore.user?.organizationId||1)
onMounted(async()=>{[logs.value,users.value]=await Promise.all([listResource('auditLogs'),listResource('users')])})
const orgLogs=computed(()=>logs.value.filter(log=>Number(log.organizationId)===Number(orgId.value)))
const filteredLogs=computed(()=>orgLogs.value.filter(log=>{const text=`${log.type} ${log.description} ${log.resourceType}`.toLowerCase();return(!search.value||text.includes(search.value.toLowerCase()))&&(!severity.value||log.severity===severity.value)}).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)))
const criticalCount=computed(()=>orgLogs.value.filter(log=>['ERROR','CRITICAL'].includes(log.severity)).length)
function countSeverity(value){return orgLogs.value.filter(log=>log.severity===value).length}
function userById(id){return users.value.find(u=>Number(u.id)===Number(id))} function formatDate(v){return v?new Date(v).toLocaleString():'—'}
function severityClass(value){ if(['ERROR','CRITICAL'].includes(value)) return 'danger'; if(value==='WARNING') return 'warning'; return 'info'}
</script>
