<template>
  <div>
    <div class="flex justify-between items-center mb-md">
      <div><div class="page-title">题库管理</div><div class="page-desc">管理考核题目</div></div>
      <button class="btn btn-primary btn-sm" @click="showForm=true">+ 添加题目</button>
    </div>
    <div v-if="showForm" class="card mb-md">
      <textarea v-model="form.content" class="mb-md" placeholder="题目内容" style="min-height:60px;"></textarea>
      <div v-for="(o,i) in form.options" :key="i" class="mb-md">
        <input v-model="form.options[i]" :placeholder="'选项 ' + String.fromCharCode(65+i)" />
      </div>
      <div class="mb-md">
        <label class="text-sm font-bold mb-sm" style="display:block;">正确答案</label>
        <select v-model="form.answer" class="input" style="width:100px;">
          <option value="">选择</option><option v-for="(o,i) in form.options" :key="i" :value="String.fromCharCode(65+i)">{{ String.fromCharCode(65+i) }}</option>
        </select>
      </div>
      <div class="flex gap-sm"><button class="btn btn-primary btn-sm" @click="create">添加</button><button class="btn btn-outline btn-sm" @click="showForm=false">取消</button></div>
    </div>
    <div class="card"><table><thead><tr><th>题目</th><th>答案</th><th>操作</th></tr></thead>
      <tbody><tr v-for="q in list" :key="q.id"><td class="text-sm">{{ q.content?.slice(0,60) }}</td><td>{{ q.answer }}</td>
        <td><button class="btn btn-danger btn-sm" @click="del(q)">删除</button></td></tr>
      </tbody>
    </table></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { questionApi } from '@/api/index.js'
const list = ref([]); const showForm = ref(false)
const form = ref({ content:'', options:['','','',''], answer:'', category:'', difficulty:1, explain:'' })
onMounted(load)
async function load() { try { const r = await questionApi().list(); list.value = r.data } catch {} }
async function create() {
  try { await questionApi().create(form.value); showForm.value=false; form.value={content:'',options:['','','',''],answer:'',category:'',difficulty:1,explain:''}; load() }
  catch(e) { alert(e.message) }
}
async function del(q) { if(confirm('删除?')) { await questionApi().remove(q.id); load() } }
</script>
