<template>
    <AuthLayout>
        <main class="auth-card">
            <div class="card-header">
                <h2>{{ $t('subscription.checkoutCancelled.title') }}</h2>
                <p>{{ $t('subscription.checkoutCancelled.subtitle') }}</p>
            </div>

            <Message v-if="errorKey" severity="error" :closable="false">
                {{ $t(errorKey) }}
            </Message>

            <Message v-else-if="cancelled" severity="warn" :closable="false">
                {{ $t('subscription.checkoutCancelled.cancelled') }}
            </Message>

            <div class="form-actions">
                <RouterLink class="btn ghost" to="/sign-in">
                    {{ $t('subscription.checkoutCancelled.go-login') }}
                </RouterLink>

                <RouterLink class="btn primary" :to="retryRoute">
                    {{ $t('subscription.checkoutCancelled.try-again') }}
                </RouterLink>
            </div>
        </main>
    </AuthLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Message from 'primevue/message'
import AuthLayout from '../../../shared/presentation/components/auth-layout.vue'
import { subscriptionApi } from '../../infrastructure/subscription.api.js'

const route = useRoute()

const cancelled = ref(false)
const errorKey = ref(null)

const retryRoute = computed(() => {
    const plan = route.query.plan || 'basic'
    return `/register-organization/${plan}`
})

onMounted(async () => {
    const checkoutSessionId = route.query.checkoutSessionId

    if (!checkoutSessionId) return

    try {
        const response = await subscriptionApi.cancelCheckoutSession(Number(checkoutSessionId))
        cancelled.value = Boolean(response?.cancelled)
    } catch {
        errorKey.value = 'subscription.checkoutCancelled.error.cancel-failed'
    }
})
</script>