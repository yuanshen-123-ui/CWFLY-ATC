<template>
  <div>
    <div class="page-title">排班管理</div>
    <div class="page-desc">管理管制员排班，支持按日查看和新建排班</div>

    <!-- 日期选择 + 新增 -->
    <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px;">
      <div class="flex gap-sm" style="align-items:center;">
        <button class="btn btn-outline btn-sm" @click="changeDate(-1)">‹</button>
        <span class="date-label">{{ formatDate(currentDate) }}</span>
        <button class="btn btn-outline btn-sm" @click="changeDate(1)">›</button>
        <button class="btn btn-outline btn-sm" @click="today" style="margin-left:4px;">今天</button>
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreate">+ 新增排班</button>
    </div>

    <!-- 排班列表 -->
    <div class="card" style="margin-top:12px;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>CID</th>
              <th>席位</th>
              <th>开始</th>
              <th>结束</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in schedules" :key="s.id">
              <td class="font-bold">{{ s.cid }}</td>
              <td><span class="pos-badge" :class="'pos-' + s.position.toLowerCase()">{{ positionLabel(s.position) }}</span></td>
              <td>{{ formatTime(s.startTime) }}</td>
              <td>{{ formatTime(s.endTime) }}</td>
              <td>
                <select v-model="s.status" class="input input-sm" @change="updateStatus(s)">
                  <option value="scheduled">已排班</option>
                  <option value="working">值班中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </td>
              <td><input v-model="s.note" class="input input-sm" style="width:100px;" @change="saveNote(s)" /></td>
              <td><button class="btn btn-outline btn-sm" style="color:var(--c-danger);" @click="del(s)">删除</button></td>
            </tr>
            <tr v-if="!schedules.length">
              <td colspan="7" class="text-center text-muted">暂无排班</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增排班弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm=false">
      <div class="modal card">
        <h3 style="margin-bottom:16px;">新建排班</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>管制员 CID</label>
            <input v-model="form.cid" class="input" placeholder="如 1001" />
          </div>
          <div class="form-group">
            <label>席位</label>
            <select v-model="form.position" class="input">
              <option value="GROUND">地面 (GROUND)</option>
              <option value="TOWER">塔台 (TOWER)</option>
              <option value="APPROACH">进近 (APPROACH)</option>
              <option value="CENTER">区域 (CENTER)</option>
            </select>
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <input v-model="form.startTime" type="datetime-local" class="input" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input v-model="form.endTime" type="datetime-local" class="input" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label>备注</label>
            <input v-model="form.note" class="input" placeholder="可选" />
          </div>
        </div>
        <div class="flex gap-sm" style="justify-content:flex-end; margin-top:16px;">
          <button class="btn btn-outline" @click="showForm=false">取消</button>
          <button class="btn btn-primary" @click="create">确认创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { scheduleApi } from '@/api/index.js'

const currentDate = ref(new Date())
const schedules = ref([])
const showForm = ref(false)
const form = ref({ cid: '', position: 'TOWER', startTime: '', endTime: '', note: '' })

const POSITIONS = { GROUND: '地面', TOWER: '塔台', APPROACH: '进近', CENTER: '区域' }
function positionLabel(p) { return POSITIONS[p] || p }

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function formatTime(t) {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function changeDate(delta) {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + delta)
  currentDate.value = d
  load()
}
function today() { currentDate.value = new Date(); load() }
function openCreate() {
  form.value = { cid: '', position: 'TOWER', startTime: '', endTime: '', note: '' }
  showForm.value = true
}

async function load() {
  try {
    const res = await scheduleApi().list({ date: formatDate(currentDate.value) })
    schedules.value = res.data
  } catch { schedules.value = [] }
}

async function create() {
  try {
    const d = formatDate(currentDate.value)
    await scheduleApi().create({
      cid: form.value.cid, position: form.value.position,
      date: d,
      startTime: form.value.startTime, endTime: form.value.endTime,
      note: form.value.note
    })
    showForm.value = false
    load()
  } catch (e) { alert(e.message || '创建失败') }
}

async function updateStatus(s) {
  try { await scheduleApi().update(s.id, { status: s.status }) } catch {}
}

async function saveNote(s) {
  try { await scheduleApi().update(s.id, { note: s.note }) } catch {}
}

async function del(s) {
  if (!confirm(`确定删除 ${s.cid} 的 ${positionLabel(s.position)} 排班？`)) return
  try { await scheduleApi().remove(s.id); load() } catch {}
}

onMounted(load)
</script>

<style scoped>
.flex { display:flex; align-items:center; }
.gap-sm { gap: 8px; }
.date-label { font-size: 15px; font-weight: 600; min-width: 100px; text-align:center; }
.input-sm { font-size:12px; padding:4px 8px; }
.pos-badge { display:inline-flex; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
.pos-ground { background:#e8f5e9; color:#2e7d32; }
.pos-tower { background:#e3f2fd; color:#1565c0; }
.pos-approach { background:#fff3e0; color:#e65100; }
.pos-center { background:#f3e5f5; color:#6a1b9a; }
.font-bold { font-weight:600; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; z-index:100; }
.modal { width:480px; max-width:90vw; padding:24px; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.form-group label { display:block; font-size:12px; font-weight:600; color:var(--c-text-secondary); margin-bottom:4px; }
</style>
