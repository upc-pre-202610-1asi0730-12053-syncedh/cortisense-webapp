<!--
  @file app.vue
  @description Componente raíz de CortiSense.
  Renderiza AppLayout con el layout interno cuando meta.layout === 'app'.
  Las rutas públicas (/auth/*) se renderizan sin layout.
-->
<template>
  <template v-if="route.meta.layout === 'app'">
    <AppLayout>
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </RouterView>
    </AppLayout>
  </template>

  <template v-else>
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </template>

  <Toast position="top-right" />
</template>

<script setup>
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import AppLayout from './shared/presentation/components/app-layout.vue'

const route = useRoute()
</script>
