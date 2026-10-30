import { createRouter, createWebHistory } from 'vue-router'

// ---------------------------------------------------------------------------
// 路由表
// ---------------------------------------------------------------------------
const routes = [
  // --- 根路径直接跳转登录 ---
  { path: '/', redirect: '/login' },

  // --- 公开 ---
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/oauth/callback', name: 'OAuthCallback', component: () => import('@/views/OAuthCallback.vue') },

  // --- 需登录 ---
  {
    path: '',
    component: () => import('@/views/AppLayout.vue'),
    meta: { auth: true },
    children: [
      { path: 'schedule', name: 'Schedule', component: () => import('@/views/Schedule.vue') },
      { path: 'report', name: 'Report', component: () => import('@/views/Report.vue') },
      { path: 'apply-instructor', name: 'ApplyInstructor', component: () => import('@/views/ApplyInstructor.vue') },
      { path: 'simulator', name: 'Simulator', component: () => import('@/views/Simulator.vue') },
      { path: 'study', name: 'Study', component: () => import('@/views/ComingSoon.vue') },
      { path: 'exam', name: 'ExamList', component: () => import('@/views/ExamList.vue') },
      { path: 'exam/:id', name: 'ExamTake', component: () => import('@/views/ExamTake.vue') },
      { path: 'exam/history', name: 'ExamHistory', component: () => import('@/views/ExamHistory.vue') },
      // 管理后台
      { path: 'admin/schedule', name: 'AdminSchedule', component: () => import('@/views/admin/ScheduleManage.vue'), meta: { instructor: true } },
      { path: 'admin/users', name: 'AdminUsers', component: () => import('@/views/admin/Users.vue'), meta: { admin: true } },
      { path: 'admin/articles', name: 'AdminArticles', component: () => import('@/views/admin/Articles.vue'), meta: { admin: true } },
      { path: 'admin/videos', name: 'AdminVideos', component: () => import('@/views/admin/Videos.vue'), meta: { admin: true } },
      { path: 'admin/questions', name: 'AdminQuestions', component: () => import('@/views/admin/Questions.vue'), meta: { admin: true } },
      { path: 'admin/exams', name: 'AdminExams', component: () => import('@/views/admin/Exams.vue'), meta: { admin: true } },
      { path: 'admin/sessions', name: 'AdminSessions', component: () => import('@/views/admin/Sessions.vue'), meta: { instructor: true } },
    ],
  },
]

// ---------------------------------------------------------------------------
// 常量（对齐 FSD 协议标准：I1=8, I2=9, SUP=11, ADM=12）
// ---------------------------------------------------------------------------
const INSTRUCTOR_LEVELS = [8, 9, 10, 11, 12]
const ADMIN_MIN_LEVEL = 11

// ---------------------------------------------------------------------------
// 导航守卫
// ---------------------------------------------------------------------------
const router = createRouter({ history: createWebHistory(), routes })

function parseUser() {
  try {
    return JSON.parse(localStorage.getItem('atc_profile'))
  } catch {
    return null
  }
}

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('atc_token')
  const user = parseUser()

  if (to.meta.auth && !token) return next('/login')
  if (to.path === '/login' && token) return next('/schedule')
  if (to.meta.admin && (user?.rating ?? 0) < ADMIN_MIN_LEVEL) return next('/')
  if (to.meta.instructor && !INSTRUCTOR_LEVELS.includes(user?.rating ?? 0)) return next('/')

  next()
})

export default router
