<template>
  <div class="layout">
    <aside class="sidebar card">
      <div class="sidebar-brand">ATC Center</div>
      <nav class="sidebar-nav">
        <router-link to="/schedule" class="nav-item" exact-active-class="active">管制排班</router-link>
        <router-link to="/schedule" class="nav-item" active-class="active">管制排班</router-link>
        <router-link to="/report" class="nav-item" active-class="active">上管上报</router-link>
        <router-link to="/apply-instructor" class="nav-item" active-class="active">申请教员</router-link>
        <router-link to="/simulator" class="nav-item" active-class="active">模拟机预约</router-link>
        <router-link to="/study" class="nav-item" active-class="active">理论学习</router-link>
        <router-link to="/exam" class="nav-item" active-class="active">理论考核</router-link>
        <div v-if="user.isInstructor" class="nav-section">管理中心</div>
        <template v-if="user.isInstructor">
          <router-link to="/admin/schedule" class="nav-item sub" active-class="active">排班管理</router-link>
          <router-link v-if="user.isAdmin" to="/admin/users" class="nav-item sub" active-class="active">用户管理</router-link>
          <router-link v-if="user.isAdmin" to="/admin/articles" class="nav-item sub" active-class="active">文章管理</router-link>
          <router-link v-if="user.isAdmin" to="/admin/videos" class="nav-item sub" active-class="active">视频管理</router-link>
          <router-link v-if="user.isAdmin" to="/admin/questions" class="nav-item sub" active-class="active">题库管理</router-link>
          <router-link v-if="user.isAdmin" to="/admin/exams" class="nav-item sub" active-class="active">考试管理</router-link>
          <router-link to="/admin/sessions" class="nav-item sub" active-class="active">预约管理</router-link>
        </template>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">{{ user.profile?.username || '用户' }}</div>
        <div class="sidebar-cid">CID {{ user.profile?.cid }}</div>
        <button class="btn btn-outline btn-sm logout-btn" @click="logout">退出登录</button>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user.js'
const user = useUserStore()
const router = useRouter()
onMounted(() => { user.refreshProfile() })
function logout() { user.logout(); router.push('/login') }
</script>

<style scoped>
.layout { display:flex; min-height:100vh; padding:12px; gap:12px; }
.sidebar {
  width: 200px; flex-shrink: 0; padding: 0;
  display: flex; flex-direction: column;
  position: sticky; top: 12px; height: calc(100vh - 24px);
  overflow: hidden;
}
.sidebar-brand {
  padding: 20px 16px; font-size: 18px; font-weight: 800;
  color: var(--c-primary);
  border-bottom: 1px solid var(--glass-border);
}
.sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: block; padding: 8px 12px; border-radius: var(--radius-sm);
  color: var(--c-text-secondary); font-size: 13px; font-weight: 500;
  text-decoration: none; transition: all var(--transition);
}
.nav-item:hover { background: var(--glass-bg); color: var(--c-text); text-decoration: none; }
.nav-item.active { background: var(--c-primary-light); color: var(--c-primary); font-weight: 600; }
.nav-item.sub { padding-left: 28px; font-size: 12px; }
.nav-section {
  padding: 12px 12px 4px; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .5px;
  color: var(--c-text-muted); margin-top: 8px;
  border-top: 1px solid var(--glass-border);
}
.sidebar-footer { padding: 12px; border-top: 1px solid var(--glass-border); }
.sidebar-user { font-size: 13px; font-weight: 600; }
.sidebar-cid { font-size: 11px; color: var(--c-text-muted); }
.logout-btn { width: 100%; margin-top: 8px; justify-content: center; }
.main { flex: 1; min-width: 0; overflow-y: auto; height: calc(100vh - 24px); max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 16px; }

/* ---------- 自适应 ---------- */
@media (max-width: 768px) {
  .layout { flex-direction: column; padding: 8px; gap: 0; }
  .sidebar {
    width: 100% !important; position: relative; top: 0;
    height: auto; min-height: auto; flex-direction: row;
    flex-wrap: wrap; border-radius: var(--radius-md);
    margin-bottom: 8px;
  }
  .sidebar-brand {
    width: 100%; padding: 12px 16px; font-size: 16px;
    border-bottom: 1px solid var(--glass-border);
  }
  .sidebar-nav {
    flex: 1; overflow-y: visible; padding: 8px;
    flex-direction: row; flex-wrap: wrap; gap: 4px;
  }
  .nav-section { display: none; }
  .nav-item { font-size: 12px; padding: 6px 10px; }
  .nav-item.sub { padding-left: 10px; }
  .sidebar-footer {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 8px 12px;
  }
  .sidebar-user { font-size: 12px; }
  .sidebar-cid { font-size: 10px; }
  .logout-btn { width: auto; margin-top: 0; margin-left: auto; }
  .main { height: auto; overflow-y: visible; }
}
</style>
