import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import prisma from './prisma.js'
import { sendAtcMail } from './mailer.js'
import { authenticate, requireInstructor, requireAdmin } from './middleware/auth.js'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'cw-atc-secret-key-2026'
const MAIN_API = process.env.MAIN_API || 'https://api.cwflysim.cn/api'

// 主站 API 请求封装：统一附带浏览器 UA + X-Requested-With，绕过主站反爬虫中间件
// （主站对非公开接口要求 UA 含 mozilla+like gecko 且 X-Requested-With: XMLHttpRequest）
const MAIN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
function mainApiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('User-Agent')) headers.set('User-Agent', MAIN_UA)
  if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest')
  return fetch(`${MAIN_API}${path}`, { ...options, headers })
}

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/knowledge')

// 确保上传目录存在
import fs from 'fs'
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// Multer 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.doc', '.docx', '.pdf', '.md', '.txt', '.mp4', '.mp4a', '.webm', '.ogg']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
})

app.use(cors({ origin: ['http://localhost:5175', 'http://localhost:5176', 'http://localhost:5173'], credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')))

// ==================== 认证（与主站同步登录） ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { cid, password } = req.body
    // 通过主站 API 验证登录
    const loginRes = await mainApiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid, password })
    })
    const loginData = await loginRes.json()
    if (!loginData.success) {
      return res.status(401).json({ success: false, message: 'CID 或密码错误' })
    }

    const user = loginData.data.user
    // 签发 ATC 专用 token
    const token = jwt.sign({
      cid: user.cid, username: user.username,
      role: user.role, fsdLevel: user.fsdLevel
    }, JWT_SECRET, { expiresIn: '24h' })

    // 同步/创建 ATC 用户扩展信息（从主站同步 fsdLevel）
    let atcUser = await prisma.atcUser.findUnique({ where: { cid: user.cid } })
    if (!atcUser) {
      atcUser = await prisma.atcUser.create({
        data: { cid: user.cid, rating: user.fsdLevel ?? 1 }
      })
    } else if (atcUser.rating !== user.fsdLevel) {
      // 主站 fsdLevel 有变更时自动同步
      atcUser = await prisma.atcUser.update({
        where: { cid: user.cid },
        data: { rating: user.fsdLevel }
      })
    }

    res.json({
      success: true,
      data: { token, user: { ...user, atcRating: atcUser.rating, instructor: atcUser.instructor, totalHours: atcUser.totalHours } }
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ==================== OAuth 登录（使用主站 JWT token） ====================
app.post('/api/auth/oauth/login', async (req, res) => {
  try {
    const { mainToken } = req.body
    if (!mainToken) return res.status(400).json({ success: false, message: '缺少 token' })

    // 通过主站 API 验证 token 并获取用户信息
    const profileRes = await mainApiFetch('/auth/me', {
      headers: { 'Authorization': `Bearer ${mainToken}` }
    })
    if (!profileRes.ok) {
      return res.status(401).json({ success: false, message: '主站 token 无效或已过期' })
    }
    const profileData = await profileRes.json()
    if (!profileData.success) {
      return res.status(401).json({ success: false, message: '主站 token 验证失败' })
    }

    const user = profileData.data
    // 签发 ATC 专用 token
    const token = jwt.sign({
      cid: user.cid, username: user.username,
      role: user.role, fsdLevel: user.fsdLevel
    }, JWT_SECRET, { expiresIn: '24h' })

    // 同步/创建 ATC 用户
    let atcUser = await prisma.atcUser.findUnique({ where: { cid: user.cid } })
    if (!atcUser) {
      atcUser = await prisma.atcUser.create({
        data: { cid: user.cid, rating: user.fsdLevel ?? 1 }
      })
    } else if (atcUser.rating !== user.fsdLevel) {
      atcUser = await prisma.atcUser.update({
        where: { cid: user.cid },
        data: { rating: user.fsdLevel }
      })
    }

    res.json({
      success: true,
      data: { token, user: { ...user, atcRating: atcUser.rating, instructor: atcUser.instructor, totalHours: atcUser.totalHours } }
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    // 从主站同步最新资料
    try {
      const syncRes = await mainApiFetch('/auth/profile', {
        headers: { 'Authorization': req.headers.authorization || '' }
      })
      const syncData = await syncRes.json()
      if (syncData.success && syncData.data) {
        const mainProfile = syncData.data
        // 更新 JWT payload 中的用户信息
        req.user.username = mainProfile.username
        req.user.fsdLevel = mainProfile.fsdLevel
        req.user.role = mainProfile.role
        // 同步 AtcUser.rating
        const atcUser = await prisma.atcUser.findUnique({ where: { cid: req.user.cid } })
        if (atcUser && atcUser.rating !== mainProfile.fsdLevel) {
          await prisma.atcUser.update({
            where: { cid: req.user.cid },
            data: { rating: mainProfile.fsdLevel }
          })
        }
      }
    } catch { /* 主站不可用时使用本地数据 */ }

    const atcUser = await prisma.atcUser.findUnique({ where: { cid: req.user.cid } })
    const totalHours = atcUser?.totalHours ?? 0
    // 查询已完成的考试数
    const examsPassed = await prisma.examAttempt.count({ where: { cid: req.user.cid, passed: true } })
    const simSessions = await prisma.simSession.count({ where: { cid: req.user.cid } })
    // 查询分配教员信息
    let instructorName = ''
    if (atcUser?.instructor) {
      const inst = await prisma.atcUser.findUnique({ where: { cid: atcUser.instructor } })
      instructorName = inst ? `教员 ${atcUser.instructor}` : ''
    }

    // 本月上报时长
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
    const monthReports = await prisma.report.aggregate({
      where: { cid: req.user.cid, createdAt: { gte: monthStart }, status: 'approved' },
      _sum: { durationMin: true }
    })
    const reportHours = (monthReports._sum.durationMin || 0) / 60

    res.json({
      success: true,
      data: {
        cid: req.user.cid,
        username: req.user.username,
        fsdLevel: req.user.fsdLevel,
        atcRating: atcUser?.rating ?? req.user.fsdLevel ?? 1,
        instructor: atcUser?.instructor ?? '',
        instructorName,
        totalHours,
        reportHours,
        examsPassed,
        simSessions
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ==================== 题库管理 ====================
app.get('/api/questions', authenticate, async (req, res) => {
  try {
    const { category } = req.query
    const where = category ? { category } : {}
    const data = await prisma.question.findMany({ where, orderBy: { id: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.post('/api/questions', authenticate, requireAdmin, async (req, res) => {
  try {
    const { content, options, answer, category, difficulty, explain } = req.body
    if (!content || !options || !answer) return res.status(400).json({ success: false, message: '缺少必填字段' })
    const q = await prisma.question.create({
      data: { content, options: JSON.stringify(options), answer, category: category || '', difficulty: difficulty || 1, explain: explain || '', authorCid: req.user.cid }
    })
    res.json({ success: true, data: q })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.put('/api/questions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { content, options, answer, category, difficulty, explain } = req.body
    const q = await prisma.question.update({
      where: { id: Number(req.params.id) },
      data: { ...(content !== undefined && { content }), ...(options !== undefined && { options: JSON.stringify(options) }), ...(answer !== undefined && { answer }), ...(category !== undefined && { category }), ...(difficulty !== undefined && { difficulty }), ...(explain !== undefined && { explain }) }
    })
    res.json({ success: true, data: q })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.delete('/api/questions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: '已删除' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 考试管理 ====================
app.get('/api/exams', authenticate, async (req, res) => {
  try {
    const data = await prisma.exam.findMany({ orderBy: { id: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.get('/api/exams/:id', authenticate, async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: Number(req.params.id) } })
    if (!exam) return res.status(404).json({ success: false, message: '考试不存在' })
    // 返回题目列表（不含答案）
    const qIds = JSON.parse(exam.questionIds || '[]')
    const questions = await prisma.question.findMany({ where: { id: { in: qIds } } })
    // 打乱顺序
    const shuffled = questions.sort(() => Math.random() - 0.5)
    // 移除答案
    const safe = shuffled.map(q => ({ id: q.id, content: q.content, options: q.options, difficulty: q.difficulty }))
    res.json({ success: true, data: { ...exam, questions: safe } })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.post('/api/exams', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, questionIds, passingScore, duration, category } = req.body
    const exam = await prisma.exam.create({
      data: { title, description: description || '', questionIds: JSON.stringify(questionIds || []), passingScore: passingScore || 70, duration: duration || 60, category: category || '', createdBy: req.user.cid, published: true }
    })
    res.json({ success: true, data: exam })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.put('/api/exams/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, questionIds, passingScore, duration, category, published } = req.body
    const exam = await prisma.exam.update({
      where: { id: Number(req.params.id) },
      data: { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(questionIds !== undefined && { questionIds: JSON.stringify(questionIds) }), ...(passingScore !== undefined && { passingScore }), ...(duration !== undefined && { duration }), ...(category !== undefined && { category }), ...(published !== undefined && { published }) }
    })
    res.json({ success: true, data: exam })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.delete('/api/exams/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.exam.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: '已删除' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 考试作答 ====================
app.post('/api/exams/:id/submit', authenticate, async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: Number(req.params.id) } })
    if (!exam) return res.status(404).json({ success: false, message: '考试不存在' })

    const { answers } = req.body  // [{qId, answer}]
    const qIds = JSON.parse(exam.questionIds || '[]')
    const questions = await prisma.question.findMany({ where: { id: { in: qIds } } })
    const qMap = {}
    questions.forEach(q => { qMap[q.id] = q })

    let score = 0
    const total = questions.length
    const details = (answers || []).map(a => {
      const q = qMap[a.qId]
      const correct = q && q.answer === a.answer
      if (correct) score++
      return { qId: a.qId, userAnswer: a.answer, correctAnswer: q?.answer, correct }
    })

    const passed = (score / total * 100) >= exam.passingScore
    const attempt = await prisma.examAttempt.create({
      data: { examId: exam.id, cid: req.user.cid, answers: JSON.stringify(details), score, total, passed, finishedAt: new Date() }
    })

    res.json({ success: true, data: { id: attempt.id, score, total, passed, percentage: Math.round(score / total * 100) } })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.get('/api/exam-attempts', authenticate, async (req, res) => {
  try {
    const data = await prisma.examAttempt.findMany({ where: { cid: req.user.cid }, orderBy: { id: 'desc' }, include: { exam: { select: { title: true } } } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 模拟机预约 ====================
app.get('/api/sim-sessions', authenticate, async (req, res) => {
  try {
    const where = { cid: req.user.cid }
    if (req.query.all === '1' && (req.user.fsdLevel || 0) >= 8) {
      delete where.cid
    }
    const data = await prisma.simSession.findMany({ where, orderBy: { startTime: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.post('/api/sim-sessions', authenticate, async (req, res) => {
  try {
    const { type, title, startTime, note, scope, instructorCid } = req.body
    if (!type || !startTime) return res.status(400).json({ success: false, message: '请填写类型和时间' })
    const session = await prisma.simSession.create({
      data: { cid: req.user.cid, type: type || 'training', title: title || '', startTime: new Date(startTime), note: note || '', scope: scope || 'all', instructorCid: instructorCid || '', status: 'pending' }
    })
    res.json({ success: true, data: session })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.put('/api/sim-sessions/:id/status', authenticate, requireInstructor, async (req, res) => {
  try {
    const { status } = req.body
    const session = await prisma.simSession.update({
      where: { id: Number(req.params.id) },
      data: { status, reviewerCid: req.user.cid }
    })
    // 发送预约审核结果通知
    try {
      const atcUser = await prisma.atcUser.findUnique({ where: { cid: session.cid } })
      if (session.cid !== req.user.cid) {
        const statusLabels = { approved: '已通过', completed: '已完成', cancelled: '已取消' }
        const label = statusLabels[status] || status
        const { sendAtcMail } = await import('./mailer.js')
        // 通过主站获取用户邮箱
        const mainRes = await mainApiFetch('/auth/me', {
          headers: { 'Authorization': req.headers.authorization || '' }
        })
        const mainData = await mainRes.json()
        if (mainData.success && mainData.data) {
          const users = await mainApiFetch('/admin/users', {
            headers: { 'Authorization': req.headers.authorization || '' }
          }).then(r => r.json()).catch(() => ({ data: [] }))
          const targetUser = (users.data || []).find(u => String(u.cid) === session.cid)
          if (targetUser?.email) {
            sendAtcMail(targetUser.email, {
              subject: `模拟机预约${label}`,
              body: `您的模拟机预约（${session.type === 'exam' ? '考核' : '训练'}）已${label}。` +
                (session.note ? `\n\n备注：${session.note}` : ''),
              action: '查看预约',
              actionUrl: `${process.env.ATC_URL || 'http://localhost:5176'}/simulator`
            }).catch(() => {})
          }
        }
      }
    } catch {}
    res.json({ success: true, data: session })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 理论知识管理（文章 + 文件上传） ====================
app.get('/api/articles', authenticate, async (req, res) => {
  try {
    const where = {}
    if (req.query.category) where.category = req.query.category
    if (!req.query.all) where.published = true
    const data = await prisma.article.findMany({ where, orderBy: { id: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.post('/api/articles', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, content, summary, category, fileType, fileUrl } = req.body
    const article = await prisma.article.create({
      data: { title, content: content || '', summary: summary || '', category: category || '', authorCid: req.user.cid, published: true }
    })
    res.json({ success: true, data: article })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 文件上传（理论知识/视频）
app.post('/api/articles/upload', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '请选择文件' })
    const fileUrl = `/uploads/knowledge/${req.file.filename}`
    const ext = path.extname(req.file.originalname).toLowerCase()
    const isVideo = ['.mp4', '.mp4a', '.webm', '.ogg'].includes(ext)
    const category = isVideo ? 'video' : 'document'
    const article = await prisma.article.create({
      data: {
        title: req.body.title || req.file.originalname,
        content: fileUrl,
        summary: `[${isVideo ? '视频' : '文件'}] ${req.file.originalname}`,
        category,
        authorCid: req.user.cid,
        published: true
      }
    })
    res.json({ success: true, data: article, fileUrl })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.put('/api/articles/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, content, summary, category, published } = req.body
    const article = await prisma.article.update({
      where: { id: Number(req.params.id) },
      data: { ...(title !== undefined && { title }), ...(content !== undefined && { content }), ...(summary !== undefined && { summary }), ...(category !== undefined && { category }), ...(published !== undefined && { published }) }
    })
    res.json({ success: true, data: article })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.delete('/api/articles/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: '已删除' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 视频管理 ====================
app.get('/api/videos', authenticate, async (req, res) => {
  try {
    const where = {}
    if (req.query.category) where.category = req.query.category
    if (!req.query.all) where.published = true
    const data = await prisma.video.findMany({ where, orderBy: { id: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.post('/api/videos', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, url, description, category, duration } = req.body
    const video = await prisma.video.create({
      data: { title, url, description: description || '', category: category || '', duration: duration || 0, authorCid: req.user.cid, published: true }
    })
    res.json({ success: true, data: video })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.put('/api/videos/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, url, description, category, duration, published } = req.body
    const video = await prisma.video.update({
      where: { id: Number(req.params.id) },
      data: { ...(title !== undefined && { title }), ...(url !== undefined && { url }), ...(description !== undefined && { description }), ...(category !== undefined && { category }), ...(duration !== undefined && { duration }), ...(published !== undefined && { published }) }
    })
    res.json({ success: true, data: video })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.delete('/api/videos/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.video.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: '已删除' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 用户管理（管理中心） ====================
app.get('/api/admin/atc-users', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await prisma.atcUser.findMany({ orderBy: { id: 'asc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.put('/api/admin/atc-users/:cid', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rating, instructor, totalHours } = req.body
    const user = await prisma.atcUser.update({
      where: { cid: req.params.cid },
      data: { ...(rating !== undefined && { rating }), ...(instructor !== undefined && { instructor }), ...(totalHours !== undefined && { totalHours }) }
    })
    res.json({ success: true, data: user })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 批量同步用户（从主站拉取） ====================
app.post('/api/admin/atc-users/sync', authenticate, requireAdmin, async (req, res) => {
  try {
    const syncRes = await mainApiFetch('/admin/users', {
      headers: { 'Authorization': req.headers.authorization || '' }
    })
    const syncData = await syncRes.json()
    if (!syncData.success) {
      return res.status(502).json({ success: false, message: '无法从主站拉取用户数据' })
    }
    const mainUsers = syncData.data || []
    let created = 0, updated = 0
    for (const u of mainUsers) {
      const exists = await prisma.atcUser.findUnique({ where: { cid: String(u.cid) } })
      if (exists) {
        if (exists.rating !== (u.fsdLevel ?? 1)) {
          await prisma.atcUser.update({
            where: { cid: String(u.cid) },
            data: { rating: u.fsdLevel ?? 1 }
          })
          updated++
        }
      } else {
        await prisma.atcUser.create({
          data: { cid: String(u.cid), rating: u.fsdLevel ?? 1 }
        })
        created++
      }
    }
    res.json({ success: true, data: { total: mainUsers.length, created, updated } })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ==================== 管理中心：预约管理 ====================
app.get('/api/admin/sim-sessions', authenticate, requireInstructor, async (req, res) => {
  try {
    const data = await prisma.simSession.findMany({ orderBy: { startTime: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 管制排班 ====================
// 获取排班列表（可按日期筛选，教员/管理员可查看全部）
app.get('/api/schedules', authenticate, async (req, res) => {
  try {
    const { date, cid } = req.query
    const where = {}
    // 教员/管理员可查看全部，普通用户只看自己
    const isStaff = (req.user.fsdLevel ?? 0) >= 8
    if (!isStaff) where.cid = req.user.cid
    if (date) {
      const d = new Date(date)
      where.date = { gte: new Date(d.setHours(0,0,0,0)), lt: new Date(new Date(date).setHours(23,59,59,999)) }
    }
    if (cid) where.cid = cid
    const data = await prisma.schedule.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 创建排班（教员/管理员）
app.post('/api/schedules', authenticate, requireInstructor, async (req, res) => {
  try {
    const { cid, date, position, startTime, endTime, note } = req.body
    if (!cid || !date || !position || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: '缺少必填字段' })
    }
    const schedule = await prisma.schedule.create({
      data: {
        cid, position, note: note || '',
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        createdBy: req.user.cid
      }
    })
    res.json({ success: true, data: schedule })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 更新排班
app.put('/api/schedules/:id', authenticate, requireInstructor, async (req, res) => {
  try {
    const { cid, date, position, startTime, endTime, status, note } = req.body
    const schedule = await prisma.schedule.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(cid !== undefined && { cid }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(position !== undefined && { position }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(status !== undefined && { status }),
        ...(note !== undefined && { note })
      }
    })
    res.json({ success: true, data: schedule })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 删除排班
app.delete('/api/schedules/:id', authenticate, requireInstructor, async (req, res) => {
  try {
    await prisma.schedule.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, message: '已删除' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 上管上报 ====================
// 获取上报统计（当前有效时长、未上报次数、我的教员）
app.get('/api/reports/stats', authenticate, async (req, res) => {
  try {
    const atcUser = await prisma.atcUser.findUnique({ where: { cid: req.user.cid } })
    // 本月已上报总时长（分钟）
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
    const thisMonth = await prisma.report.aggregate({
      where: { cid: req.user.cid, createdAt: { gte: monthStart }, status: 'approved' },
      _sum: { durationMin: true }
    })
    const currentHours = (thisMonth._sum.durationMin || 0) / 60
    // 未上报次数（当月排班但未上报的数量）
    const scheduledCount = await prisma.schedule.count({
      where: { cid: req.user.cid, date: { gte: monthStart }, status: 'scheduled' }
    })
    const reportedCount = await prisma.report.count({
      where: { cid: req.user.cid, createdAt: { gte: monthStart } }
    })
    const unreportedCount = Math.max(0, scheduledCount - reportedCount)
    // 我的教员
    let instructorName = '', instructorCid = ''
    if (atcUser?.instructor) {
      instructorCid = atcUser.instructor
      const inst = await prisma.atcUser.findUnique({ where: { cid: atcUser.instructor } })
      instructorName = inst ? `教员 ${atcUser.instructor}` : ''
    }
    res.json({ success: true, data: { currentHours, unreportedCount, instructorCid, instructorName } })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 获取上报列表
app.get('/api/reports', authenticate, async (req, res) => {
  try {
    const where = { cid: req.user.cid }
    const data = await prisma.report.findMany({ where, orderBy: { id: 'desc' } })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 新建上报
app.post('/api/reports', authenticate, async (req, res) => {
  try {
    const { instructorCid, instructorName, position, note, durationMin } = req.body
    if (!instructorCid || !position) return res.status(400).json({ success: false, message: '缺少必填字段' })
    const report = await prisma.report.create({
      data: { cid: req.user.cid, name: req.user.username || '', instructorCid, instructorName: instructorName || '', position, note: note || '', durationMin: durationMin || 0, status: 'pending' }
    })
    res.json({ success: true, data: report })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 教员列表（含详细信息） ====================
// 数据来源：主站 cwfly 库 User 表（fsdLevel >= 8 即 I1 及以上），
// 不再依赖用户登录 ATC 后才同步的本地 AtcUser 表，保证列表始终完整。
app.get('/api/instructors', authenticate, async (req, res) => {
  let conn = null
  try {
    // 从主站数据库读取高等级管制员（与主站同机，读取主库 cwfly）
    const mainDbUrl = new URL(process.env.MAIN_DB_URL || 'mysql://root:password@localhost:3306/cwfly')
    conn = await mysql.createConnection({
      host: mainDbUrl.hostname,
      port: Number(mainDbUrl.port) || 3306,
      user: mainDbUrl.username,
      password: mainDbUrl.password,
      database: mainDbUrl.pathname.replace(/^\//, '') || 'cwfly'
    })
    const [rows] = await conn.query(
      'SELECT cid, username, email, qq, fsdLevel FROM User WHERE fsdLevel >= 8 ORDER BY fsdLevel DESC'
    )

    // 本地 AtcUser 表补充管制时长
    const atcUsers = await prisma.atcUser.findMany({
      where: { rating: { gte: 8 } }
    })
    const hoursByCid = {}
    for (const a of atcUsers) hoursByCid[String(a.cid)] = a.totalHours || 0

    const result = rows.map(r => ({
      cid: String(r.cid),
      name: r.username || '',
      email: r.email || '',
      qq: r.qq || '',
      rating: r.fsdLevel ?? 0,
      totalHours: hoursByCid[String(r.cid)] ?? 0,
      flightHours: 0
    }))

    res.json({ success: true, data: result })
  } catch (e) {
    console.error('[instructors] 主库读取失败，回退到本地 AtcUser 表:', e.message)
    // 回退：本地 AtcUser（至少保证有数据返回）
    try {
      const fallback = await prisma.atcUser.findMany({
        where: { rating: { gte: 8 } },
        orderBy: { rating: 'desc' }
      })
      const result = fallback.map(u => ({
        cid: u.cid, name: '', email: '', qq: '',
        rating: u.rating, totalHours: u.totalHours || 0, flightHours: 0
      }))
      return res.json({ success: true, data: result })
    } catch {
      return res.status(500).json({ success: false, message: e.message })
    }
  } finally {
    if (conn) await conn.end().catch(() => {})
  }
})

// ==================== 申请教员 ====================
app.get('/api/instructor-applications', authenticate, async (req, res) => {
  try {
    const data = await prisma.instructorApplication.findMany({
      where: { cid: req.user.cid },
      orderBy: { id: 'desc' }
    })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

app.post('/api/instructor-applications', authenticate, async (req, res) => {
  try {
    const { targetCid } = req.body
    if (!targetCid) return res.status(400).json({ success: false, message: '请选择教员' })
    // 检查是否已申请过该教员
    const existing = await prisma.instructorApplication.findFirst({
      where: { cid: req.user.cid, targetCid, status: 'pending' }
    })
    if (existing) return res.status(400).json({ success: false, message: '已向该教员提交过申请，请等待审核' })
    const app = await prisma.instructorApplication.create({
      data: { cid: req.user.cid, name: req.user.username || '', targetCid }
    })
    res.json({ success: true, data: app })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== ATC 邮件发送 ====================
// 通用发送接口（仅限服务端内部或管理员调用）
app.post('/api/mail/send', authenticate, requireInstructor, async (req, res) => {
  try {
    const { to, subject, body, action, actionUrl } = req.body
    if (!to || !subject || !body) return res.status(400).json({ success: false, message: '缺少必填字段' })
    const result = await sendAtcMail(to, { subject, body, action, actionUrl })
    res.json({ success: true, data: result })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// 发送测试邮件（调试用）
app.post('/api/mail/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const { to } = req.body
    if (!to) return res.status(400).json({ success: false, message: '请提供收件人邮箱' })
    const result = await sendAtcMail(to, {
      subject: '测试邮件',
      body: '这是一封来自 ATC 管制员中心的测试邮件。如果您收到此邮件，说明邮件配置正常。',
      action: '前往 ATC 中心',
      actionUrl: process.env.ATC_URL || 'http://localhost:5176'
    })
    res.json({ success: true, message: '测试邮件已发送', data: result })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// ==================== 启动 ====================
app.listen(PORT, () => {
  console.log(`[ATC Center API] http://localhost:${PORT}`)
})
