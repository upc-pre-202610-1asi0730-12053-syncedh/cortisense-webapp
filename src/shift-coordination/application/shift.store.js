import { defineStore } from 'pinia'
import { ref } from 'vue'
import { shiftApi } from '../infrastructure/shift.api.js'
export const useShiftStore = defineStore('shiftCoordination', () => {
  const teams = ref([]), members = ref([]), shifts = ref([])
  async function loadAll () { [teams.value, members.value, shifts.value] = await Promise.all([shiftApi.teams(), shiftApi.members(), shiftApi.shifts()]) }
  return { teams, members, shifts, loadAll }
})
