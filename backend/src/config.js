import 'dotenv/config'

// ===== ATC JWT 密钥（与主站一致：缺失/过短/已知弱默认值一律拒绝启动） =====
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'cw-atc-secret-key-2026' || JWT_SECRET.length < 32) {
  console.error('\n  ╔═══════════════════════════════════════════════════╗')
  console.error('  ║  安全错误: ATC JWT_SECRET 未设置或过短/弱默认值    ║')
  console.error('  ║  请在 atc-center/backend/.env 设置 ≥32 字符随机密钥║')
  console.error('  ╚═══════════════════════════════════════════════════╝\n')
  process.exit(1)
}

export { JWT_SECRET }
