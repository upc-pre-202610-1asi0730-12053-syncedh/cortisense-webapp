/**
 * @file subscription.api.js
 * @description API de infraestructura para suscripciones y planes.
 */
import { http } from '../../shared/infrastructure/http.js'

const SUBS_PATH  = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH
const PLANS_PATH = import.meta.env.VITE_PLANS_ENDPOINT_PATH
const STAFF_PATH = import.meta.env.VITE_MEDICAL_STAFF_ENDPOINT_PATH
const DEVICES_PATH = import.meta.env.VITE_DEVICES_ENDPOINT_PATH

export const subscriptionApi = {
  getSubscription: () => http.get(SUBS_PATH).then(r => r.data?.[0] || null),
  getPlans: () => http.get(PLANS_PATH).then(r => r.data),
  getStaffCount: () => http.get(STAFF_PATH).then(r => r.data?.length || 0),
  getDevicesCount: () => http.get(DEVICES_PATH).then(r => r.data?.length || 0),
  changePlan: (subId, planId) => http.patch(`${SUBS_PATH}/${subId}`, { planId }).then(r => r.data)
}
