/**
 * @file subscription.store.js
 * @description Store de Pinia para suscripciones y planes.
 * Bounded context: subscriptions
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subscriptionApi } from '../infrastructure/subscription.api.js'
import { SubscriptionAssembler } from '../infrastructure/subscription.assembler.js'

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscription  = ref(null)
  const plans         = ref([])
  const staffCount    = ref(0)
  const devicesCount  = ref(0)
  const loading       = ref(false)

  /**
   * Carga la suscripción activa, planes disponibles y contadores de recursos.
   */
  async function fetchAll () {
    loading.value = true
    try {
      const [sub, plansRaw, staff, devices] = await Promise.all([
        subscriptionApi.getSubscription(),
        subscriptionApi.getPlans(),
        subscriptionApi.getStaffCount(),
        subscriptionApi.getDevicesCount()
      ])
      if (sub) {
        const entity = SubscriptionAssembler.toSubscriptionEntity({ ...sub, staffUsed: staff })
        subscription.value = {
          ...entity.toResource(),
          usagePercent: entity.usagePercent
        }
      } else {
        subscription.value = null
      }
      plans.value = plansRaw.map(p => SubscriptionAssembler.toPlanEntity(p).toResource())
      staffCount.value   = staff
      devicesCount.value = devices
    } finally { loading.value = false }
  }

  /**
   * Cambia el plan de suscripción.
   * @param {string} planId
   */
  async function changePlan (planId) {
    if (!subscription.value) return
    await subscriptionApi.changePlan(subscription.value.id, planId)
    await fetchAll()
  }

  return { subscription, plans, staffCount, devicesCount, loading, fetchAll, changePlan }
})
