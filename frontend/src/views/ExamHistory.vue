<template>
  <div>
    <div class="page-title">考核记录</div>
    <div class="page-desc">查看历史考核结果</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>考试</th><th>得分</th><th>结果</th><th>时间</th></tr></thead>
      <tbody>
        <tr v-for="a in list" :key="a.id">
          <td>{{ a.exam?.title || '考试#'+a.examId }}</td>
          <td>{{ a.score }}/{{ a.total }} ({{ a.total>0?Math.round(a.score/a.total*100):0 }}%)</td>
          <td><span class="badge" :class="a.passed?'badge-success':'badge-danger'">{{ a.passed?'通过':'未通过' }}</span></td>
          <td class="text-sm text-muted">{{ a.finishedAt?.slice(0,16)||'-' }}</td>
        </tr>
      </tbody>
    </table></div></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { examApi } from '@/api/index.js'
const list = ref([])
onMounted(async () => { try { const r = await examApi().attempts(); list.value = r.data } catch {} })
</script>
