import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subscriptionApi } from '../infrastructure/subscription.api.js'

export const useSubscriptionStore = defineStore('subscriptionPlanManagement', () => {
  const plans = ref([])
  const subscriptions = ref([])
  const sessions = ref([])
  async function loadAll () {
    const [planList, subscriptionList, sessionList] = await Promise.all([subscriptionApi.plans(), subscriptionApi.subscriptions(), subscriptionApi.checkoutSessions()])
    plans.value = planList
    subscriptions.value = subscriptionList
    sessions.value = sessionList
  }
  return { plans, subscriptions, sessions, loadAll }
})
