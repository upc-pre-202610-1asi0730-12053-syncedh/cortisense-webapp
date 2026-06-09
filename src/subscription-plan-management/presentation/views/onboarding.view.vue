<template>
  <AuthLayout>
    <main style="width:min(100%,1080px)">
      <header class="page-header"><h1>{{ $t('pages.onboarding.title') }}</h1><p>{{ $t('pages.onboarding.subtitle') }}</p></header>
      <section class="plan-grid">
        <article v-for="plan in plans" :key="plan.id" class="plan-card" :class="{ recommended: plan.recommended }">
          <span v-if="plan.recommended" class="pill success">Recommended</span>
          <h2>{{ plan.name }}</h2>
          <div class="plan-price">{{ plan.currency }} {{ plan.price }}</div>
          <p>{{ $t(plan.descriptionKey) }}</p>
          <ul class="plan-features">
            <li>{{ plan.maxDoctors }} doctors</li>
            <li>{{ plan.maxSupervisors }} supervisors</li>
            <li>{{ plan.maxTeams }} teams</li>
            <li>{{ plan.monthlyInvitations }} invitations/month</li>
          </ul>
          <RouterLink class="btn primary" :to="`/register-organization/${plan.code}`">{{ $t('common.create') }}</RouterLink>
        </article>
      </section>
    </main>
  </AuthLayout>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'
import { listResource } from '../../../shared/infrastructure/api.service.js'
const plans = ref([])
onMounted(async () => { plans.value = await listResource('plans') })
</script>
