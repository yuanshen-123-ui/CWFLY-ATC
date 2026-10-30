<template>
  <div>
    <div class="page-title">模拟机预约</div>
    <div class="page-desc">新建模拟机训练或考核预约</div>

    <!-- 新建预约 -->
    <div class="card" style="margin-bottom:20px; padding:20px;">
      <h3 style="font-size:15px; margin-bottom:16px;">新建预约</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>类型</label>
          <select v-model="form.type" class="input">
            <option value="training">模拟机训练</option>
            <option value="exam">模拟机考核</option>
          </select>
        </div>
        <div class="form-group">
          <label>预约时间（北京时间）</label>
          <input v-model="form.startTime" type="datetime-local" class="input" />
        </div>
        <div class="form-group">
          <label>预约范围</label>
          <select v-model="form.scope" class="input" @change="onScopeChange">
            <option value="all">全体教员</option>
            <option value="指定教员">指定教员</option>
          </select>
        </div>
        <div class="form-group" v-if="form.scope === '指定教员'">
          <label>选择教员</label>
          <select v-model="form.instructorCid" class="input">
            <option value="">— 请选择 —</option>
            <option v-for="inst in instructors" :key="inst.cid" :value="inst.cid">
              {{ inst.cid }} ({{ inst.name || '' }}) - {{ fsdLabel(inst.rating) }}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-top:12px;">
        <label>备注（可选）</label>
        <textarea v-model="form.note" class="input" placeholder="可选" rows="2"></textarea>
      </div>
      <div class="flex gap-sm" style="margin-top:16px; justify-content:flex-end;">
        <button class="btn btn-outline" @click="reset">重置</button>
        <button class="btn btn-primary" @click="submit">提交预约</button>
      </div>
      <p v-if="msg" class="text-sm mt-md" :style="{color:msgColor}">{{ msg }}</p>
    </div>

    <!-- 我的预约 -->
    <div class="page-title" style="font-size:16px; margin-top:24px;">我的预约</div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>类型</th>
              <th>时间</th>
              <th>范围</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id">
              <td><span class="badge" :class="s.type==='exam'?'badge-danger':'badge-info'">{{ s.type==='exam'?'考核':'训练' }}</span></td>
              <td class="text-sm">{{ s.startTime?.slice(0,16) }}</td>
              <td class="text-sm">{{ s.scope === '指定教员' ? ('教员 ' + s.instructorCid) : '全体教员' }}</td>
              <td><span class="badge" :class="statusBadge(s.status)">{{ statusLabel(s.status) }}</span></td>
              <td class="text-sm text-muted">{{ s.note || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { simApi, instructorApi } from '@/api/index.js'
const form = ref({ type:'training', title:'', startTime:'', note:'', scope:'all', instructorCid:'' })
const sessions = ref([])
const instructors = ref([])
const msg = ref('')
const msgColor = ref('')
const FSD_LABELS = {0:'SUSPENDED',1:'OBS',2:'S1',3:'S2',4:'S3',5:'C1',6:'C2',7:'C3',8:'I1',9:'I2',10:'I3',11:'SUP',12:'ADM'}
function fsdLabel(l) { return FSD_LABELS[l] || `Lv${l}` }
const now = new Date(); now.setMinutes(0)
form.value.startTime = now.toISOString().slice(0,16)
function reset() { form.value = { type:'training', title:'', startTime:now.toISOString().slice(0,16), note:'', scope:'all', instructorCid:'' }; msg.value='' }
function onScopeChange() { if (form.value.scope !== '指定教员') form.value.instructorCid = '' }
function statusLabel(s) { return {pending:'待审核',approved:'已通过',completed:'已完成',cancelled:'已取消'}[s]||s }
function statusBadge(s) { return {pending:'badge-warning',approved:'badge-success',completed:'badge-info',cancelled:'badge-default'}[s]||'badge-default' }
async function submit() {
  if(!form.value.startTime) { msg.value='请选择预约时间'; msgColor.value='var(--c-danger)'; return }
  if(form.value.scope === '指定教员' && !form.value.instructorCid) { msg.value='请选择指定教员'; msgColor.value='var(--c-danger)'; return }
  try { await simApi().create(form.value); msg.value='预约成功！'; msgColor.value='var(--c-success)'; load(); reset() }
  catch(e) { msg.value=e.message||'提交失败'; msgColor.value='var(--c-danger)' }
}
async function load() {
  try {
    const [r, i] = await Promise.all([simApi().list(), instructorApi().list()])
    sessions.value = r.data; instructors.value = i.data
  } catch {}
}
onMounted(load)
</script>

<style scoped>
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.form-group label { display:block; font-size:12px; font-weight:600; color:var(--c-text-secondary); margin-bottom:4px; }
.flex { display:flex; align-items:center; }
.gap-sm { gap:8px; }
.text-sm { font-size:12px; }
.text-muted { color:var(--c-text-muted); }
.mt-md { margin-top:12px; }
@media (max-width:480px) { .form-grid { grid-template-columns:1fr; } }
</style>
