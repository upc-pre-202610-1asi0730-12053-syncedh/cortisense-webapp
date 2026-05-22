/**
 * @file shift.store.js
 * @description Store de Pinia para shift-coordination.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { shiftApi, ShiftAssembler } from '../infrastructure/shift.api.js'

export const useShiftStore = defineStore('shift', () => {
  const shifts  = ref([])
  const loading = ref(false)

  const nightShifts  = computed(() => shifts.value.filter(s => s.type === 'night'))
  const totalHours   = computed(() => shifts.value.reduce((sum, s) => sum + (s.hoursWorked || 0), 0))

  async function fetchMyShifts (staffId) {
    loading.value = true
    try {
      const raw = await shiftApi.getByStaff(staffId)
      shifts.value = raw.map(r => ShiftAssembler.toEntity(r).toResource())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    } finally { loading.value = false }
  }

  return { shifts, loading, nightShifts, totalHours, fetchMyShifts }
})
