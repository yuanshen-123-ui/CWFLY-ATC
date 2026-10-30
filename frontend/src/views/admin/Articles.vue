<template>
  <div>
    <div class="flex justify-between items-center mb-md" style="flex-wrap:wrap; gap:8px;">
      <div><div class="page-title">理论知识管理</div><div class="page-desc">上传 Word / PDF / Markdown / TXT / MP4 等教学资料</div></div>
      <div class="flex gap-sm">
        <button class="btn btn-outline btn-sm" @click="showTextForm=!showTextForm">{{ showTextForm ? '收起' : '写文章' }}</button>
        <button class="btn btn-primary btn-sm" @click="openUpload">+ 上传文件</button>
      </div>
    </div>

    <!-- Markdown 文章编辑 -->
    <div v-if="showTextForm" class="card mb-md" style="padding:16px;">
      <h3 style="font-size:14px; margin-bottom:12px;">新建 Markdown 文章</h3>
      <input v-model="textForm.title" class="mb-md" placeholder="标题" />
      <textarea v-model="textForm.content" class="mb-md" placeholder="内容 (Markdown)" style="min-height:120px; width:100%;"></textarea>
      <div class="flex gap-sm"><button class="btn btn-primary btn-sm" @click="createText">发布</button><button class="btn btn-outline btn-sm" @click="showTextForm=false">取消</button></div>
    </div>

    <!-- 文件上传弹窗 -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload=false">
      <div class="modal card" style="padding:24px; width:420px;">
        <h3 style="margin-bottom:16px;">上传教学资料</h3>
        <div class="form-group mb-md">
          <label>标题（可选，默认使用文件名）</label>
          <input v-model="uploadForm.title" class="input" placeholder="可选" />
        </div>
        <div class="form-group mb-md">
          <label>选择文件</label>
          <input ref="fileInput" type="file" class="input" accept=".doc,.docx,.pdf,.md,.txt,.mp4,.mp4a,.webm,.ogg" @change="onFileChange" />
          <p class="text-xs text-muted mt-sm">支持 Word(.doc/.docx)、PDF、Markdown(.md)、TXT、MP4 等格式</p>
        </div>
        <div class="flex gap-sm" style="justify-content:flex-end;">
          <button class="btn btn-outline btn-sm" @click="showUpload=false">取消</button>
          <button class="btn btn-primary btn-sm" :disabled="!selectedFile" @click="uploadFile">上传</button>
        </div>
        <p v-if="uploadMsg" class="text-sm mt-md" :style="{color:uploadMsgColor}">{{ uploadMsg }}</p>
      </div>
    </div>

    <!-- 知识列表 -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>标题</th><th>类型</th><th>来源</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in list" :key="a.id">
              <td>
                <a v-if="a.summary?.startsWith('[视频]') || a.summary?.startsWith('[文件]')" :href="a.content" target="_blank" class="link">{{ a.title }}</a>
                <span v-else>{{ a.title }}</span>
              </td>
              <td>
                <span class="badge" :class="a.summary?.startsWith('[视频]') ? 'badge-info' : 'badge-primary'">
                  {{ a.summary?.startsWith('[视频]') ? '视频' : a.summary?.startsWith('[文件]') ? '文档' : '文章' }}
                </span>
              </td>
              <td class="text-sm text-muted">{{ a.category || '-' }}</td>
              <td><button class="btn btn-danger btn-sm" @click="del(a)">删除</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { articleApi } from '@/api/index.js'
import api from '@/api/index.js'

const list = ref([])
const showTextForm = ref(false)
const showUpload = ref(false)
const selectedFile = ref(null)
const uploadMsg = ref('')
const uploadMsgColor = ref('')
const fileInput = ref(null)
const textForm = ref({ title:'', content:'', category:'' })
const uploadForm = ref({ title:'' })

onMounted(load)
async function load() { try { const r = await articleApi().list({ all:1 }); list.value = r.data } catch {} }
async function createText() {
  try { await articleApi().create(textForm.value); showTextForm.value=false; textForm.value={title:'',content:'',category:''}; load() }
  catch(e) { alert(e.message) }
}
function openUpload() { showUpload.value=true; uploadForm.value={title:''}; selectedFile.value=null; uploadMsg.value='' }
function onFileChange(e) { selectedFile.value = e.target.files[0] || null }
async function uploadFile() {
  if (!selectedFile.value) return
  const fd = new FormData()
  fd.append('file', selectedFile.value)
  if (uploadForm.value.title) fd.append('title', uploadForm.value.title)
  try {
    const res = await api.post('/articles/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    showUpload.value = false
    uploadMsg.value = ''; uploadMsgColor.value = ''
    load()
  } catch(e) { uploadMsg.value = e.message || '上传失败'; uploadMsgColor.value = 'var(--c-danger)' }
}
async function del(a) { if(confirm('删除?')) { await articleApi().remove(a.id); load() } }
</script>
<style scoped>
.flex { display:flex; align-items:center; }
.gap-sm { gap:8px; }
.mb-md { margin-bottom:12px; }
.mt-sm { margin-top:4px; }
.text-xs { font-size:11px; }
.text-sm { font-size:12px; }
.text-muted { color:var(--c-text-muted); }
.link { color:var(--c-primary); text-decoration:none; }
.link:hover { text-decoration:underline; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; z-index:100; }
.modal { max-width:90vw; }
.form-group label { display:block; font-size:12px; font-weight:600; color:var(--c-text-secondary); margin-bottom:4px; }
</style>
