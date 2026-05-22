/**
 * @file clinical-risk.api.js
 * @description API de infraestructura para clinical-risk.
 */
import { http } from '../../shared/infrastructure/http.js'

const STAFF_PATH = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH
const BIO_PATH   = import.meta.env.VITE_BIOMETRIC_RECORDS_ENDPOINT_PATH

export const clinicalRiskApi = {
  getStaff:        () => http.get(STAFF_PATH).then(r => r.data),
  patchStaff:      (id, patch) => http.patch(`${STAFF_PATH}/${id}`, patch).then(r => r.data),
  getBiometrics:   () => http.get(BIO_PATH).then(r => r.data),
  getBiometricsByStaff: (staffId) =>
    http.get(`${BIO_PATH}?medicalStaffId=${staffId}`).then(r => r.data)
}
