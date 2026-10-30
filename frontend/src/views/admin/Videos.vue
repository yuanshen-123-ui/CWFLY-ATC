<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div><div class="page-title">视频管理</div><div class="page-desc">管理培训视频</div></div>
      <button class="btn btn-primary btn-sm" @click="showForm=true">+ 添加</button>
    </div>
    <div v-if="showForm" class="card mb-md">
      <input v-model="form.title" class="mb-md" placeholder="标题" />
      <input v-model="form.url" class="mb-md" placeholder="视频链接" />
      <div class="flex gap-sm"><button class="btn btn-primary btn-sm" @click="create">添加</button><button class="btn btn-outline btn-sm" @click="showForm=false">取消</button></div>
    </div>
    <div class="card"><table><thead><tr><th>标题</th><th>链接</th><th>操作</th></tr></thead>
      <tbody><tr v-for="v in list" :key="v.id"><td>{{ v.title }}</td><td class="text-sm text-muted">{{ v.url?.slice(0,40) }}</td>
        <td><button class="btn btn-danger btn-sm" @click="del(v)">删除</button></td></tr>
      </tbody>
    </table></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { videoApi } from '@/api/index.js'
const list = ref([]); const showForm = ref(false)
const form = ref({ title:'', url:'', description:'', category:'' })
onMounted(load)
async function load() { try { const r = await videoApi().list({ all:1 }); list.value = r.data } catch {} }
async function create() { try { await videoApi().create(form.value); showForm.value=false; load() } catch(e) { alert(e.message) } }
async function del(v) { if(confirm('删除?')) { await videoApi().remove(v.id); load() } }
</script>
