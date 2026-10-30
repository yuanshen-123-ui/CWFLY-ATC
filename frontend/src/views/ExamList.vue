<template>
  <div>
    <div class="page-title">理论考核</div>
    <div class="page-desc">选择考试并开始答题</div>
    <div v-if="!list.length" class="card text-muted text-sm">暂无可用考试</div>
    <div v-for="e in list" :key="e.id" class="card" style="margin-bottom:12px;">
      <div class="flex justify-between items-center flex-wrap" style="gap:8px;">
        <div><strong>{{ e.title }}</strong><div class="text-xs text-muted mt-sm">{{ e.description }} · {{ e.questionIds.length }}题 · {{ e.duration }}分钟</div></div>
        <router-link :to="'/exam/'+e.id" class="btn btn-primary btn-sm">开始考试</router-link>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { examApi } from '@/api/index.js'
const list = ref([])
onMounted(async () => { try { const r = await examApi().list(); list.value = r.data } catch {} })
</script>
