'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { getProfileIdentifierFromProfileResponse, getProfileIdentifierFromToken } from '../../lib/profileIdentifier'

export default function ProfileRedirect() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const t = localStorage.getItem('lesnaya_token')
        let profileIdentifier = getProfileIdentifierFromToken(t)

        if (t) {
          try {
            const res = await axios.get(`${API_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${t}` },
            })
            const canonicalIdentifier = getProfileIdentifierFromProfileResponse(res.data)
            if (canonicalIdentifier) {
              profileIdentifier = canonicalIdentifier
            }
          } catch { /* ignore and use token fallback */ }
        }

        if (cancelled) return
        if (profileIdentifier) {
          router.replace(`/profile/${encodeURIComponent(profileIdentifier)}`)
          return
        }
      } catch { /* ignore */ }
      if (!cancelled) {
        router.replace('/')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [API_URL, router])

  return null
}
