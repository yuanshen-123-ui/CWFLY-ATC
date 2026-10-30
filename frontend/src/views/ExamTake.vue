<template>
  <div v-if="exam">
    <div class="page-title">{{ exam.title }}</div>
    <div class="page-desc">{{ exam.description }}</div>
    <div v-for="(q,i) in questions" :key="q.id" class="card" style="margin-bottom:12px;">
      <div style="margin-bottom:8px;"><strong>{{ i+1 }}. {{ q.content }}</strong></div>
      <div v-for="(opt,j) in JSON.parse(q.options||'[]')" :key="j" style="margin-bottom:4px;">
        <label style="cursor:pointer;"><input type="radio" :name="'q'+q.id" :value="opt.charAt(0)" v-model="answers[q.id]" /> {{ opt }}</label>
      </div>
    </div>
    <div class="flex gap-sm">
      <button class="btn btn-primary" @click="submit">提交答卷</button>
    </div>
    <div v-if="result" class="card mt-md">
      <p>得分: <strong>{{ result.score }}/{{ result.total }}</strong> ({{ result.percentage }}%)</p>
      <p :style="{color: result.passed ? 'var(--c-success)' : 'var(--c-danger)', fontWeight: 700}">{{ result.passed ? '通过' : '未通过' }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { examApi } from '@/api/index.js'
const route = useRoute()
const exam = ref(null)
const questions = ref([])
const answers = ref({})
const result = ref(null)
onMounted(async () => {
  const r = await examApi().get(route.params.id)
  exam.value = r.data
  questions.value = r.data.questions || []
})
async function submit() {
  const ans = Object.entries(answers.value).map(([k,v]) => ({qId:Number(k),answer:v}))
  const r = await examApi().submit(route.params.id, { answers: ans })
  result.value = r.data
}
</script>
