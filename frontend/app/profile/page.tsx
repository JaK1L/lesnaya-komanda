'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    try {
      const t = localStorage.getItem('lesnaya_token')
      if (t) {
        const payload = JSON.parse(atob(t.split('.')[1]))
        const id = payload.discord_id ?? payload.sub
        if (id) { router.replace(`/profile/${id}`); return }
      }
    } catch { /* ignore */ }
    router.replace('/')
  }, [router])

  return null
}
