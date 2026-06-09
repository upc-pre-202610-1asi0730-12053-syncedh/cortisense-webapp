<template>
  <AppLayout v-if="route.meta.layout === 'app'">
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </RouterView>
  </AppLayout>

  <RouterView v-else v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </RouterView>

  <Toast position="top-right" />
  <ConfirmDialog />
</template>

<script setup>
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppLayout from './shared/presentation/components/app-layout.vue'

const route = useRoute()
</script>
