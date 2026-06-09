const fs = require('fs')
const path = require('path')
const jsonServer = require('json-server')
const cors = require('cors')

function loadEnvFile () {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile()

const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, '../mock/cortisense-db.json'))
const middlewares = jsonServer.defaults()
const routes = require('../mock/routes.json')

const PORT = Number(process.env.PORT || 3000)
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'http://localhost:5173'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CortiSense <onboarding@resend.dev>'

app.use(cors())
app.use(jsonServer.bodyParser)
app.use(middlewares)

function collection (name) {
  return router.db.get(name)
}

function nextId (items) {
  return items.reduce((max, item) => {
    const id = Number(item.id)
    return Number.isFinite(id) && id > max ? id : max
  }, 0) + 1
}

function createInvitationToken () {
  return `inv-${Date.now()}-${Math.floor(Math.random() * 999999)}`
}

function normalizeEmail (value) {
  return String(value || '').trim().toLowerCase()
}

async function sendInvitationEmail (invitation) {
  if (!RESEND_API_KEY) {
    console.log('[CortiSense] RESEND_API_KEY no configurado. Invitación guardada sin envío real de correo.')
    return { emailStatus: 'SKIPPED', resendEmailId: null }
  }

  const invitationUrl = `${APP_PUBLIC_URL}/accept-invitation?token=${encodeURIComponent(invitation.token)}`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [invitation.email],
      subject: 'Invitación a CortiSense',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1E293B;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;">
            <img src="${APP_PUBLIC_URL}/logo.svg" alt="CortiSense" style="width:48px;height:48px;border-radius:12px;" />
            <h1 style="margin:0;color:#0D1B2A;font-size:24px;">CortiSense</h1>
          </div>
          <h2 style="color:#0D1B2A;">Has sido invitado a CortiSense</h2>
          <p>Te han enviado una invitación para crear tu cuenta y acceder a la plataforma.</p>
          <p style="margin:28px 0;">
            <a href="${invitationUrl}" style="display:inline-block;background:#45DDE5;color:#0D1B2A;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700;">
              Aceptar invitación
            </a>
          </p>
          <p>También puedes copiar este enlace en tu navegador:</p>
          <p style="word-break:break-all;color:#0D1B2A;background:#F4F7FA;padding:12px;border-radius:10px;">${invitationUrl}</p>
        </div>
      `
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.message || data?.error || `Resend error ${response.status}`
    throw new Error(message)
  }

  return { emailStatus: 'SENT', resendEmailId: data?.id || data?.data?.id || null }
}

async function createInvitationHandler (req, res) {
  try {
    const payload = req.body || {}
    const email = normalizeEmail(payload.email)

    if (!email) return res.status(400).json({ message: 'Email is required' })

    const invitationsResource = collection('invitations')
    const invitations = invitationsResource.value()
    const exists = invitations.find(item => normalizeEmail(item.email) === email && item.status === 'PENDING')

    if (exists) return res.status(409).json({ message: 'There is already a pending invitation for this email.' })

    const invitation = {
      id: nextId(invitations),
      organizationId: Number(payload.organizationId || 1),
      email,
      role: payload.role || 'DOCTOR',
      status: 'PENDING',
      token: payload.token || createInvitationToken(),
      createdAt: payload.createdAt || new Date().toISOString(),
      emailStatus: 'PENDING',
      resendEmailId: null
    }

    try {
      const result = await sendInvitationEmail(invitation)
      invitation.emailStatus = result.emailStatus
      invitation.resendEmailId = result.resendEmailId
    } catch (emailError) {
      invitation.emailStatus = 'FAILED'
      invitation.emailError = emailError.message
      console.error('[CortiSense] Error enviando invitación:', emailError.message)
    }

    invitationsResource.push(invitation).write()
    return res.status(201).json(invitation)
  } catch (error) {
    console.error('[CortiSense] Error creando invitación:', error)
    return res.status(500).json({ message: 'Invitation could not be created.', detail: error.message })
  }
}

app.post('/invitations', createInvitationHandler)
app.post('/api/v1/invitations', createInvitationHandler)
app.use(jsonServer.rewriter(routes))
app.use(router)

app.listen(PORT, () => {
  console.log(`CortiSense mock server running at http://127.0.0.1:${PORT}/api/v1`)
  console.log(`Public app URL: ${APP_PUBLIC_URL}`)
})
