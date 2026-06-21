<template>
    <section class="checkout-page">
        <main class="checkout-card">
            <div class="checkout-icon success">
                <i class="pi pi-check"></i>
            </div>

            <header class="checkout-header">
                <h1>{{ $t('subscription.checkoutSuccess.title') }}</h1>
                <p>{{ $t(subtitleKey) }}</p>
            </header>

            <Message v-if="errorKey" severity="error" :closable="false" class="checkout-message">
                {{ $t(errorKey) }}
            </Message>

            <Message v-else-if="loading" severity="info" :closable="false" class="checkout-message">
                {{ $t('subscription.checkoutSuccess.validating') }}
            </Message>

            <Message v-else-if="activated" severity="success" :closable="false" class="checkout-message">
                {{ $t('subscription.checkoutSuccess.activated') }}
            </Message>

            <RouterLink class="checkout-button primary" to="/sign-in">
                {{ $t('subscription.checkoutSuccess.go-login') }}
            </RouterLink>
        </main>
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Message from 'primevue/message'
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

onMounted(validateCheckout)

async function validateCheckout() {
    const sessionId = route.query.session_id

    if (!sessionId) {
        errorKey.value = 'subscription.checkoutSuccess.error.session-missing'
        loading.value = false
        return
    }

    try {
        const status = await subscriptionApi.getCheckoutSessionStatus(String(sessionId))
        activated.value = Boolean(status?.activated)
        subscriptionApi.clearPendingCheckout()
    } catch {
        errorKey.value = 'subscription.checkoutSuccess.error.validation-failed'
    } finally {
        loading.value = false
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
        radial-gradient(circle at top left, rgba(69, 221, 229, 0.20), transparent 30%),
        linear-gradient(135deg, #eefaff, #f8fbff);
}

.checkout-card {
    width: min(100%, 520px);
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

.checkout-icon.success {
    background: linear-gradient(135deg, #45dde5, #0fb7c2);
    box-shadow: 0 18px 40px rgba(69, 221, 229, 0.34);
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

.checkout-button {
    min-height: 54px;
    margin-top: 26px;
    padding: 0 24px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-weight: 1000;
    transition: all 180ms ease;
}

.checkout-button.primary {
    width: 100%;
    color: #0d1b2a;
    background: #45dde5;
    box-shadow: 0 16px 30px rgba(69, 221, 229, 0.26);
}

.checkout-button.primary:hover {
    background: #95fffd;
    transform: translateY(-1px);
}
</style>