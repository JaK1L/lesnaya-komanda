type JwtPayload = {
  sub?: string
  type?: string
  discord_id?: string | number
  user_id?: string | number
  user_tag?: string
}

function decodePayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

function toIdentifierString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return null
}

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value)
}

export function getProfileIdentifierFromToken(token: string | null): string | null {
  if (!token) return null
  const payload = decodePayload(token)
  if (!payload) return null

  const discordId = toIdentifierString(payload.discord_id)
  if (discordId && isNumeric(discordId)) {
    return discordId
  }

  if (payload.type === 'discord') {
    const discordSub = toIdentifierString(payload.sub)
    if (discordSub && isNumeric(discordSub)) {
      return discordSub
    }
  }

  const userId = toIdentifierString(payload.user_id)
  if (userId && isNumeric(userId)) {
    return userId
  }

  const userTag = toIdentifierString(payload.user_tag)
  if (userTag) {
    return userTag
  }

  const sub = toIdentifierString(payload.sub)
  if (sub && isNumeric(sub)) {
    return sub
  }

  return null
}

export function getAuthIdentityFromToken(token: string | null): {
  userId: string | null
  discordId: string | null
} {
  if (!token) {
    return { userId: null, discordId: null }
  }

  const payload = decodePayload(token)
  if (!payload) {
    return { userId: null, discordId: null }
  }

  const userId = toIdentifierString(payload.user_id)
  const discordCandidate = toIdentifierString(payload.discord_id) ?? toIdentifierString(payload.sub)

  return {
    userId: userId && isNumeric(userId) ? userId : null,
    discordId: discordCandidate && isNumeric(discordCandidate) ? discordCandidate : null,
  }
}
