<template>
    <AuthLayout>
        <main class="auth-card">
            <div class="card-header">
                <h2>{{ $t('subscription.checkoutSuccess.title') }}</h2>
                <p>{{ $t(subtitleKey) }}</p>
            </div>

            <Message v-if="errorKey" severity="error" :closable="false">
                {{ $t(errorKey) }}
            </Message>

            <Message v-else-if="loading" severity="info" :closable="false">
                {{ $t('subscription.checkoutSuccess.validating') }}
            </Message>

            <Message v-else-if="activated" severity="success" :closable="false">
                {{ $t('subscription.checkoutSuccess.activated') }}
            </Message>

            <RouterLink class="btn primary" to="/sign-in">
                {{ $t('subscription.checkoutSuccess.go-login') }}
            </RouterLink>
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

const loading = ref(true)
const activated = ref(false)
const errorKey = ref(null)

const subtitleKey = computed(() => {
    if (errorKey.value) return 'subscription.checkoutSuccess.error-subtitle'
    if (loading.value) return 'subscription.checkoutSuccess.loading-subtitle'
    return 'subscription.checkoutSuccess.subtitle'
})

onMounted(async () => {
    const sessionId = route.query.session_id

    if (!sessionId) {
        errorKey.value = 'subscription.checkoutSuccess.error.session-missing'
        loading.value = false
        return
    }

    try {
        const status = await subscriptionApi.getCheckoutSessionStatus(String(sessionId))
        activated.value = Boolean(status?.activated)
    } catch {
        errorKey.value = 'subscription.checkoutSuccess.error.validation-failed'
    } finally {
        loading.value = false
    }
})
</script>