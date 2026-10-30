<template>
  <div>
    <div class="page-title">上管上报</div>
    <div class="page-desc">上报您的管制记录</div>

    <!-- 上报统计 -->
    <div class="stats-row">
      <div class="card stat-card">
        <div class="stat-label stat-label-top">当前有效时长</div>
        <div class="stat-value">{{ (stats.currentHours ?? 0).toFixed(1) }}h</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label stat-label-top">未上报次数</div>
        <div class="stat-value" :style="{color: (stats.unreportedCount ?? 0) > 0 ? 'var(--c-danger)' : 'var(--c-primary)'}">{{ stats.unreportedCount ?? 0 }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label stat-label-top">我的教员</div>
        <div class="stat-value">{{ stats.instructorName || stats.instructorCid || '未分配' }}</div>
      </div>
    </div>

    <!-- 新建上报（右上角） -->
    <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
      <button class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? '收起' : '+ 新建上报' }}
      </button>
    </div>

    <!-- 上报表单 -->
    <div v-if="showForm" class="card" style="margin-bottom:20px; padding:20px;">
      <h3 style="font-size:15px; margin-bottom:16px;">新建上报</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>教员 CID</label>
          <input v-model="form.instructorCid" class="input" placeholder="教员 CID" />
        </div>
        <div class="form-group">
          <label>教员姓名 (realname)</label>
          <input v-model="form.instructorName" class="input" placeholder="教员姓名" />
        </div>
        <div class="form-group">
          <label>上管席位</label>
          <select v-model="form.position" class="input">
            <option value="">请选择席位</option>
            <option value="GROUND">地面 (GROUND)</option>
            <option value="TOWER">塔台 (TOWER)</option>
            <option value="APPROACH">进近 (APPROACH)</option>
            <option value="CENTER">区域 (CENTER)</option>
          </select>
        </div>
        <div class="form-group">
          <label>上管时长（分钟）</label>
          <input v-model.number="form.durationMin" type="number" class="input" placeholder="分钟" min="0" />
        </div>
      </div>
      <div class="form-group" style="margin-top:12px;">
        <label>备注</label>
        <textarea v-model="form.note" class="input" placeholder="可选" rows="2"></textarea>
      </div>
      <div class="flex gap-sm" style="margin-top:16px; justify-content:flex-end;">
        <button class="btn btn-outline" @click="showForm=false">取消</button>
        <button class="btn btn-primary" @click="submit">提交上报</button>
      </div>
      <p v-if="msg" class="text-sm mt-md" :style="{color:msgColor}">{{ msg }}</p>
    </div>

    <!-- 上报记录 -->
    <div class="page-title" style="font-size:16px; margin-top:24px;">上报记录</div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>教员</th>
              <th>席位</th>
              <th>时长</th>
              <th>状态</th>
              <th>备注</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in reports" :key="r.id">
              <td class="font-bold">{{ r.instructorName || r.instructorCid }}</td>
              <td><span class="pos-badge" :class="'pos-' + r.position.toLowerCase()">{{ positionLabel(r.position) }}</span></td>
              <td>{{ r.durationMin }} 分钟</td>
              <td><span class="status-tag" :class="'status-' + r.status">{{ statusLabel(r.status) }}</span></td>
              <td class="text-sm text-muted">{{ r.note || '-' }}</td>
              <td class="text-sm text-muted">{{ r.createdAt?.slice(0, 10) }}</td>
            </tr>
            <tr v-if="!reports.length">
              <td colspan="6" class="text-center text-muted">暂无上报记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { reportApi } from '@/api/index.js'
const showForm = ref(false)
const stats = ref({})
const reports = ref([])
const form = ref({ instructorCid: '', instructorName: '', position: '', durationMin: 60, note: '' })
const msg = ref('')
const msgColor = ref('')

const POSITIONS = { GROUND: '地面', TOWER: '塔台', APPROACH: '进近', CENTER: '区域' }
function positionLabel(p) { return POSITIONS[p] || p }
function statusLabel(s) { return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[s] || s }

async function load() {
  try {
    const [s, r] = await Promise.all([reportApi().stats(), reportApi().list()])
    stats.value = s.data
    reports.value = r.data
  } catch {}
}

async function submit() {
  if (!form.value.instructorCid || !form.value.position) {
    msg.value = '请填写教员 CID 和上管席位'; msgColor.value = 'var(--c-danger)'; return
  }
  try {
    await reportApi().create(form.value)
    msg.value = '上报成功！'; msgColor.value = 'var(--c-success)'
    form.value = { instructorCid: '', instructorName: '', position: '', durationMin: 60, note: '' }
    showForm.value = false
    load()
  } catch (e) { msg.value = e.message || '提交失败'; msgColor.value = 'var(--c-danger)' }
}

onMounted(load)
</script>

<style scoped>
.stats-row { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:12px; margin-bottom:12px; }
.stat-card { text-align:center; padding:16px; }
.stat-label-top { font-size:12px; color:var(--c-text-secondary); margin-bottom:6px; }
.stat-value { font-size:20px; font-weight:700; color:var(--c-primary); }
.stat-label { font-size:12px; color:var(--c-text-secondary); margin-top:4px; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.form-group label { display:block; font-size:12px; font-weight:600; color:var(--c-text-secondary); margin-bottom:4px; }
.flex { display:flex; align-items:center; }
.gap-sm { gap:8px; }
.pos-badge { display:inline-flex; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
.pos-ground { background:#e8f5e9; color:#2e7d32; }
.pos-tower { background:#e3f2fd; color:#1565c0; }
.pos-approach { background:#fff3e0; color:#e65100; }
.pos-center { background:#f3e5f5; color:#6a1b9a; }
.status-tag { display:inline-flex; padding:2px 8px; border-radius:8px; font-size:11px; font-weight:600; }
.status-pending { background:#e8eaf6; color:#283593; }
.status-approved { background:#e8f5e9; color:#2e7d32; }
@media (max-width:480px) { .form-grid { grid-template-columns:1fr; } }
.status-rejected { background:#fce4ec; color:#b71c1c; }
.font-bold { font-weight:600; }
.text-sm { font-size:12px; }
.text-muted { color:var(--c-text-muted); }
.mt-md { margin-top:12px; }
</style>
