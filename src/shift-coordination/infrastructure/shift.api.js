/**
 * @file shift.api.js + shift.assembler.js + shift.store.js
 * @description Infraestructura y store para shift-coordination.
 */
import { http } from '../../shared/infrastructure/http.js'
import { Shift } from '../domain/model/shift.entity.js'

const SHIFTS_PATH = import.meta.env.VITE_SHIFTS_ENDPOINT_PATH

export const shiftApi = {
  getByStaff: (staffId) =>
    http.get(`${SHIFTS_PATH}?medicalStaffId=${staffId}`).then(r => r.data),
  getAll: () => http.get(SHIFTS_PATH).then(r => r.data)
}

export const ShiftAssembler = {
  toEntity: (r) => new Shift(r)
}
