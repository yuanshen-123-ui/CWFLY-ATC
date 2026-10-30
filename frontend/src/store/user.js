import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/index.js'

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------
const INSTRUCTOR_LEVELS = [8, 9, 10, 11, 12]
const ADMIN_MIN_LEVEL = 11

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useUserStore = defineStore('user', () => {
  // --- 状态 ---
  const token = ref(localStorage.getItem('atc_token') || '')
  const profile = ref(JSON.parse(localStorage.getItem('atc_profile') || 'null'))

  // --- 计算属性 ---
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => (profile.value?.rating ?? 0) >= ADMIN_MIN_LEVEL)
  const isInstructor = computed(() => INSTRUCTOR_LEVELS.includes(profile.value?.rating ?? 0))

  // --- 持久化 ---
  function save() {
    if (token.value) {
      localStorage.setItem('atc_token', token.value)
    } else {
      localStorage.removeItem('atc_token')
    }
    if (profile.value) {
      localStorage.setItem('atc_profile', JSON.stringify(profile.value))
    } else {
      localStorage.removeItem('atc_profile')
    }
  }

  // --- 登录 ---
  async function login(cid, password) {
    const res = await authApi().login({ cid, password })
    token.value = res.data.token
    profile.value = res.data.user
    save()
    return res.data
  }

  // --- 刷新资料 ---
  async function refreshProfile() {
    try {
      const res = await authApi().profile()
      profile.value = res.data
      save()
    } catch { /* 静默失败 */ }
  }

  // --- 退出 ---
  function logout() {
    token.value = ''
    profile.value = null
    save()
  }

  return {
    token, profile,
    isLoggedIn, isAdmin, isInstructor,
    login, refreshProfile, logout, save,
  }
})
