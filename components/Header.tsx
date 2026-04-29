'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/supabase-auth'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header style={{ background: '#1a5632', color: '#ffffff', padding: '0.8rem 1.2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🧫</span>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>Cell Recipe</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>細胞農業プロトコル共有</div>
            </div>
          </div>
        </Link>
        <nav style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <Link href="/recipes/new" style={{ background: '#ffffff', color: '#1a5632', padding: '0.35rem 0.7rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>+ 新規投稿</Link>
              <Link href="/mypage" style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '0.35rem 0.7rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>マイページ</Link>
              <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: 'rgba(255,255,255,0.8)', padding: '0.35rem 0.7rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>ログアウト</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ background: '#ffffff', color: '#1a5632', padding: '0.35rem 0.7rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>ログイン</Link>
              <Link href="/signup" style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '0.35rem 0.7rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>新規登録</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
