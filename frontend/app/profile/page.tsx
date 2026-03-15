'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProfileIdentifierFromToken } from '../../lib/profileIdentifier'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    try {
      const t = localStorage.getItem('lesnaya_token')
      const profileIdentifier = getProfileIdentifierFromToken(t)
      if (profileIdentifier) {
        router.replace(`/profile/${encodeURIComponent(profileIdentifier)}`)
        return
      }
    } catch { /* ignore */ }
    router.replace('/')
  }, [router])

  return null
}
