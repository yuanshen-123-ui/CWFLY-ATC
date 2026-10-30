<template>
  <div>
    <div class="page-title">数据概览</div>
    <div class="page-desc">欢迎回来，{{ user.profile?.username }}</div>

    <div class="stats-row">
      <div class="card stat-card">
        <div class="stat-label stat-label-top">在线管制时长</div>
        <div class="stat-value">{{ (profile?.totalHours ?? 0).toFixed(1) }}h</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label stat-label-top">本月上报时长</div>
        <div class="stat-value">{{ (profile?.reportHours ?? 0).toFixed(1) }}h</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label stat-label-top">管制等级</div>
        <div class="stat-value">{{ fsdLabel(profile?.fsdLevel ?? 1) }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label stat-label-top">分配教员</div>
        <div class="stat-value">{{ profile?.instructorName || profile?.instructor || '未分配' }}</div>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="font-size:15px;margin-bottom:12px;">快捷操作</h3>
      <div class="quick-actions">
        <router-link to="/schedule" class="action-card"><span class="action-icon">排</span><span>管制排班</span></router-link>
        <router-link to="/report" class="action-card"><span class="action-icon">报</span><span>上管上报</span></router-link>
        <router-link to="/apply-instructor" class="action-card"><span class="action-icon">教</span><span>申请教员</span></router-link>
        <router-link to="/simulator" class="action-card"><span class="action-icon">模</span><span>模拟机预约</span></router-link>
        <router-link to="/study" class="action-card"><span class="action-icon">学</span><span>理论学习</span></router-link>
        <router-link to="/exam" class="action-card"><span class="action-icon">考</span><span>理论考核</span></router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user.js'
const user = useUserStore()
const profile = ref(null)
const FSD_LABELS = {0:'SUSPENDED',1:'OBS',2:'S1',3:'S2',4:'S3',5:'C1',6:'C2',7:'C3',8:'I1',9:'I2',10:'I3',11:'SUP',12:'ADM'}
function fsdLabel(l) { return FSD_LABELS[l] || `Lv${l}` }
onMounted(async () => { await user.refreshProfile(); profile.value = user.profile })
</script>

<style scoped>
.stats-row { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:12px; }
.stat-card { text-align:center; padding:20px 16px; }
.stat-label-top { font-size:12px; color:var(--c-text-secondary); margin-bottom:6px; }
.stat-value { font-size:20px; font-weight:700; color:var(--c-primary); }
.stat-label { font-size:12px; color:var(--c-text-secondary); margin-top:4px; }
.quick-actions { display:flex; gap:12px; flex-wrap:wrap; }
.action-card { display:flex; flex-direction:column; align-items:center; gap:6px; padding:16px 20px; border-radius:var(--radius-lg); border:1px solid var(--glass-border); text-decoration:none; color:var(--c-text); transition:all .15s; cursor:pointer; font-size:13px; }
.action-card:hover { border-color:var(--c-primary); background:rgba(0,113,227,0.08); text-decoration:none; }
.action-icon { width:32px; height:32px; border-radius:6px; background:var(--c-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; }
</style>
