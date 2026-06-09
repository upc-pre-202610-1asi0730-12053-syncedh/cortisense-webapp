<template>
  <section>
    <header class="page-header">
      <h1>Mis signos vitales</h1>
      <p>Visualiza tus <strong>tendencias biométricas</strong> de los últimos registros.</p>
    </header>

    <section class="charts-grid">
      <article class="content-card chart-card">
        <div class="chart-header">
          <h2>Cortisol — 7 días</h2>
          <span>nmol/L · Umbral: 550 nmol/L</span>
        </div>
        <div class="svg-chart-wrapper">
          <svg viewBox="0 0 560 300" role="img" aria-label="Gráfico de cortisol">
            <g v-for="tick in yTicks('cortisolLevel')" :key="`c-y-${tick.value}`">
              <text x="28" :y="tick.y + 4" class="chart-axis-label">{{ tick.value }}</text>
              <line x1="70" x2="520" :y1="tick.y" :y2="tick.y" class="chart-grid-line" />
            </g>
            <line :x1="70" :x2="520" :y1="thresholdY('cortisolLevel')" :y2="thresholdY('cortisolLevel')" class="threshold-line" />
            <polyline :points="linePoints('cortisolLevel')" class="chart-line cyan-line" />
            <g v-for="point in pointObjects('cortisolLevel')" :key="`cortisol-${point.x}-${point.y}`">
              <circle :cx="point.x" :cy="point.y" r="5" class="chart-dot" />
              <title>{{ dayLabel(point.item.recordedAt) }} · Cortisol: {{ point.item.cortisolLevel }} nmol/L</title>
            </g>
            <text v-for="point in pointObjects('cortisolLevel')" :key="`c-label-${point.x}`" :x="point.x" y="270" class="chart-x-label">{{ dayLabel(point.item.recordedAt) }}</text>
          </svg>
        </div>
      </article>

      <article class="content-card chart-card">
        <div class="chart-header">
          <h2>HRV — 7 días</h2>
          <span>ms · Umbral mínimo: 25 ms</span>
        </div>
        <div class="svg-chart-wrapper">
          <svg viewBox="0 0 560 300" role="img" aria-label="Gráfico de HRV">
            <g v-for="tick in yTicks('hrv')" :key="`h-y-${tick.value}`">
              <text x="28" :y="tick.y + 4" class="chart-axis-label">{{ tick.value }}</text>
              <line x1="70" x2="520" :y1="tick.y" :y2="tick.y" class="chart-grid-line" />
            </g>
            <line :x1="70" :x2="520" :y1="thresholdY('hrv')" :y2="thresholdY('hrv')" class="threshold-line" />
            <polyline :points="linePoints('hrv')" class="chart-line purple-line" />
            <g v-for="point in pointObjects('hrv')" :key="`hrv-${point.x}-${point.y}`">
              <circle :cx="point.x" :cy="point.y" r="5" class="chart-dot purple-dot" />
              <title>{{ dayLabel(point.item.recordedAt) }} · HRV: {{ point.item.hrv }} ms</title>
            </g>
            <text v-for="point in pointObjects('hrv')" :key="`h-label-${point.x}`" :x="point.x" y="270" class="chart-x-label">{{ dayLabel(point.item.recordedAt) }}</text>
          </svg>
        </div>
      </article>
    </section>

    <article class="content-card bar-chart-card">
      <div class="chart-header"><h2>Frecuencia cardíaca promedio — 7 días</h2><span>bpm por turno</span></div>
      <div class="bar-chart">
        <div v-for="reading in chartReadings" :key="`hr-${reading.id}`" class="bar-item">
          <div class="bar-value">{{ reading.heartRate }}</div>
          <div class="bar-track"><div class="bar-fill" :style="{ height: `${heartRateHeight(reading.heartRate)}%` }"></div></div>
          <small>{{ dayLabel(reading.recordedAt) }}</small>
        </div>
      </div>
    </article>

    <article class="content-card records-card">
      <div class="records-header">
        <div><h2>Historial de lecturas</h2><p>Lecturas biométricas asociadas a tus turnos.</p></div>
        <span class="period-pill">Últimos 7 días</span>
      </div>
      <div class="table-wrap">
        <table class="data-table records-table">
          <thead><tr><th>Fecha</th><th>Turno</th><th>Cortisol</th><th>HRV</th><th>Frecuencia</th><th>Fatiga</th><th>Estado</th></tr></thead>
          <tbody>
            <tr v-for="reading in tableReadings" :key="reading.id">
              <td>{{ formatDate(reading.recordedAt) }}</td>
              <td>{{ shiftLabel(reading.recordedAt) }}</td>
              <td><strong :class="{ 'alert-value': reading.cortisolLevel >= 550 }">{{ reading.cortisolLevel }} nmol/L</strong></td>
              <td><strong :class="{ 'alert-value': reading.hrv < 25 }">{{ reading.hrv }} ms</strong></td>
              <td><strong :class="{ 'alert-value': reading.heartRate >= 105 }">{{ reading.heartRate }} bpm</strong></td>
              <td><div class="fatigue-cell"><div class="fatigue-track"><div class="fatigue-fill" :class="fatigueRiskClass(reading.fatigueLevel)" :style="{ width: `${reading.fatigueLevel}%` }"></div></div><span>{{ reading.fatigueLevel }}%</span></div></td>
              <td><span class="risk-pill" :class="fatigueRiskClass(reading.fatigueLevel)">{{ fatigueRiskLabel(reading.fatigueLevel) }}</span></td>
            </tr>
            <tr v-if="tableReadings.length === 0"><td colspan="7"><p class="empty-state">No hay lecturas biométricas registradas.</p></td></tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const { t, locale } = useI18n()
