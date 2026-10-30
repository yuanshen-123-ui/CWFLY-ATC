<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-logo">ATC Center</div>
      <div class="login-sub">CW 模拟飞行管制员中心</div>

      <!-- OAuth 登录（主站授权） -->
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:16px;" @click="oauthLogin">
        使用主站账号登录
      </button>

      <div class="divider"><span>或使用账号密码</span></div>

      <!-- 传统登录 -->
      <div class="login-form">
        <input v-model="cid" placeholder="CID" maxlength="4" />
        <input v-model="password" type="password" placeholder="密码" @keyup.enter="doLogin" />
        <button class="btn btn-outline" style="width:100%;justify-content:center;" @click="doLogin" :disabled="loading">
          {{ loading ? '登录中...' : '直接登录' }}
        </button>
        <p v-if="error" class="text-sm" style="color:var(--c-danger);text-align:center;">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'

const MAIN_SITE = 'http://localhost:5173'
const ATC_CALLBACK = `${window.location.origin}/oauth/callback`

const router = useRouter()
const user = useUserStore()
const cid = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function oauthLogin() {
  // 跳转到主站 OAuth 授权页
  window.location.href = `${MAIN_SITE}/oauth/authorize?redirect_uri=${encodeURIComponent(ATC_CALLBACK)}`
}

async function doLogin() {
  if (!cid.value || !password.value) { error.value = '请填写 CID 和密码'; return }
  loading.value = true; error.value = ''
  try {
    const result = await user.login(cid.value, password.value)
    // 权限检查：必须有 controller 权限才能访问 ATC Center
    const perms = (result?.user?.permissions || '').split(',').filter(Boolean)
    if (!perms.includes('controller')) {
      user.logout()
      error.value = '无权限访问 ATC Center，仅限管制员/教员登录'
      loading.value = false
      return
    }
    router.push('/schedule')
  } catch (e) { error.value = e.message || '登录失败' }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: url('/bg-home.png') center / cover no-repeat fixed;
}
.login-card { padding: 40px; width: 380px; max-width: 90vw; }
.login-logo { font-size: 28px; font-weight: 800; color: var(--c-primary); text-align: center; }
.login-sub { font-size: 13px; color: var(--c-text-secondary); text-align: center; margin-bottom: 24px; }
.login-form { display: flex; flex-direction: column; gap: 12px; }
.divider { display:flex; align-items:center; gap:12px; margin-bottom:16px; color:var(--c-text-muted); font-size:12px; }
.divider::before, .divider::after { content:''; flex:1; height:1px; background:var(--glass-border); }
</style>
