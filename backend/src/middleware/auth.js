import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'cw-atc-secret-key-2026'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请先登录' })
  }
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, message: '登录已过期' })
  }
}

export function requireInstructor(req, res, next) {
  const allowed = [8, 9, 10, 11, 12]  // I1, I2, I3, SUP, ADM
  if (!allowed.includes(req.user?.fsdLevel ?? 0)) {
    return res.status(403).json({ success: false, message: '需要教员或管理员权限' })
  }
  next()
}

export function requireAdmin(req, res, next) {
  if ((req.user?.fsdLevel ?? 0) < 11) {
    return res.status(403).json({ success: false, message: '需要管理员权限' })
  }
  next()
}
