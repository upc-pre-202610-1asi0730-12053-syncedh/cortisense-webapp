<template>
  <section>
    <header class="page-header"><h1>Configuración</h1><p>Actualiza la información principal de tu cuenta en CortiSense.</p></header>
    <section class="settings-grid">
      <article class="profile-card">
        <div class="profile-avatar">{{ initials(authStore.user) }}</div>
        <h2>{{ authStore.user?.fullName || '—' }}</h2>
        <p>{{ authStore.user?.email || '—' }}</p>
        <div class="profile-meta">
          <div><i class="pi pi-shield"></i><span>{{ roleLabel(authStore.user?.apiRole || authStore.userRole) }}</span></div>
          <div><i class="pi pi-check-circle"></i><span class="status-pill active">Activo</span></div>
        </div>
      </article>

      <article class="settings-card">
        <div class="section-header"><div><h2>Datos de la cuenta</h2><p>Modifica tu nombre visible y revisa tu información de acceso.</p></div></div>
        <form @submit.prevent="saveProfile" class="settings-form">
          <div class="form-grid">
            <div class="field"><label>Nombre</label><div class="input-control"><i class="pi pi-user"></i><input v-model.trim="profile.firstName" placeholder="Nombre"></div></div>
            <div class="field"><label>Apellido</label><div class="input-control"><i class="pi pi-user"></i><input v-model.trim="profile.lastName" placeholder="Apellido"></div></div>
          </div>
          <div class="field"><label>Correo electrónico</label><div class="input-control"><i class="pi pi-envelope"></i><input :value="authStore.user?.email" disabled></div></div>
          <div class="readonly-grid">
            <div class="readonly-item"><span>Rol</span><strong>{{ roleLabel(authStore.user?.apiRole || authStore.userRole) }}</strong></div>
            <div class="readonly-item"><span>Estado</span><strong>Activo</strong></div>
            <div class="readonly-item"><span>Organización</span><strong>#{{ authStore.user?.organizationId || '—' }}</strong></div>
          </div>
          <div class="form-actions"><button class="btn primary" type="submit"><i class="pi pi-check-circle"></i>Guardar cambios</button></div>
        </form>
      </article>
    </section>
  </section>
</template>

<script setup>
import { reactive, watchEffect } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../application/auth.store.js'
import { initials } from '../../../shared/infrastructure/api.service.js'
const authStore = useAuthStore(); const toast = useToast(); const profile = reactive({ firstName: '', lastName: '' })
watchEffect(() => resetProfile())
function resetProfile () { profile.firstName = authStore.user?.firstName || ''; profile.lastName = authStore.user?.lastName || '' }
async function saveProfile () { await authStore.updateProfile(profile); toast.add({ severity: 'success', summary: 'CortiSense', detail: 'Perfil actualizado', life: 2500 }) }
function roleLabel (role) { const value = String(role || '').toUpperCase(); if (value.includes('ADMIN')) return 'Administrador'; if (value.includes('SUPERVISOR')) return 'Supervisor clínico'; return 'Personal médico' }
</script>
