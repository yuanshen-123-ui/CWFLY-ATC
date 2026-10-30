<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style>
/* ============================
   CW 模拟飞行连飞平台 — 全局样式
   玻璃拟态风格
   ============================ */

:root {
  /* Apple 风格主色调 — 更温润的蓝 */
  --c-primary: #0071e3;
  --c-primary-dark: #0062c4;
  --c-primary-light: rgba(0, 113, 227, 0.1);
  --c-accent: #ff9f0a;

  /* 中立色 — 更通透 */
  --c-white: rgba(255, 255, 255, 0.85);
  --c-bg: transparent;
  --c-bg-card: rgba(255, 255, 255, 0.4);
  --c-border: rgba(255, 255, 255, 0.25);
  --c-border-light: rgba(255, 255, 255, 0.15);

  /* 文字 — 更高对比度，更清晰 */
  --c-text: #1d1d1f;
  --c-text-secondary: #424245;
  --c-text-muted: #86868b;

  /* Apple 系统状态色 */
  --c-success: #30d158;
  --c-warning: #ff9f0a;
  --c-danger: #ff453a;
  --c-info: #64d2ff;

  /* 尺寸 — Apple 式圆角 */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
  --shadow-xl: 0 24px 64px rgba(0,0,0,.12);
  --transition: .35s cubic-bezier(0.25, 0.1, 0.25, 1);
  --header-h: 60px;
  --sidebar-w: 220px;

  /* Apple 玻璃效果 — 多层叠加更真实 */
  --glass-bg: rgba(255, 255, 255, 0.18);
  --glass-bg-strong: rgba(255, 255, 255, 0.48);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-strong: rgba(255, 255, 255, 0.35);
  --glass-blur: 20px;
  --glass-blur-lg: 32px;
  --glass-saturate: 1.4;
}

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.47059;
  color: var(--c-text);
  background: url('/bg-home.png') center / cover no-repeat fixed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

#app {
  min-height: 100vh;
  background: transparent;
}

a { color: var(--c-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
.btn-xs { font-size:11px;padding:3px 8px;border-radius:5px; }

/* ---------- 通用卡片（Apple 玻璃效果） ---------- */
.card {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition);
}
.card--hover:hover {
  box-shadow: var(--shadow-md);
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

/* ---------- 按钮（Apple 风格） ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 980px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition);
  text-decoration: none;
  line-height: 1.4;
  letter-spacing: -.01em;
}
.btn:hover { text-decoration: none; }
.btn-primary {
  background: var(--c-primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--c-primary-dark);
}
.btn-outline {
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(12px) saturate(var(--glass-saturate));
  border-color: var(--glass-border);
  color: var(--c-text);
}
.btn-outline:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
  background: rgba(0, 113, 227, 0.1);
}
.btn-sm { padding: 6px 16px; font-size: 13px; }
.btn-block { width: 100%; }

/* ---------- 输入框（Apple 风格） ---------- */
.input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  font-size: 14px;
  color: var(--c-text);
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(12px) saturate(var(--glass-saturate));
  outline: none;
  transition: all var(--transition);
}
.input::placeholder { color: var(--c-text-muted); }
.input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
  background: rgba(255, 255, 255, 0.4);
}
.input-error { border-color: var(--c-danger); }

/* ---------- 原生表单元素 ---------- */
input:not(.input), select, textarea {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  font-size: 14px;
  color: var(--c-text);
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(12px) saturate(var(--glass-saturate));
  outline: none;
  transition: all var(--transition);
}
input:not(.input):focus, select:focus, textarea:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
  background: rgba(255, 255, 255, 0.4);
}
textarea { resize: vertical; min-height: 80px; }

/* ---------- 表格（Apple 风格） ---------- */
.table-wrap { overflow-x: auto; }
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
  font-size: 14px;
}
th {
  font-weight: 600;
  color: var(--c-text-secondary);
  background: rgba(255,255,255,.25);
  font-size: 12px;
  letter-spacing: .03em;
  text-transform: uppercase;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,.15); }

/* ---------- 徽章 ---------- */
.badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .02em;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.badge-success { background: rgba(48,209,88,.15); color: #248a3d; border: 1px solid rgba(48,209,88,.25); }
.badge-warning { background: rgba(255,159,10,.15); color: #b86500; border: 1px solid rgba(255,159,10,.25); }
.badge-danger  { background: rgba(255,69,58,.15); color: #bf2d24; border: 1px solid rgba(255,69,58,.25); }
.badge-info    { background: rgba(100,210,255,.15); color: #0077b5; border: 1px solid rgba(100,210,255,.25); }
.badge-default { background: var(--glass-bg); color: var(--c-text-secondary); border: 1px solid var(--glass-border); }

/* ---------- 工具类 ---------- */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.gap-xs { gap: 4px; }
.gap-sm { gap: 8px; }
.gap-md { gap: 16px; }
.gap-lg { gap: 24px; }
.flex-1 { flex: 1; }
.w-full { width: 100%; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-secondary { color: var(--c-text-secondary); }
.text-muted { color: var(--c-text-muted); }
.text-sm { font-size: 13px; }
.text-xs { font-size: 12px; }
.font-bold { font-weight: 600; }
.mt-sm { margin-top: 8px; }
.mt-md { margin-top: 16px; }
.mt-lg { margin-top: 24px; }
.mb-sm { margin-bottom: 8px; }
.mb-md { margin-bottom: 16px; }
.mb-lg { margin-bottom: 24px; }
.p-sm { padding: 8px; }
.p-md { padding: 16px; }
.p-lg { padding: 24px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- 页面标题 ---------- */
.page-title { font-size: 22px; font-weight: 700; margin-bottom: 2px; color: var(--c-text); }
.page-desc { font-size: 13px; color: var(--c-text-secondary); margin-bottom: 20px; }

/* ---------- 页面标题（Apple 风格，与主站一致） ---------- */
.page-header { margin-bottom: 28px; }
.page-header h1 { font-size: 28px; font-weight: 700; letter-spacing: -.02em; }
.page-header p { color: var(--c-text-secondary); margin-top: 4px; font-size: 15px; }

/* ---------- 滚动条 ---------- */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.25); }

/* ---------- 动画 ---------- */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn .35s ease both; }

/* ---------- 玻璃工具类（Apple 风格） ---------- */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
}
.glass-strong {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border-strong);
}

/* ---------- ATC 特定样式 ---------- */
.btn-danger { background: var(--c-danger); color: #fff; }
.btn-danger:hover { opacity: .85; }

/* ---------- 自适应 ---------- */
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
  :root { --sidebar-w: 200px; }
}

@media (max-width: 768px) {
  .page-header h1 { font-size: 22px; }
  .page-header p { font-size: 14px; }
  .page-title { font-size: 18px; }
  .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
  .hide-mobile { display:none!important; }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr 1fr !important; gap: 1px; }
  .page-title { font-size: 16px; }
  .page-desc { font-size: 12px; }
}
</style>
