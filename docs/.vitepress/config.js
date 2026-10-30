import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ATC Center',
  description: 'CW 模拟飞行管制员中心 — 管制资源与培训',
  lang: 'zh-CN',
  base: '/docs/',
  appearance: false,

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/favicon.jpg' }],
    ['meta', { name: 'theme-color', content: '#0071e3' }],
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: '管制指南', link: '/guide/' },
      { text: '频率列表', link: '/frequency/' },
      { text: '培训中心', link: '/training/' },
      { text: '管制排班', link: '/guide/schedule' },
      { text: '登录', link: '/login' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '管制指南',
          items: [
            { text: '概述', link: '/guide/' },
            { text: '快速上手', link: '/guide/quickstart' },
            { text: '席位操作', link: '/guide/position' },
            { text: '陆空通话', link: '/guide/radiotelephony' },
            { text: '间隔标准', link: '/guide/separation' },
            { text: '协调移交', link: '/guide/handoff' },
            { text: '特情处理', link: '/guide/emergency' },
            { text: '管制排班', link: '/guide/schedule' },
          ],
        },
      ],
      '/frequency/': [
        {
          text: '频率列表',
          items: [
            { text: '概述', link: '/frequency/' },
            { text: '中国机场', link: '/frequency/china' },
            { text: '区域频率', link: '/frequency/area' },
          ],
        },
      ],
      '/sop/': [
        {
          text: '标准操作程序',
          items: [
            { text: '概述', link: '/sop/' },
            { text: '地面管制 SOP', link: '/sop/ground' },
            { text: '塔台管制 SOP', link: '/sop/tower' },
            { text: '进近管制 SOP', link: '/sop/approach' },
            { text: '区域管制 SOP', link: '/sop/center' },
          ],
        },
      ],
      '/training/': [
        {
          text: '培训中心',
          items: [
            { text: '概述', link: '/training/' },
            { text: '培训大纲', link: '/training/syllabus' },
            { text: '理论课程', link: '/training/theory' },
            { text: '实操考核', link: '/training/practical' },
            { text: '学习资源', link: '/training/resources' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: '#' },
    ],

    footer: {
      message: 'CW 模拟飞行 · 管制员中心',
      copyright: 'Copyright © 2026 CW 模拟飞行连飞平台',
    },

    search: { provider: 'local' },

    lastUpdated: false,
  },

  markdown: {
    lineNumbers: true,
  },
})