const readings = ref([])
const chartConfig = {
  cortisolLevel: { min: 300, max: 700, ticks: [650, 550, 450, 350], threshold: 550 },
  hrv: { min: 10, max: 50, ticks: [45, 35, 25, 15], threshold: 25 }
}

onMounted(loadData)
async function loadData () {
  readings.value = (await listResource('vitalSignReadings', { userId: authStore.user?.id })).sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
}

const chartReadings = computed(() => readings.value.slice(-7))
const tableReadings = computed(() => [...readings.value].reverse().slice(0, 14))

function currentLocale () { return locale.value === 'en' ? 'en-US' : 'es-PE' }
function yPosition (field, value) {
  const cfg = chartConfig[field]
  const ratio = (Number(value || 0) - cfg.min) / Math.max(1, cfg.max - cfg.min)
  return 240 - Math.max(0, Math.min(1, ratio)) * 190
}
function xPosition (index, total) { return total === 1 ? 295 : 70 + (index * 450 / (total - 1)) }
function yTicks (field) { return chartConfig[field].ticks.map(value => ({ value, y: yPosition(field, value) })) }
function thresholdY (field) { return yPosition(field, chartConfig[field].threshold) }
function pointObjects (field) {
  const items = chartReadings.value
  return items.map((item, index) => ({ item, x: xPosition(index, items.length), y: yPosition(field, item[field]) }))
}
function linePoints (field) { return pointObjects(field).map(point => `${point.x},${point.y}`).join(' ') }
function heartRateHeight (value) { return Math.max(12, Math.min(100, ((Number(value) - 50) / 80) * 100)) }
function dayLabel (value) { return value ? new Date(value).toLocaleDateString(currentLocale(), { weekday: 'short', day: '2-digit' }) : '—' }
function formatDate (value) { return value ? new Date(value).toLocaleDateString(currentLocale()) : '—' }
function shiftLabel (value) { const hour = value ? new Date(value).getHours() : 8; return hour >= 19 || hour < 7 ? t('shift.types.night') : t('shift.types.day') }
function fatigueRiskClass (value) { const n = Number(value || 0); if (n >= 80) return 'danger'; if (n >= 60) return 'warning'; if (n >= 40) return 'info'; return 'success' }
function fatigueRiskLabel (value) { const n = Number(value || 0); if (n >= 80) return t('clinical.labels.critical'); if (n >= 60) return t('clinical.labels.high'); if (n >= 40) return t('clinical.labels.moderate'); return t('clinical.labels.low') }
</script>
