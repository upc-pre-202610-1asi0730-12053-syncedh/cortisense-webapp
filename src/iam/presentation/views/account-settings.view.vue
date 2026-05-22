<!--
  @file account-settings.view.vue
  @description Configuración de cuenta — información personal y cambio de contraseña.
  Compartida entre admin, supervisor y personal médico.
-->
<template>
  <div>
    <div class="cs-page-header">
      <h1 class="cs-page-title">{{ $t('settings.title') }}</h1>
      <p class="cs-page-subtitle">{{ $t('settings.subtitle') }}</p>
    </div>

    <div class="cs-grid-2">
      <!-- Información personal -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="section-label">{{ $t('settings.personalInfo') }}</div>
        <div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--bg-content);border-radius:12px;margin:16px 0;">
          <div class="cs-avatar cs-avatar-lg" style="background:var(--primary);color:var(--bg-dark);">{{ initials }}</div>
          <div>
            <div style="font-size:17px;font-weight:800;color:var(--text-primary);">{{ authStore.user?.fullName }}</div>
            <div style="font-size:13px;color:var(--text-muted);">{{ authStore.user?.email }}</div>
            <div style="margin-top:4px;">
              <span class="cs-badge cs-badge-active">{{ roleLabel }}</span>
            </div>
          </div>
        </div>

        <div v-if="errorMsg" class="save-error-msg">
          <i class="pi pi-exclamation-circle"></i> {{ errorMsg }}
        </div>

        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.name') }}</label>
          <InputText v-model="form.firstName" style="width:100%;" />
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.lastName') }}</label>
          <InputText v-model="form.lastName" style="width:100%;" />
        </div>
        <div class="cs-form-group">
          <label class="cs-form-label">{{ $t('common.email') }}</label>
          <InputText v-model="form.email" type="email" style="width:100%;" disabled />
        </div>

        <div style="margin-top:8px;">
          <Button :label="$t('settings.saveChanges')" @click="saveInfo" :loading="savingInfo" />
        </div>
        <transition name="fade">
          <div v-if="infoSaved" class="save-success-msg"><i class="pi pi-check-circle"></i> {{ $t('settings.saved') }}</div>
        </transition>
      </div>

      <!-- Seguridad -->
      <div class="cs-card" style="margin-bottom:0;">
        <div class="section-label">{{ $t('settings.security') }}</div>
        <div style="margin-top:16px;">
          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('settings.currentPassword') }}</label>
            <Password v-model="pwd.current" :feedback="false" toggleMask style="width:100%;" :inputStyle="{ width:'100%' }" />
          </div>
          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('settings.newPassword') }}</label>
            <Password v-model="pwd.new" toggleMask style="width:100%;" :inputStyle="{ width:'100%' }" />
          </div>
          <div class="cs-form-group">
            <label class="cs-form-label">{{ $t('settings.confirmNewPassword') }}</label>
            <Password v-model="pwd.confirm" :feedback="false" toggleMask style="width:100%;" :inputStyle="{ width:'100%' }" />
            <small v-if="pwd.new && pwd.confirm && pwd.new !== pwd.confirm" style="color:#ef4444;font-size:11px;">{{ $t('settings.passwordsNoMatch') }}</small>
          </div>
          <Button :label="$t('settings.updatePassword')" severity="secondary" @click="savePassword" :loading="savingPwd" :disabled="!canSavePassword" />
          <transition name="fade">
            <div v-if="pwdSaved" class="save-success-msg"><i class="pi pi-check-circle"></i> {{ $t('settings.passwordUpdated') }}</div>
          </transition>
        </div>

        <!-- Toggle notificaciones -->
        <div style="margin-top:28px;">
          <div class="section-label">{{ $t('settings.notifications') }}</div>
          <div style="margin-top:12px;">
            <div class="toggle-setting" v-for="tog in toggles" :key="tog.key">
              <div>
                <div style="font-size:13px;font-weight:600;">{{ $t(tog.labelKey) }}</div>
                <div style="font-size:12px;color:var(--text-muted);">{{ $t(tog.descKey) }}</div>
              </div>
              <label class="cs-switch">
                <input type="checkbox" v-model="tog.value">
                <span class="cs-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../iam/application/auth.store.js'

const { t: $t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()

const form = reactive({ firstName: '', lastName: '', email: '' })
const pwd = reactive({ current: '', new: '', confirm: '' })
const savingInfo = ref(false)
const savingPwd = ref(false)
const infoSaved = ref(false)
const pwdSaved = ref(false)
const errorMsg = ref('')

function syncFormFromUser () {
  form.firstName = authStore.user?.firstName || ''
  form.lastName = authStore.user?.lastName || ''
  form.email = authStore.user?.email || ''
}

syncFormFromUser()
watch(() => authStore._userResource, syncFormFromUser, { deep: true })

const initials = computed(() => {
  return ((form.firstName?.[0] || '') + (form.lastName?.[0] || '')).toUpperCase()
})

const roleLabel = computed(() => authStore.userRole ? $t(`roles.${authStore.userRole}`) : '')
const canSavePassword = computed(() => !!pwd.current && !!pwd.new && pwd.new === pwd.confirm)

const toggles = reactive([
  { key: 'alerts', labelKey: 'settings.clinicalAlerts', descKey: 'settings.clinicalAlertsDesc', value: true },
  { key: 'shifts', labelKey: 'settings.shiftReminder', descKey: 'settings.shiftReminderDesc', value: true },
  { key: 'reports', labelKey: 'settings.weeklyReports', descKey: 'settings.weeklyReportsDesc', value: false }
])

async function saveInfo () {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    errorMsg.value = $t('settings.requiredName')
    return
  }

  savingInfo.value = true
  errorMsg.value = ''
  try {
    await authStore.updateProfile({ firstName: form.firstName, lastName: form.lastName })
    infoSaved.value = true
    setTimeout(() => { infoSaved.value = false }, 3000)
  } catch {
    errorMsg.value = $t('settings.profileError')
  } finally {
    savingInfo.value = false
  }
}

async function savePassword () {
  if (!canSavePassword.value) return
  savingPwd.value = true
  errorMsg.value = ''
  try {
    await authStore.updatePassword({ currentPassword: pwd.current, newPassword: pwd.new })
    pwdSaved.value = true
    pwd.current = ''; pwd.new = ''; pwd.confirm = ''
    setTimeout(() => { pwdSaved.value = false }, 3000)
  } catch {
    errorMsg.value = $t('settings.passwordError')
  } finally {
    savingPwd.value = false
  }
}
</script>

<style scoped>
.save-success-msg {
  display: flex; align-items: center; gap: 8px;
  color: #16a34a; font-size: 13px; margin-top: 12px; font-weight: 600;
}
.save-error-msg {
  display: flex; align-items: center; gap: 8px;
  color: #991b1b; background:#fef2f2; border:1px solid #fecaca;
  border-radius:8px; padding:10px 12px; font-size:13px; margin: 12px 0;
}
.toggle-setting {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid var(--border);
}
.toggle-setting:last-child { border-bottom: none; }

.cs-switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.cs-switch input { opacity: 0; width: 0; height: 0; }
.cs-slider {
  position: absolute; inset: 0; background: var(--border);
  border-radius: 24px; cursor: pointer; transition: 0.2s;
}
.cs-slider::before {
  content: ''; position: absolute;
  height: 18px; width: 18px; left: 3px; bottom: 3px;
  background: white; border-radius: 50%; transition: 0.2s;
}
input:checked + .cs-slider { background: var(--primary); }
input:checked + .cs-slider::before { transform: translateX(18px); }
</style>
