import nodemailer from 'nodemailer'

const SMTP_USER = process.env.SMTP_USERNAME
const SMTP_PASS = process.env.SMTP_PASSWORD
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'atc@dwflysim.cn'
const FROM_NAME = process.env.SMTP_FROM_NAME || 'ATC 管制员中心'
const ATC_URL = process.env.ATC_URL || 'http://localhost:5176'

let transporter = null

if (SMTP_USER && SMTP_PASS) {
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  })
  transporter.verify().catch(() => { transporter = null })
}

// 异步队列
const queue = []
let processing = false
async function processQueue() {
  if (processing || queue.length === 0) return
  processing = true
  while (queue.length > 0) {
    const task = queue.shift()
    try { await transporter.sendMail(task) } catch {}
  }
  processing = false
}
function enqueue(opts) { queue.push(opts); if (transporter) processQueue() }

function html({ title, body, action, actionUrl }) {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;">
      <div style="background:#0d47a1;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">${FROM_NAME}</h1>
      </div>
      <div style="padding:30px;border:1px solid #e2e6ed;border-top:0;border-radius:0 0 10px 10px;">
        ${body ? `<p style="font-size:14px;color:#1f2a3a;line-height:1.7;">${body}</p>` : ''}
        ${action && actionUrl ? `
          <div style="text-align:center;margin:24px 0;">
            <a href="${actionUrl}" style="display:inline-block;padding:12px 28px;background:#0d47a1;color:#fff;font-size:15px;font-weight:600;border-radius:8px;text-decoration:none;">${action}</a>
          </div>
        ` : ''}
        <hr style="border:none;border-top:1px solid #f0f2f5;margin:24px 0;">
        <p style="font-size:12px;color:#8e96a4;text-align:center;">&copy; 2026 CW 模拟飞行 ATC 管制员中心</p>
      </div>
    </div>
  `
}

async function send(options) {
  if (!transporter) {
    console.log(`[Mailer Dev] To: ${options.to} | Subject: ${options.subject}`)
    return { success: true, devMode: true }
  }
  enqueue(options)
  return { success: true, queued: true }
}

/** 发送 ATC 通知邮件 */
export async function sendAtcMail(to, { subject, body, action, actionUrl }) {
  return send({
    to,
    subject: `[ATC 管制员中心] ${subject}`,
    html: html({ title: subject, body, action, actionUrl }),
    from: `${FROM_NAME} <${FROM_EMAIL}>`
  })
}
