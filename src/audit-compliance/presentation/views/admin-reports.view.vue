<!--
  @file admin-reports.view.vue
  @description Reportes institucionales — generación, gráfico y tabla de historial.
  Usa audit.store.js
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('reports.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('reports.subtitle') }}</p>
    </div>

    <div class="cs-grid-2" style="margin-bottom:24px;">
      <!-- Generador de reporte -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="cs-card-header">
          <div class="cs-card-title">{{ $t('reports.generate') }}</div>
        </div>

        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('reports.type') }}</label>
          <select class="filter-select" v-model="form.type" style="width:100%;color:var(--text-primary);">
            <option value="fatigue">{{ $t('reports.types.fatigue') }}</option>
            <option value="anomaly">{{ $t('reports.types.anomaly') }}</option>
            <option value="compliance">{{ $t('reports.types.compliance') }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('reports.startDate') }}</label>
            <input type="date" class="filter-input" v-model="form.startDate" />
          </div>
          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('reports.endDate') }}</label>
            <input type="date" class="filter-input" v-model="form.endDate" />
          </div>
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('reports.areaOptional') }}</label>
          <select class="filter-select" v-model="form.area" style="width:100%;color:var(--text-primary);">
            <option value="">{{ $t('reports.allAreas') }}</option>
            <option value="Emergencia">{{ $t('areas.emergency') }}</option>
            <option value="UCI">{{ $t('areas.icu') }}</option>
            <option value="Pediatría">{{ $t('areas.pediatrics') }}</option>
            <option value="Cardiología">{{ $t('areas.cardiology') }}</option>
          </select>
        </div>

        <div style="display:flex;gap:10px;margin-top:8px;">
          <button class="cs-btn cs-btn-primary" style="flex:1;" @click="generateReport" :disabled="generating">
            <i class="pi pi-chart-bar"></i>
            {{ generating ? $t('reports.generating') : $t('reports.generate') }}
          </button>
          <button class="cs-btn cs-btn-secondary" @click="downloadPDF" :disabled="!lastReport">
            <i class="pi pi-file-pdf"></i> PDF
          </button>
        </div>

        <div v-if="lastReport" class="report-generated-banner">
          <i class="pi pi-check-circle"></i>
          {{ $t('common.generated') }}: <strong>{{ reportTypeLabel(lastReport.type) }}</strong>
          — {{ formatDate(lastReport.generatedAt) }}
        </div>
      </div>

      <!-- Gráfico de incidentes -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="cs-card-header">
          <div>
            <div class="cs-card-title">{{ $t('reports.fatigueIncidentsByArea') }}</div>
            <div class="cs-card-subtitle">{{ $t('reports.last30Days') }}</div>
          </div>
        </div>
        <div style="height:220px;position:relative;">
          <canvas id="reportsChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Historial de reportes -->
    <div class="cs-card" style="margin-bottom:0;">
      <div class="cs-card-header">
        <div class="cs-card-title">{{ $t('reports.recentReports') }}</div>
      </div>
      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr><th>{{ $t('reports.type') }}</th><th>{{ $t('reports.period') }}</th><th>{{ $t('reports.area') }}</th><th>{{ $t('reports.generatedAt') }}</th><th>{{ $t('reports.generatedBy') }}</th><th>{{ $t('reports.actions') }}</th></tr>
          </thead>
          <tbody>
            <tr v-if="store.loading"><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td></tr>
            <tr v-else-if="store.reports.length === 0"><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('reports.noReports') }}</td></tr>
            <tr v-for="r in store.reports" :key="r.id">
              <td><span class="cs-badge cs-badge-info">{{ reportTypeLabel(r.type) }}</span></td>
              <td style="font-size:12px;">{{ r.startDate ? `${r.startDate} — ${r.endDate}` : '—' }}</td>
              <td style="font-size:12px;">{{ r.area ? areaLabel(r.area) : $t('reports.allAreas') }}</td>
              <td style="font-size:12px;white-space:nowrap;">{{ formatDate(r.generatedAt) }}</td>
              <td style="font-size:12px;color:var(--text-muted);">{{ r.generatedBy || 'admin@cortisense.com' }}</td>
              <td>
                <button class="btn-link btn-link-view" @click="downloadPDF(r)">
                  <i class="pi pi-download"></i> PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useAuditStore } from '../../application/audit.store.js'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { useI18n } from 'vue-i18n'

Chart.register(...registerables)

const store     = useAuditStore()
const authStore = useAuthStore()
const { t, locale } = useI18n({ useScope: 'global' })

const generating = ref(false)
const lastReport = ref(null)
let reportsChart = null
const form = reactive({ type: 'fatigue', startDate: '', endDate: '', area: '' })

const reportTypeLabel = (key) => key ? t(`reports.types.${key}`) : '—'
const areaKey = (area = '') => ({ 'Emergencia': 'emergency', 'UCI': 'icu', 'Pediatría': 'pediatrics', 'Cardiología': 'cardiology', 'General': 'general' }[area] || '')
const areaLabel = (area) => areaKey(area) ? t(`areas.${areaKey(area)}`) : area

function formatDate (iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
}

async function generateReport () {
  generating.value = true
  try {
    const report = await store.generateReport({
      ...form,
      generatedBy: authStore._userResource?.email || 'admin@cortisense.com'
    })
    lastReport.value = report
  } finally { generating.value = false }
}

function downloadPDF (report) {
  alert(t('reports.downloadPdfMessage', { type: reportTypeLabel(report?.type || form.type) }))
}

onMounted(async () => {
  await store.fetchReports()

  const ctx = document.getElementById('reportsChart')?.getContext('2d')
  if (ctx) {
    reportsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [t('areas.emergency'), t('areas.icu'), t('areas.pediatrics'), t('areas.cardiology'), t('areas.general')],
        datasets: [{
          label: t('reports.chartDataset'),
          data: [8, 5, 3, 6, 2],
          backgroundColor: ['#EF4444','#F97316','#F59E0B','#45DDE5','#10B981'],
          borderRadius: 6, borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 }, color: '#94A3B8' } },
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94A3B8' } }
        }
      }
    })
  }
})

onBeforeUnmount(() => {
  reportsChart?.destroy()
})
</script>

<style scoped>
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.report-generated-banner {
  display: flex; align-items: center; gap: 8px;
  background: #F0FDF4; color: #15803D; border: 1px solid #A7F3D0;
  border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-top: 12px;
}
</style>
