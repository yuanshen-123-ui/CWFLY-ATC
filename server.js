import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { createHmac, timingSafeEqual } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.ATC_PORT || 5175

// ========== 配置 ==========
// 主后端 API 地址
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000'
// 是否启用登录保护（开发环境可关闭）
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false'

// ========== 主站 JWT 验签（2026-08-20 安全加固） ==========
// 背景：ATC 页面的 token 由主站签发（主站 JWT_SECRET + 24h 时段轮换 + 7 天验证窗口），
//       旧实现只解 base64 不验签 → 任何人可伪造 token 通过 ATC 登录保护（JWT 伪造漏洞）。
// 修复：复用主站的密钥派生逻辑做真正验签（HS256 白名单）。
let mainJwtSecret = ''
function loadMainJwtSecret() {
  if (mainJwtSecret) return mainJwtSecret
  // 优先环境变量，其次读主站 backend/.env
  if (process.env.MAIN_JWT_SECRET) { mainJwtSecret = process.env.MAIN_JWT_SECRET; return mainJwtSecret }
  try {
    const envPath = path.resolve(__dirname, '../backend/.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const m = content.match(/^JWT_SECRET=(.+)$/m)
      if (m) { mainJwtSecret = m[1].trim().replace(/^["']|["']$/g, ''); return mainJwtSecret }
    }
  } catch (e) { /* ignore */ }
  return ''
}

function derivePeriodKey(secret, period) {
  return createHmac('sha256', secret).update(`jwt-period-${period}`).digest('hex')
}

/** 自实现 HS256 验签（不依赖 jsonwebtoken，避免 atc-center 根目录引入新依赖） */
function verifyHmacJwt(token, key) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, p, sig] = parts
  try {
    // 仅接受 HS256
    const header = JSON.parse(Buffer.from(h, 'base64url').toString())
    if (header.alg !== 'HS256') return null
    // 重算签名 + 常量时间比较（防时序攻击）
    const expected = createHmac('sha256', key).update(`${h}.${p}`).digest('base64url')
    const actual = Buffer.from(sig, 'base64url')
    const expBuf = Buffer.from(expected, 'base64url')
    if (expBuf.length !== actual.length || !timingSafeEqual(expBuf, actual)) return null
    // 解 payload + 过期检查
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
    if (payload.exp && Date.now() >= payload.exp * 1000) return null
    return payload
  } catch {
    return null
  }
}

/** 用主站密钥环验证 token（当前时段 + 过去 7 天窗口） */
function verifyWithMainSecret(token) {
  const secret = loadMainJwtSecret()
  if (!secret || secret.length < 32) return null
  const start = new Date('2024-01-01T00:00:00Z').getTime()
  const current = Math.floor((Date.now() - start) / (24 * 3600 * 1000))
  for (let i = 0; i < 8; i++) {
    const decoded = verifyHmacJwt(token, derivePeriodKey(secret, current - i))
    if (decoded) return decoded
  }
  return null
}

// VitePress 构建输出目录
const DIST_DIR = path.resolve(__dirname, 'docs/.vitepress/dist')

// ========== 中间件 ==========
// API 代理由 nginx 直接转发到主后端，不再经过 ATC Express 的 http-proxy-middleware
// 因此可以安全地全局使用 express.json()
app.use(express.json())
app.use(cookieParser())

// ========== 认证中间件 ==========
const AUTH_TOKEN_KEY = 'atc_token'

function isAuthenticated(req) {
  const token = req.cookies?.[AUTH_TOKEN_KEY] || req.headers?.authorization?.replace('Bearer ', '')
  if (!token) return false

  // 安全加固（2026-08-20）：必须通过主站 JWT 签名验证（HS256 白名单 + 密钥轮换窗口）
  const decoded = verifyWithMainSecret(token)
  if (!decoded) return false
  req.user = decoded
  return true
}

// ========== Cookie 设置辅助（必须在 API 代理之前注册） ==========
// 这些端点由 ATC Center 本地处理，不能被代理到主后端
app.post('/api/auth/login/setcookie', (req, res) => {
  const { token, user } = req.body
  if (!token) {
    return res.status(400).json({ success: false, message: '缺少 token' })
  }

  res.cookie(AUTH_TOKEN_KEY, token, {
    httpOnly: true,
    secure: false, // 本地开发设为 false
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
  })

  // 同时也将用户信息存入 cookie（非敏感信息）
  if (user) {
    res.cookie('atc_user', JSON.stringify(user), {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
  }

  res.json({ success: true })
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(AUTH_TOKEN_KEY)
  res.clearCookie('atc_user')
  res.json({ success: true })
})

// ========== API 代理由 nginx 直接处理，不再经过 ATC Express ==========

// ========== 登录页面（无需认证，在认证中间件之前注册） ==========
const PUBLIC_DIR = path.resolve(__dirname, 'public')
app.get('/login', (req, res) => {
  const loginHtml = path.resolve(PUBLIC_DIR, 'login.html')
  if (fs.existsSync(loginHtml)) {
    res.sendFile(loginHtml)
  } else {
    res.status(404).send('登录页面未找到')
  }
})

// ========== 首页路由（已登录用户由认证中间件放行到 SPA fallback） ==========
// 未登录用户由认证中间件负责重定向到 /login
// 这里不再显式定义 app.get('/')，由底部的 SPA fallback 处理

// ========== 认证保护 ==========
app.use((req, res, next) => {
  // 公开路径：不需要登录
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/login/setcookie', '/api/auth/logout', '/favicon.ico', '/logo.svg']
  if (publicPaths.some(p => req.path === p || req.path.startsWith(p + '/'))) {
    return next()
  }

  // 静态资源始终开放（CSS/JS/图片）
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$/)) {
    return next()
  }

  if (REQUIRE_AUTH && !isAuthenticated(req)) {
    // 检查 URL 参数中是否有 token
    const tokenFromQuery = req.query.token
    if (tokenFromQuery) {
      // 如果是登录页面跳转带 token，设置 cookie
      res.cookie(AUTH_TOKEN_KEY, tokenFromQuery, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      // 重定向到去掉 token 参数的首页
      const cleanUrl = req.path
      return res.redirect(cleanUrl)
    }
    // 重定向到登录页面，记住来源
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`)
  }

  next()
})

// ========== 静态文件服务 ==========
app.use(express.static(DIST_DIR))

// ========== SPA 回退 ==========
// 所有未匹配的 GET 请求返回 index.html（VitePress SPA 路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

// ========== 启动 ==========
// 检查构建目录是否存在
if (!fs.existsSync(DIST_DIR)) {
  console.warn('[ATC Center] 构建目录不存在，请先运行 npm run build')
  console.warn(`[ATC Center] 期望路径: ${DIST_DIR}`)
}

app.listen(PORT, () => {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  ATC Center 管制员中心`)
  console.log(`  ────────────────────────────`)
  console.log(`  地址: http://localhost:${PORT}`)
  console.log(`  认证: ${REQUIRE_AUTH ? '[已启用]' : '[已禁用]'}`)
  console.log(`  API:  ${API_TARGET}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
})
