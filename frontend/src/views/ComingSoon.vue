<template>
  <div>
    <div class="page-title">理论学习</div>
    <div class="page-desc">浏览教学资料和培训视频</div>

    <!-- 筛选 -->
    <div class="card" style="display:flex; gap:8px; padding:12px 16px; margin-bottom:12px; flex-wrap:wrap;">
      <button class="btn btn-sm" :class="tab==='all'?'btn-primary':'btn-outline'" @click="tab='all'">全部</button>
      <button class="btn btn-sm" :class="tab==='article'?'btn-primary':'btn-outline'" @click="tab='article'">文章</button>
      <button class="btn btn-sm" :class="tab==='document'?'btn-primary':'btn-outline'" @click="tab='document'">文档</button>
      <button class="btn btn-sm" :class="tab==='video'?'btn-primary':'btn-outline'" @click="tab='video'">视频</button>
    </div>

    <!-- 知识列表 -->
    <div v-if="filtered.length === 0" class="card" style="text-align:center; padding:40px; color:var(--c-text-muted);">
      暂无教学资料
    </div>
    <div v-else class="knowledge-grid">
      <div v-for="item in filtered" :key="item.id" class="card knowledge-card">
        <div class="card-type">
          <span class="badge" :class="item.type === 'video' ? 'badge-info' : item.type === 'document' ? 'badge-primary' : 'badge-warning'">
            {{ item.typeLabel }}
          </span>
        </div>
        <h4 class="card-title">{{ item.title }}</h4>
        <p class="card-desc text-sm text-muted">{{ item.desc }}</p>
        <div class="card-actions">
          <a v-if="item.content?.startsWith('/uploads') || item.content?.startsWith('http')" :href="item.content" target="_blank" class="btn btn-primary btn-sm">查看</a>
          <button v-else class="btn btn-outline btn-sm" @click="viewContent(item)">阅读</button>
        </div>
      </div>
    </div>

    <!-- 文章内容预览弹窗 -->
    <div v-if="viewing" class="modal-overlay" @click.self="viewing=null">
      <div class="modal card" style="padding:24px; width:640px; max-height:80vh; overflow-y:auto;">
        <h3 style="margin-bottom:12px;">{{ viewing.title }}</h3>
        <div class="markdown-content" style="white-space:pre-wrap; font-size:13px; line-height:1.7;">{{ viewing.content }}</div>
        <button class="btn btn-outline btn-sm" style="margin-top:16px;" @click="viewing=null">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { articleApi, videoApi } from '@/api/index.js'

const tab = ref('all')
const articles = ref([])
const videos = ref([])
const viewing = ref(null)

const filtered = computed(() => {
  let items = []
  // 文章
  articles.value.forEach(a => {
    const isVideo = a.summary?.startsWith('[视频]')
    const isFile = a.summary?.startsWith('[文件]')
    items.push({
      id: `a-${a.id}`, title: a.title,
      type: isVideo ? 'video' : isFile ? 'document' : 'article',
      typeLabel: isVideo ? '视频' : isFile ? '文档' : '文章',
      desc: a.summary?.replace(/^\[(视频|文件)\]\s*/, '') || a.category || '',
      content: a.content
    })
  })
  if (tab.value === 'all') return items
  return items.filter(i => i.type === tab.value)
})

function viewContent(item) {
  viewing.value = item
}

onMounted(async () => {
  try {
    const [aRes] = await Promise.all([articleApi().list({ all: 1 })])
    articles.value = aRes.data || []
  } catch {}
})
</script>

<style scoped>
.knowledge-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:12px; }
.knowledge-card { padding:16px; display:flex; flex-direction:column; }
.card-type { margin-bottom:8px; }
.card-title { font-size:14px; font-weight:600; margin-bottom:6px; line-height:1.4; }
.card-desc { flex:1; margin-bottom:12px; }
.card-actions { display:flex; gap:8px; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; z-index:100; }
.modal { max-width:90vw; }
.text-sm { font-size:12px; }
.text-muted { color:var(--c-text-muted); }
</style>
