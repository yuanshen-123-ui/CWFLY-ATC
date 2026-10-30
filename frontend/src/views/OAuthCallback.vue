<template>
  <div class="login-page">
    <div class="login-card card" style="text-align:center;padding:40px;">
      <div v-if="loading" class="text-sm text-muted">正在验证主站身份，请稍候...</div>
      <div v-else-if="error" style="color:var(--c-danger);">
        <p style="font-size:16px;font-weight:600;margin-bottom:8px;">授权失败</p>
        <p class="text-sm">{{ error }}</p>
        <button class="btn btn-primary" style="margin-top:16px;" @click="goLogin">返回登录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'
import api from '@/api/index.js'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const mainToken = route.query.token
  if (!mainToken) {
    error.value = '未接收到授权信息'
    loading.value = false
    return
  }

  try {
    // 通过 ATC 后端用主站 token 换取 ATC token
    const res = await api.post('/auth/oauth/login', { mainToken })
    user.token = res.data.token
    user.profile = res.data.user
    user.save()
    router.push('/')
  } catch (e) {
    error.value = e.message || '授权登录失败，请重试'
  } finally {
    loading.value = false
  }
})

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.login-page {
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  background: url('/bg-home.png') center / cover no-repeat fixed;
}
.login-card { width:380px; max-width:90vw; }
.text-sm { font-size:13px; }
.text-muted { color:var(--c-text-muted); }
</style>
