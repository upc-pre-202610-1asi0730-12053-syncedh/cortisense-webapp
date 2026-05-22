<!--
  @file medical-staff-vitals.view.vue
  @description Mis Signos Vitales — historial de registros biométricos del personal médico.
  Bounded context: clinical-risk
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('vitals.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('vitals.subtitle') }}</p>
    </div>

    <div class="cs-kpi-grid">
      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">💓</div>
        <div class="cs-kpi-label">{{ $t('vitals.heartRate') }}</div>
        <div class="cs-kpi-value">{{ latestRecord?.heartRate ?? '—' }}</div>
        <div class="cs-kpi-sub">bpm</div>
      </div>

      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">❤️</div>
        <div class="cs-kpi-label">{{ $t('vitals.hrv') }}</div>
        <div class="cs-kpi-value" :style="{ color: latestRecord?.hrv < 30 ? '#EF4444' : '#10B981' }">
          {{ latestRecord?.hrv ?? '—' }}
        </div>
        <div class="cs-kpi-sub">ms</div>
      </div>

      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">🧪</div>
        <div class="cs-kpi-label">{{ $t('vitals.cortisol') }}</div>
        <div class="cs-kpi-value primary">{{ recordValue(latestRecord, 'cortisol', 'cortisolLevel') }}</div>
        <div class="cs-kpi-sub">nmol/L</div>
      </div>

      <div class="cs-kpi-card">
        <div class="cs-kpi-icon">😴</div>
        <div class="cs-kpi-label">{{ $t('vitals.sleep') }}</div>
        <div class="cs-kpi-value">{{ latestRecord?.sleepHours ?? '—' }}</div>
        <div class="cs-kpi-sub">{{ $t('vitals.hours') }}</div>
      </div>
    </div>

    <div class="cs-card" style="margin-bottom:0;">
      <div class="cs-card-header">
        <div class="cs-card-title">{{ $t('vitals.recordsHistory') }}</div>
      </div>

      <div class="cs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ $t('vitals.recordedAt') }}</th>
              <th>{{ $t('vitals.heartRate') }}</th>
              <th>{{ $t('vitals.hrv') }}</th>
              <th>{{ $t('vitals.cortisol') }}</th>
              <th>{{ $t('vitals.sleep') }}</th>
              <th>{{ $t('vitals.stress') }}</th>
              <th>{{ $t('vitals.fatigue') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('common.loading') }}</td>
            </tr>

            <tr v-else-if="records.length === 0">
              <td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">{{ $t('vitals.noRecordsHint') }}</td>
            </tr>

            <tr v-for="record in records" :key="record.id">
              <td style="font-size:12px;white-space:nowrap;">{{ formatDate(record.recordedAt) }}</td>

              <td :style="{ color: record.heartRate > 100 ? '#EF4444' : 'inherit', fontWeight: record.heartRate > 100 ? 700 : 400 }">
                {{ record.heartRate ?? '—' }} bpm
              </td>

              <td :style="{ color: record.hrv < 30 ? '#EF4444' : '#10B981', fontWeight: 600 }">
                {{ record.hrv ?? '—' }} ms
              </td>

              <td :style="{ color: recordValue(record, 'cortisol', 'cortisolLevel') > 600 ? '#EF4444' : 'inherit' }">
                {{ recordValue(record, 'cortisol', 'cortisolLevel') }} nmol/L
              </td>

              <td :style="{ color: record.sleepHours < 6 ? '#F59E0B' : 'inherit' }">
                {{ record.sleepHours ?? '—' }} h
              </td>

              <td>{{ record.stressLevel ?? '—' }}</td>

              <td>
                <div class="fatigue-bar-wrap">
                  <div class="fatigue-bar">
                    <div
                      class="fatigue-bar-fill"
                      :class="fatigueClass(recordFatigue(record))"
                      :style="{ width: recordFatigue(record) + '%' }"
                    ></div>
                  </div>
                  <span class="fatigue-label">{{ recordFatigue(record) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'
import { http } from '../../../shared/infrastructure/http.js'

const { locale } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const records = ref([])
const loading = ref(true)

const latestRecord = computed(() => records.value.at(0) || null)

function recordValue (record, primaryKey, fallbackKey) {
  if (!record) return '—'
  return record[primaryKey] ?? record[fallbackKey] ?? '—'
}

function recordFatigue (record) {
  return record?.fatigueLevel ?? record?.fatigueScore ?? 0
}

function fatigueClass (fatigue) {
  if (fatigue >= 80) return 'critical'
  if (fatigue >= 60) return 'high'
  if (fatigue >= 40) return 'medium'
  return 'low'
}

function formatDate (isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

onMounted(async () => {
  try {
    const staffResponse = await http.get(import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH)
    const currentUserId = authStore._userResource?.id
    const currentStaffId = authStore._userResource?.medicalStaffId
    const staffProfile = staffResponse.data.find(staff => staff.id === currentStaffId || staff.userId === currentUserId) || null

    if (!staffProfile?.id) return

    const biometricsResponse = await http.get(`${import.meta.env.VITE_BIOMETRIC_RECORDS_ENDPOINT_PATH}?medicalStaffId=${staffProfile.id}`)
    records.value = biometricsResponse.data.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
  } finally {
    loading.value = false
  }
})
</script>
