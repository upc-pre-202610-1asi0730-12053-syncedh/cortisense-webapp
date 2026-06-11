<template>
  <AuthLayout>
    <main class="auth-card" style="width:min(100%,760px)">
      <div class="card-header"><h2>{{ $t('pages.registerOrg.title') }}</h2><p>{{ selectedPlan?.name }} · {{ $t('pages.registerOrg.subtitle') }}</p></div>
      <form @submit.prevent="submit">
        <div class="form-grid">
          <div class="field"><label>Organization</label><input v-model.trim="form.name" class="input"></div>
          <div class="field"><label>RUC</label><input v-model.trim="form.ruc" class="input"></div>
          <div class="field"><label>Address</label><input v-model.trim="form.address" class="input"></div>
          <div class="field"><label>Phone</label><input v-model.trim="form.phone" class="input"></div>
          <div class="field"><label>{{ $t('auth.first-name') }}</label><input v-model.trim="admin.firstName" class="input"></div>
          <div class="field"><label>{{ $t('auth.last-name') }}</label><input v-model.trim="admin.lastName" class="input"></div>
          <div class="field"><label>{{ $t('common.email') }}</label><input v-model.trim="admin.email" class="input" type="email"></div>
          <div class="field"><label>{{ $t('auth.password') }}</label><input v-model="admin.password" class="input" type="password"></div>
        </div>
        <div class="form-actions"><RouterLink class="btn ghost" to="/onboarding/basic">{{ $t('common.cancel') }}</RouterLink><button class="btn primary" type="submit">{{ $t('common.save') }}</button></div>
      </form>
    </main>
  </AuthLayout>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'
import { createResource, listResource } from '../../../shared/infrastructure/api.service.js'
const route = useRoute(); const router = useRouter(); const plans = ref([])
const form = reactive({ name: '', ruc: '', address: '', phone: '', status: 'ACTIVE' })
const admin = reactive({ firstName: '', lastName: '', email: '', password: '' })
const selectedPlan = computed(() => plans.value.find(item => item.code === route.params.planCode))
onMounted(async () => { plans.value = await listResource('plans') })
async function submit () {
  const organization = await createResource('organizations', { ...form, planId: selectedPlan.value?.id || 1 })
  const user = await createResource('users', { organizationId: organization.id, ...admin, role: 'HOSPITAL_ADMIN', status: 'ACTIVE' })
  const subscription = await createResource('subscriptions', { organizationId: organization.id, planId: selectedPlan.value?.id || 1, status: 'ACTIVE', startedAt: new Date().toISOString() })
  await createResource('checkoutSessions', { organizationId: organization.id, administratorId: user.id, subscriptionId: subscription.id, planId: selectedPlan.value?.id || 1, planCode: selectedPlan.value?.code || route.params.planCode, status: 'COMPLETED', createdAt: new Date().toISOString() })
  router.push('/checkout/success')
}
</script>
