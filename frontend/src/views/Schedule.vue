<template>
  <div>
    <div class="page-title">管制排班</div>
    <div class="page-desc">查看每日管制席位排班</div>

    <!-- 日期选择 -->
    <div class="card date-picker">
      <button class="btn btn-outline btn-sm" @click="changeDate(-1)">‹ 前一天</button>
      <span class="date-label">{{ formatDate(currentDate) }}</span>
      <button class="btn btn-outline btn-sm" @click="changeDate(1)">后一天 ›</button>
      <button class="btn btn-outline btn-sm" style="margin-left:8px;" @click="today">今天</button>
    </div>

    <!-- 排班概览 -->
    <div class="card" style="margin-top:12px;">
      <div v-if="schedules.length === 0" class="empty-state">
        <div class="empty-icon">�</div>
        <div>暂无排班数据</div>
      </div>
      <div v-else class="schedule-grid">
        <div class="schedule-header">席位</div>
        <div class="schedule-header">管制员</div>
        <div class="schedule-header">开始</div>
        <div class="schedule-header">结束</div>
        <div class="schedule-header">状态</div>
        <template v-for="s in schedules" :key="s.id">
          <div class="schedule-cell">
            <span class="pos-badge" :class="'pos-' + s.position.toLowerCase()">{{ positionLabel(s.position) }}</span>
          </div>
          <div class="schedule-cell font-bold">{{ s.cid }}</div>
          <div class="schedule-cell">{{ s.startTime ? formatTime(s.startTime) : '-' }}</div>
          <div class="schedule-cell">{{ s.endTime ? formatTime(s.endTime) : '-' }}</div>
          <div class="schedule-cell">
            <span class="status-tag" :class="'status-' + s.status">{{ statusLabel(s.status) }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 教员/管理员快捷操作 -->
    <div v-if="user.isInstructor" class="card" style="margin-top:12px; text-align:center;">
      <router-link to="/admin/schedule" class="btn btn-primary">排班管理 →</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user.js'
import { scheduleApi } from '@/api/index.js'
const user = useUserStore()

const currentDate = ref(new Date())
const schedules = ref([])

const POSITIONS = { GROUND: '地面', TOWER: '塔台', APPROACH: '进近', CENTER: '区域' }
const STATUS_LABELS = { scheduled: '已排班', working: '值班中', completed: '已完成', cancelled: '已取消' }

function positionLabel(p) { return POSITIONS[p] || p }
function statusLabel(s) { return STATUS_LABELS[s] || s }

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatTime(t) {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function changeDate(delta) {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + delta)
  currentDate.value = d
  loadSchedules()
}

function today() {
  currentDate.value = new Date()
  loadSchedules()
}

async function loadSchedules() {
  try {
    const res = await scheduleApi().list({ date: formatDate(currentDate.value) })
    schedules.value = res.data
  } catch { schedules.value = [] }
}

onMounted(loadSchedules)
</script>

<style scoped>
.date-picker {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 16px;
}
.date-label { font-size: 16px; font-weight: 600; min-width: 120px; text-align: center; }
.schedule-grid {
  display: grid;
  grid-template-columns: 80px 1fr 80px 80px 80px;
  gap: 0;
}
.schedule-header {
  padding: 10px 12px; font-size: 12px; font-weight: 700;
  color: var(--c-text-muted); text-transform: uppercase;
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg);
}
.schedule-cell {
  padding: 10px 12px; font-size: 13px;
  border-bottom: 1px solid var(--glass-border);
  display: flex; align-items: center;
}
.pos-badge {
  display: inline-flex; padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 600;
}
.pos-ground { background: #e8f5e9; color: #2e7d32; }
.pos-tower { background: #e3f2fd; color: #1565c0; }
.pos-approach { background: #fff3e0; color: #e65100; }
.pos-center { background: #f3e5f5; color: #6a1b9a; }
.status-tag {
  display: inline-flex; padding: 2px 8px; border-radius: 8px;
  font-size: 11px; font-weight: 600;
}
.status-scheduled { background: #e8eaf6; color: #283593; }
.status-working { background: #e8f5e9; color: #2e7d32; }
.status-completed { background: #f5f5f5; color: #757575; }
.status-cancelled { background: #fce4ec; color: #b71c1c; }
.empty-state { text-align: center; padding: 40px 20px; color: var(--c-text-muted); }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.font-bold { font-weight: 600; }

/* ---------- 自适应 ---------- */
@media (max-width: 768px) {
  .date-picker { flex-wrap: wrap; gap: 6px; padding: 12px; }
  .date-label { font-size: 14px; min-width: 100px; order: -1; width: 100%; }
  .schedule-grid {
    grid-template-columns: 70px 1fr 60px 60px 60px;
    font-size: 12px;
    overflow-x: auto;
  }
  .schedule-header { padding: 8px; font-size: 10px; }
  .schedule-cell { padding: 8px; font-size: 12px; }
}
@media (max-width: 480px) {
  .schedule-grid {
    grid-template-columns: 60px 1fr 50px 50px 50px;
    font-size: 11px;
  }
  .schedule-header, .schedule-cell { padding: 6px 4px; }
  .pos-badge { font-size: 10px; padding: 1px 6px; }
  .status-tag { font-size: 10px; padding: 1px 6px; }
}
</style>
