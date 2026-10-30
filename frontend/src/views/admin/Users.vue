<template>
  <div>
    <div class="page-title">用户管理</div>
    <div class="page-desc">管理 ATC 用户扩展信息，分配教员</div>

    <!-- 工具栏 -->
    <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; margin-bottom:12px;">
      <div class="flex gap-sm" style="align-items:center;">
        <span class="text-sm text-muted">共 {{ list.length }} 人</span>
        <span class="text-sm text-muted">|</span>
        <span class="text-sm text-muted">教员 {{ instructors.length }} 人</span>
      </div>
      <button class="btn btn-outline btn-sm" @click="syncUsers">同步主站用户</button>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>CID</th>
              <th>管制等级</th>
              <th>分配教员</th>
              <th>在线时长</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in list" :key="u.id">
              <td class="font-bold">{{ u.cid }}</td>
              <td>
                <select v-model.number="u.rating" class="input input-sm" style="width:auto;">
                  <option value="0">SUSPENDED</option>
                  <option value="1">OBS</option>
                  <option value="2">S1</option>
                  <option value="3">S2</option>
                  <option value="4">S3</option>
                  <option value="5">C1</option>
                  <option value="6">C2</option>
                  <option value="7">C3</option>
                  <option value="8">I1</option>
                  <option value="9">I2</option>
                  <option value="10">I3</option>
                  <option value="11">SUP</option>
                  <option value="12">ADM</option>
                </select>
              </td>
              <td>
                <select v-model="u.instructor" class="input input-sm" style="width:100px;">
                  <option value="">未分配</option>
                  <option v-for="inst in instructors" :key="inst.cid" :value="inst.cid">
                    {{ inst.cid }} {{ inst.name || '' }}
                  </option>
                </select>
              </td>
              <td><input v-model.number="u.totalHours" type="number" step="0.1" class="input input-sm" style="width:70px;" /></td>
              <td><button class="btn btn-primary btn-sm" @click="save(u)">保存</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 批量分配教员 -->
    <div class="card" style="margin-top:12px; padding:16px;">
      <h3 style="font-size:14px; margin-bottom:12px;">批量分配教员</h3>
      <div class="flex gap-sm" style="align-items:flex-end; flex-wrap:wrap;">
        <div class="form-group">
          <label>选择教员</label>
          <select v-model="batchInstructor" class="input">
            <option value="">— 请选择 —</option>
            <option v-for="inst in instructors" :key="inst.cid" :value="inst.cid">
              {{ inst.cid }} ({{ inst.name || '' }}) - 等级 {{ inst.rating }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>目标用户（按住 Ctrl 多选）</label>
          <select v-model="batchUsers" multiple class="input" style="height:80px;">
            <option v-for="u in uninstructedUsers" :key="u.cid" :value="u.cid">
              {{ u.cid }} - 等级 {{ u.rating }}
            </option>
          </select>
        </div>
        <button class="btn btn-primary btn-sm" :disabled="!batchInstructor || batchUsers.length===0" @click="batchAssign">批量分配</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api/index.js'
const list = ref([])
const batchInstructor = ref('')
const batchUsers = ref([])

/** 所有教员（rating >= 8 即 I1 以上） */
const instructors = computed(() => {
  return list.value.filter(u => u.rating >= 8)
    .map(u => ({ cid: u.cid, rating: u.rating, name: u.name || '' }))
})

/** 未分配教员且不是教员的用户 */
const uninstructedUsers = computed(() => {
  return list.value.filter(u => !u.instructor && u.rating < 8)
})

onMounted(load)

async function load() {
  try {
    const r = await adminApi().atcUsers()
    list.value = r.data
  } catch {}
}

async function save(u) {
  try {
    await adminApi().updateAtcUser(u.cid, { rating: u.rating, instructor: u.instructor, totalHours: u.totalHours })
  } catch(e) { alert(e.message) }
}

async function syncUsers() {
  try {
    const r = await adminApi().syncAtcUsers()
    alert(`同步完成：共 ${r.data.total} 人，新增 ${r.data.created}，更新 ${r.data.updated}`)
    load()
  } catch(e) { alert(e.message || '同步失败') }
}

async function batchAssign() {
  if (!batchInstructor.value || batchUsers.value.length === 0) return
  if (!confirm(`确定将 ${batchUsers.value.length} 人分配给教员 ${batchInstructor.value}？`)) return
  try {
    for (const cid of batchUsers.value) {
      await adminApi().updateAtcUser(cid, { instructor: batchInstructor.value })
    }
    alert('批量分配完成')
    batchUsers.value = []
    load()
  } catch(e) { alert(e.message) }
}
</script>

<style scoped>
.flex { display:flex; align-items:center; }
.gap-sm { gap:8px; }
.input-sm { font-size:12px; padding:4px 8px; }
.text-sm { font-size:12px; }
.text-muted { color:var(--c-text-muted); }
.form-group label { display:block; font-size:12px; font-weight:600; color:var(--c-text-secondary); margin-bottom:4px; }
</style>
