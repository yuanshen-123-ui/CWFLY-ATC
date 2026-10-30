<template>
  <div>
    <div class="page-title">预约管理</div>
    <div class="page-desc">管理所有模拟机预约</div>
    <div class="card"><table><thead><tr><th>CID</th><th>类型</th><th>时间</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="s in list" :key="s.id">
          <td class="font-bold">{{ s.cid }}</td>
          <td><span class="badge" :class="s.type==='exam'?'badge-danger':'badge-info'">{{ s.type==='exam'?'考核':'训练' }}</span></td>
          <td class="text-sm">{{ s.startTime?.slice(0,16) }}</td>
          <td><span class="badge" :class="statusBadge(s.status)">{{ statusLabel(s.status) }}</span></td>
          <td>
            <div v-if="s.status==='pending'" class="flex gap-sm">
              <button class="btn btn-primary btn-sm" @click="update(s.id,'approved')">通过</button>
              <button class="btn btn-danger btn-sm" @click="update(s.id,'cancelled')">拒绝</button>
            </div>
            <span v-else class="text-sm text-muted">已处理</span>
          </td>
        </tr>
      </tbody>
    </table></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { simApi, adminApi } from '@/api/index.js'
const list = ref([])
function statusLabel(s) { return {pending:'待审核',approved:'已通过',completed:'已完成',cancelled:'已取消'}[s]||s }
function statusBadge(s) { return {pending:'badge-warning',approved:'badge-success',completed:'badge-info',cancelled:'badge-default'}[s]||'badge-default' }
onMounted(load)
async function load() { try { const r = await adminApi().allSimSessions(); list.value = r.data } catch {} }
async function update(id, status) { await simApi().updateStatus(id, {status}); load() }
</script>
