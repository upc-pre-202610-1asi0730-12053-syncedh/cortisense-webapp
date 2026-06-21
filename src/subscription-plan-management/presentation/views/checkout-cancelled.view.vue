<template>
    <section class="checkout-page">
        <main class="checkout-card">
            <div class="checkout-icon warning">
                <i class="pi pi-times"></i>
            </div>

            <header class="checkout-header">
                <h1>{{ $t('subscription.checkoutCancelled.title') }}</h1>
                <p>{{ $t('subscription.checkoutCancelled.subtitle') }}</p>
            </header>

            <Message v-if="errorKey" severity="error" :closable="false" class="checkout-message">
                {{ $t(errorKey) }}
            </Message>

            <Message v-else-if="cancelled" severity="warn" :closable="false" class="checkout-message">
                {{ $t('subscription.checkoutCancelled.cancelled') }}
            </Message>

            <div class="checkout-actions">
                <RouterLink class="checkout-button secondary" to="/sign-in">
                    {{ $t('subscription.checkoutCancelled.go-login') }}
                </RouterLink>

                <RouterLink class="checkout-button primary" :to="retryRoute">
                    {{ $t('subscription.checkoutCancelled.try-again') }}
                </RouterLink>
            </div>
        </main>
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Message from 'primevue/message'
import { subscriptionApi } from '../../infrastructure/subscription.api.js'

const route = useRoute()

const cancelled = ref(false)
const errorKey = ref(null)

const pendingCheckout = subscriptionApi.getPendingCheckout()

const retryRoute = computed(() => {
    const plan =
        route.query.plan ||
        pendingCheckout?.planCode ||
        'basic'

    return `/register-organization/${plan}`
})

onMounted(cancelLocalCheckout)

async function cancelLocalCheckout() {
    const queryCheckoutSessionId = route.query.checkoutSessionId
    const localCheckoutSessionId = Number(queryCheckoutSessionId || pendingCheckout?.checkoutSessionId)

    if (!localCheckoutSessionId || Number.isNaN(localCheckoutSessionId)) {
        cancelled.value = true
        subscriptionApi.clearPendingCheckout()
        return
    }

    try {
        const response = await subscriptionApi.cancelCheckoutSession(localCheckoutSessionId)
        cancelled.value = Boolean(response?.cancelled ?? true)
        subscriptionApi.clearPendingCheckout()
    } catch {
        errorKey.value = 'subscription.checkoutCancelled.error.cancel-failed'
    }
}
</script>

<style scoped>
.checkout-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
        radial-gradient(circle at top left, rgba(69, 221, 229, 0.18), transparent 30%),
        linear-gradient(135deg, #eefaff, #f8fbff);
}

.checkout-card {
    width: min(100%, 540px);
    padding: 42px;
    border-radius: 24px;
    background: #ffffff;
    border: 1px solid #dbe7ef;
    box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
    text-align: center;
}

.checkout-icon {
    width: 96px;
    height: 96px;
    margin: 0 auto 24px;
    border-radius: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.checkout-icon i {
    color: #ffffff;
    font-size: 2.35rem;
    font-weight: 900;
    line-height: 1;
}

.checkout-icon.warning {
    background: linear-gradient(135deg, #f59e0b, #f97316);
    box-shadow: 0 18px 40px rgba(245, 158, 11, 0.30);
}

.checkout-header h1 {
    margin: 0;
    color: #0fb7c2;
    font-size: 2.15rem;
    font-weight: 1000;
    letter-spacing: -0.05em;
}

.checkout-header p {
    margin: 14px 0 0;
    color: #64748b;
    line-height: 1.55;
}

.checkout-message {
    margin-top: 22px;
    text-align: left;
}

.checkout-actions {
    margin-top: 26px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.checkout-button {
    min-height: 54px;
    padding: 0 20px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-weight: 1000;
    transition: all 180ms ease;
}

.checkout-button.primary {
    color: #0d1b2a;
    background: #45dde5;
    box-shadow: 0 16px 30px rgba(69, 221, 229, 0.22);
}

.checkout-button.primary:hover {
    background: #95fffd;
    transform: translateY(-1px);
}

.checkout-button.secondary {
    color: #0d1b2a;
    border: 1px solid rgba(69, 221, 229, 0.55);
    background: rgba(149, 255, 253, 0.26);
}

.checkout-button.secondary:hover {
    background: rgba(149, 255, 253, 0.42);
}

@media (max-width: 560px) {
    .checkout-actions {
        grid-template-columns: 1fr;
    }
}
</style>