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

        <div class="prime-chart-wrapper">
          <Chart
              type="line"
              :data="cortisolChartData"
              :options="lineChartOptions"
              class="vital-chart"
          />
        </div>
      </article>

      <article class="content-card chart-card">
        <div class="chart-header">
          <h2>HRV — 7 días</h2>
          <span>ms · Umbral mínimo: 25 ms</span>
        </div>

        <div class="prime-chart-wrapper">
          <Chart
              type="line"
              :data="hrvChartData"
              :options="lineChartOptions"
              class="vital-chart"
          />
        </div>
      </article>
    </section>

    <article class="content-card bar-chart-card">
      <div class="chart-header">
        <h2>Frecuencia cardíaca promedio — 7 días</h2>
        <span>bpm por turno</span>
      </div>

      <div class="prime-chart-wrapper">
        <Chart
            type="bar"
            :data="heartRateChartData"
            :options="barChartOptions"
            class="vital-chart"
        />
      </div>
    </article>

    <article class="content-card records-card">
      <div class="records-header">
        <div>
          <h2>Historial de lecturas</h2>
          <p>Lecturas biométricas asociadas a tus turnos.</p>
        </div>
        <span class="period-pill">Últimos 7 días</span>
      </div>

      <div class="table-wrap">
        <table class="data-table records-table">
          <thead>
          <tr>
            <th>Fecha</th>
            <th>Turno</th>
            <th>Cortisol</th>
            <th>HRV</th>
            <th>Frecuencia</th>
            <th>Fatiga</th>
            <th>Estado</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="reading in tableReadings" :key="reading.id">
            <td>{{ formatDate(reading.recordedAt) }}</td>
            <td>{{ shiftLabel(reading.recordedAt) }}</td>

            <td>
              <strong :class="{ 'alert-value': reading.cortisolLevel >= 550 }">
                {{ reading.cortisolLevel }} nmol/L
              </strong>
            </td>

            <td>
              <strong :class="{ 'alert-value': reading.hrv < 25 }">
                {{ reading.hrv }} ms
              </strong>
            </td>

            <td>
              <strong :class="{ 'alert-value': reading.heartRate >= 105 }">
                {{ reading.heartRate }} bpm
              </strong>
            </td>

            <td>
              <div class="fatigue-cell">
                <div class="fatigue-track">
                  <div
                      class="fatigue-fill"
                      :class="fatigueRiskClass(reading.fatigueLevel)"
                      :style="{ width: `${reading.fatigueLevel}%` }"
                  ></div>
                </div>
                <span>{{ reading.fatigueLevel }}%</span>
              </div>
            </td>

            <td>
                <span class="risk-pill" :class="fatigueRiskClass(reading.fatigueLevel)">
                  {{ fatigueRiskLabel(reading.fatigueLevel) }}
                </span>
            </td>
          </tr>

          <tr v-if="tableReadings.length === 0">
            <td colspan="7">
              <p class="empty-state">No hay lecturas biométricas registradas.</p>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from 'primevue/chart'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { listResource } from '../../../shared/infrastructure/api.service.js'

const authStore = useAuthStore()
const { t, locale } = useI18n()

const readings = ref([])

onMounted(loadData)

async function loadData () {
  const response = await listResource('vitalSignReadings')

  readings.value = response
      .filter(reading =>
          Number(reading.organizationId) === Number(authStore.user?.organizationId) &&
          Number(reading.userId) === Number(authStore.user?.id)
      )
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
}

const chartReadings = computed(() => readings.value.slice(-7))
const tableReadings = computed(() => [...readings.value].reverse().slice(0, 14))

const cortisolChartData = computed(() => ({
  labels: chartReadings.value.map(reading => dayLabel(reading.recordedAt)),
  datasets: [
    {
      label: 'Cortisol',
      data: chartReadings.value.map(reading => Number(reading.cortisolLevel || 0)),
      tension: 0.4,
      fill: false,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
}))

const hrvChartData = computed(() => ({
  labels: chartReadings.value.map(reading => dayLabel(reading.recordedAt)),
  datasets: [
    {
      label: 'HRV',
      data: chartReadings.value.map(reading => Number(reading.hrv || 0)),
      tension: 0.4,
      fill: false,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
}))

const heartRateChartData = computed(() => ({
  labels: chartReadings.value.map(reading => dayLabel(reading.recordedAt)),
  datasets: [
    {
      label: 'Frecuencia cardíaca',
      data: chartReadings.value.map(reading => Number(reading.heartRate || 0))
    }
  ]
}))

const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    },
    tooltip: {
      enabled: true
    }
  },
  interaction: {
    mode: 'nearest',
    intersect: true
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        minRotation: 0
      }
    },
    y: {
      beginAtZero: false
    }
  }
}))

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    },
    tooltip: {
      enabled: true
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        minRotation: 0
      }
    },
    y: {
      beginAtZero: false
    }
  }
}))

function currentLocale () {
  return locale.value === 'en' ? 'en-US' : 'es-PE'
}

function dayLabel (value) {
  return value
      ? new Date(value).toLocaleDateString(currentLocale(), {
        weekday: 'short',
        day: '2-digit'
      })
      : '—'
}

function formatDate (value) {
  return value
      ? new Date(value).toLocaleDateString(currentLocale())
      : '—'
}

function shiftLabel (value) {
  const hour = value ? new Date(value).getHours() : 8

  return hour >= 19 || hour < 7
      ? t('shift.types.night')
      : t('shift.types.day')
}

function fatigueRiskClass (value) {
  const n = Number(value || 0)

  if (n >= 80) return 'danger'
  if (n >= 60) return 'warning'
  if (n >= 40) return 'info'

  return 'success'
}

function fatigueRiskLabel (value) {
  const n = Number(value || 0)

  if (n >= 80) return t('clinical.labels.critical')
  if (n >= 60) return t('clinical.labels.high')
  if (n >= 40) return t('clinical.labels.moderate')

  return t('clinical.labels.low')
}
</script>

<style scoped>
.prime-chart-wrapper {
  width: 100%;
  height: 300px;
}

.vital-chart {
  width: 100%;
  height: 100%;
}
</style>