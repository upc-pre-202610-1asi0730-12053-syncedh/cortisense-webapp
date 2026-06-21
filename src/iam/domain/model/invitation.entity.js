export class Invitation {
  constructor({
    id = null,
    organizationId = null,
    email = '',
    role = '',
    status = 'PENDING',
    token = '',
    createdAt = '',
    acceptedAt = null,
    cancelledAt = null,
    expiresAt = null,
    emailStatus = '',
    resendEmailId = null,
    emailError = null
  } = {}) {
    this.id = id
    this.organizationId = organizationId
    this.email = email
    this.role = role
    this.status = status
    this.token = token
    this.createdAt = createdAt
    this.acceptedAt = acceptedAt
    this.cancelledAt = cancelledAt
    this.expiresAt = expiresAt
    this.emailStatus = emailStatus
    this.resendEmailId = resendEmailId
    this.emailError = emailError
  }

  get isPending() {
    return String(this.status).toUpperCase() === 'PENDING'
  }

  toResource() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      email: this.email,
      role: this.role,
      status: this.status,
      token: this.token,
      createdAt: this.createdAt,
      acceptedAt: this.acceptedAt,
      cancelledAt: this.cancelledAt,
      expiresAt: this.expiresAt,
      emailStatus: this.emailStatus,
      resendEmailId: this.resendEmailId,
      emailError: this.emailError
    }
  }
}