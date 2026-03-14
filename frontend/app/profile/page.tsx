'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    try {
      const t = localStorage.getItem('lesnaya_token')
      if (t) {
        const id = JSON.parse(atob(t.split('.')[1])).discord_id
        if (id) { router.replace(`/profile/${id}`); return }
      }
    } catch { /* ignore */ }
    router.replace('/')
  }, [router])

  return null
}
