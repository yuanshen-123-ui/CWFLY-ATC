<template>
  <div>
    <div class="page-title">申请教员</div>
    <div class="page-desc">浏览全体教员并选择您想申请分配的教员</div>

    <!-- 我的申请记录 -->
    <div v-if="applications.length > 0" class="card" style="margin-bottom:16px; padding:16px;">
      <h3 style="font-size:14px; margin-bottom:12px;">我的申请记录</h3>
      <div v-for="a in applications" :key="a.id" class="app-item" style="flex-wrap:wrap;">
        <span>目标教员：<strong>{{ a.targetCid }}</strong></span>
        <span class="status-tag" :class="'status-' + a.status">{{ statusLabel(a.status) }}</span>
        <span class="text-sm text-muted">{{ a.createdAt?.slice(0, 10) }}</span>
      </div>
    </div>

    <!-- 教员列表 -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>CID</th>
              <th>姓名</th>
              <th>等级</th>
              <th>邮箱</th>
              <th>QQ</th>
              <th>飞行时长</th>
              <th>管制时长</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inst in instructors" :key="inst.cid">
              <td class="font-bold">{{ inst.cid }}</td>
              <td>{{ inst.name || '-' }}</td>
              <td><span class="fsd-badge" :class="'fsd-' + inst.rating">{{ fsdLabel(inst.rating) }}</span></td>
              <td class="text-sm">{{ inst.email || '-' }}</td>
              <td class="text-sm">{{ inst.qq || '-' }}</td>
              <td class="text-sm">{{ (inst.flightHours ?? 0).toFixed(1) }}h</td>
              <td class="text-sm">{{ (inst.totalHours ?? 0).toFixed(1) }}h</td>
              <td>
                <button class="btn btn-primary btn-sm" @click="apply(inst)">申请</button>
              </td>
            </tr>
            <tr v-if="!instructors.length">
              <td colspan="8" class="text-center text-muted">暂无教员数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="msg" class="text-sm mt-md" :style="{color:msgColor}">{{ msg }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { instructorApi } from '@/api/index.js'
const instructors = ref([])
const applications = ref([])
const msg = ref('')
const msgColor = ref('')
const FSD_LABELS = {0:'SUSPENDED',1:'OBS',2:'S1',3:'S2',4:'S3',5:'C1',6:'C2',7:'C3',8:'I1',9:'I2',10:'I3',11:'SUP',12:'ADM'}
function fsdLabel(l) { return FSD_LABELS[l] || `Lv${l}` }
function statusLabel(s) { return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[s] || s }

async function load() {
  try {
    const [i, a] = await Promise.all([instructorApi().list(), instructorApi().myApplications()])
    instructors.value = i.data
    applications.value = a.data
  } catch {}
}

async function apply(inst) {
  if (!confirm(`确定向教员 ${inst.cid} (${inst.name || ''}) 发出申请？`)) return
  try {
    await instructorApi().apply({ targetCid: inst.cid })
    msg.value = '申请已提交！'; msgColor.value = 'var(--c-success)'
    load()
  } catch (e) { msg.value = e.message || '申请失败'; msgColor.value = 'var(--c-danger)' }
}

onMounted(load)
</script>

<style scoped>
.app-item { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--glass-border); }
.app-item:last-child { border-bottom:none; }
.status-tag { display:inline-flex; padding:2px 8px; border-radius:8px; font-size:11px; font-weight:600; }
.status-pending { background:#e8eaf6; color:#283593; }
.status-approved { background:#e8f5e9; color:#2e7d32; }
.status-rejected { background:#fce4ec; color:#b71c1c; }
.fsd-badge { display:inline-flex; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
.fsd-8, .fsd-9, .fsd-10 { background:#e8eaf6; color:#283593; }
.fsd-11, .fsd-12 { background:#fce4ec; color:#c62828; }
.font-bold { font-weight:600; }
.text-sm { font-size:12px; }
.text-muted { color:var(--c-text-muted); }
.mt-md { margin-top:12px; }
</style>
