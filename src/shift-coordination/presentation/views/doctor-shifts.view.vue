<template>
  <section>
    <header class="page-header">
      <h1>Mis turnos</h1>
      <p>Consulta tus turnos asignados y realiza <strong>check-in/check-out</strong>.</p>
    </header>

    <section class="metrics-grid">
      <article class="metric-card"><div class="metric-icon blue"><i class="pi pi-calendar"></i></div><p>Próximos</p><h2>{{ upcomingShifts.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon warning"><i class="pi pi-clock"></i></div><p>En curso</p><h2 class="warning-text">{{ inProgressShifts.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon success"><i class="pi pi-check-circle"></i></div><p>Completados</p><h2 class="success-text">{{ completedShifts.length }}</h2></article>
      <article class="metric-card"><div class="metric-icon cyan"><i class="pi pi-briefcase"></i></div><p>Horas registradas</p><h2 class="cyan-text">{{ completedHours }}h</h2></article>
    </section>

    <section class="summary-grid shift-summary-grid">
      <article class="summary-card next-shift-card">
        <div class="section-header">
          <div><h2>Turno actual o siguiente</h2><p>Acción rápida según el estado del turno.</p></div>
        </div>
        <template v-if="currentOrNextShift">
          <div class="shift-feature">
            <div class="shift-date large"><strong>{{ dayNumber(currentOrNextShift.scheduledStart) }}</strong><span>{{ monthLabel(currentOrNextShift.scheduledStart) }}</span></div>
            <div class="shift-detail"><h3>{{ areaName(currentOrNextShift.workAreaId) }}</h3><p>{{ shiftTypeLabel(currentOrNextShift.type) }} · {{ timeRange(currentOrNextShift) }}</p><span class="pill" :class="statusClass(currentOrNextShift.status)">{{ shiftStatusLabel(currentOrNextShift.status) }}</span></div>
            <button v-if="currentOrNextShift.status === 'SCHEDULED'" class="btn primary" @click="checkIn(currentOrNextShift)">Check-in</button>
            <button v-else-if="currentOrNextShift.status === 'IN_PROGRESS'" class="btn ghost" @click="checkOut(currentOrNextShift)">Check-out</button>
          </div>
        </template>
        <p v-else class="empty-state">No tienes turnos próximos.</p>
      </article>

      <article class="summary-card alert-card">
        <div class="metric-icon success"><i class="pi pi-check"></i></div>
        <h2>{{ attendanceRate }}%</h2>
        <p>Cumplimiento de turnos</p>
      </article>
    </section>

    <section class="content-grid lower-grid">
      <article class="content-card">
        <div class="section-header"><div><h2>Próximos turnos</h2><p>Turnos programados o en curso.</p></div></div>
        <div class="shift-list">
          <div v-for="shift in upcomingShifts" :key="shift.id" class="shift-item">
            <div class="shift-date"><strong>{{ dayNumber(shift.scheduledStart) }}</strong><span>{{ monthLabel(shift.scheduledStart) }}</span></div>
            <div class="shift-detail"><h3>{{ areaName(shift.workAreaId) }}</h3><p>{{ shiftTypeLabel(shift.type) }} · {{ timeRange(shift) }}</p></div>
            <span class="pill" :class="statusClass(shift.status)">{{ shiftStatusLabel(shift.status) }}</span>
          </div>
          <p v-if="upcomingShifts.length === 0" class="empty-state">No hay turnos próximos.</p>
        </div>
      </article>

      <article class="content-card">
        <div class="section-header"><div><h2>Historial de turnos</h2><p>Turnos completados recientemente.</p></div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Área</th><th>Tipo</th><th>Horas</th><th>Estado</th></tr></thead><tbody><tr v-for="shift in completedShifts.slice(0, 10)" :key="shift.id"><td>{{ dateLabel(shift.scheduledStart) }}</td><td>{{ areaName(shift.workAreaId) }}</td><td>{{ shiftTypeLabel(shift.type) }}</td><td>{{ duration(shift) }}h</td><td><span class="pill success">Completado</span></td></tr><tr v-if="completedShifts.length === 0"><td colspan="5"><p class="empty-state">No hay historial de turnos.</p></td></tr></tbody></table></div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource, patchResource } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const shifts = ref([]), workAreas = ref([])

onMounted(loadData)
async function loadData () { ;[shifts.value, workAreas.value] = await Promise.all([listResource('shiftRecords', { userId: authStore.user?.id }), listResource('workAreas')]) }

const sortedShifts = computed(() => [...shifts.value].sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart)))
const upcomingShifts = computed(() => sortedShifts.value.filter(s => ['SCHEDULED', 'IN_PROGRESS'].includes(s.status)))
const inProgressShifts = computed(() => sortedShifts.value.filter(s => s.status === 'IN_PROGRESS'))
const completedShifts = computed(() => [...sortedShifts.value].filter(s => s.status === 'COMPLETED').reverse())
const currentOrNextShift = computed(() => inProgressShifts.value[0] || upcomingShifts.value[0])
const completedHours = computed(() => completedShifts.value.reduce((sum, shift) => sum + duration(shift), 0))
const attendanceRate = computed(() => shifts.value.length ? Math.round(completedShifts.value.length / shifts.value.length * 100) : 0)

function areaName (id) { return workAreas.value.find(a => Number(a.id) === Number(id))?.name || '—' }
function statusClass (status) { return status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'info' : status === 'SCHEDULED' ? 'warning' : 'danger' }
function shiftStatusLabel (status) { return { SCHEDULED: 'Programado', IN_PROGRESS: 'En curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' }[status] || status }
function shiftTypeLabel (type) { return { DAY: 'Día', NIGHT: 'Noche', EMERGENCY: 'Emergencia' }[type] || type }
function dateLabel (value) { return value ? new Date(value).toLocaleDateString('es-PE') : '—' }
function dayNumber (value) { return value ? new Date(value).toLocaleDateString('es-PE', { day: '2-digit' }) : '—' }
function monthLabel (value) { return value ? new Date(value).toLocaleDateString('es-PE', { month: 'short' }) : '—' }
function timeLabel (value) { return value ? new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—' }
function timeRange (shift) { return `${timeLabel(shift.scheduledStart)} - ${timeLabel(shift.scheduledEnd)}` }
function duration (shift) { const start = new Date(shift.scheduledStart); const end = new Date(shift.scheduledEnd); return Math.max(0, Math.round((end - start) / 36e5)) }
async function checkIn (shift) { await patchResource('shiftRecords', shift.id, { status: 'IN_PROGRESS', checkInAt: new Date().toISOString() }); await loadData() }
async function checkOut (shift) { await patchResource('shiftRecords', shift.id, { status: 'COMPLETED', checkOutAt: new Date().toISOString() }); await loadData() }
</script>
