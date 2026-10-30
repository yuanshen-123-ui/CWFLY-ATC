<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div><div class="page-title">考试管理</div><div class="page-desc">管理考核试卷</div></div>
      <button class="btn btn-primary btn-sm" @click="showForm=true">+ 新建</button>
    </div>
    <div v-if="showForm" class="card mb-md">
      <input v-model="form.title" class="mb-md" placeholder="考试标题" />
      <div class="mb-md"><label class="text-sm font-bold mb-sm">题目ID（逗号分隔）</label>
        <input v-model="form.qIds" placeholder="如 1,2,3,4" /></div>
      <div class="flex gap-sm"><button class="btn btn-primary btn-sm" @click="create">创建</button><button class="btn btn-outline btn-sm" @click="showForm=false">取消</button></div>
    </div>
    <div class="card"><table><thead><tr><th>标题</th><th>题目数</th><th>及格分</th><th>操作</th></tr></thead>
      <tbody><tr v-for="e in list" :key="e.id"><td>{{ e.title }}</td><td>{{ e.questionIds?.length||0 }}</td><td>{{ e.passingScore }}</td>
        <td><button class="btn btn-danger btn-sm" @click="del(e)">删除</button></td></tr>
      </tbody>
    </table></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { examApi } from '@/api/index.js'
const list = ref([]); const showForm = ref(false)
const form = ref({ title:'', qIds:'', description:'', passingScore:70, duration:60, category:'' })
onMounted(load)
async function load() { try { const r = await examApi().list(); list.value = r.data } catch {} }
async function create() {
  try { await examApi().create({...form.value, questionIds: form.value.qIds.split(',').map(Number).filter(Boolean)}); showForm.value=false; load() }
  catch(e) { alert(e.message) }
}
async function del(e) { if(confirm('删除?')) { await examApi().remove(e.id); load() } }
</script>
