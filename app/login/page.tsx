'use client'

import { useState } from 'react'
import { signIn } from '@/lib/supabase-auth'
import Header from '@/components/Header'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setErrorMessage('メールアドレスとパスワードを入力してください'); setStatus('error'); return }
    setStatus('loading')
    const { error } = await signIn(email, password)
    if (error) { setErrorMessage('メールアドレスまたはパスワードが正しくありません'); setStatus('error') }
    else { window.location.href = '/' }
  }

  const inputStyle = { width: '100%', padding: '0.7rem', border: '1px solid #c0c8c2', borderRadius: 8, fontSize: '1rem', background: '#ffffff', color: '#1c2833' }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1c2833' }}>
      <Header />
      <main style={{ maxWidth: 400, margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.3rem', textAlign: 'center', marginBottom: '1.5rem', color: '#1a5632' }}>ログイン</h1>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem', color: '#333' }}>メールアドレス</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem', color: '#333' }}>パスワード</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {status === 'error' && <p style={{ color: '#c0392b', marginBottom: '1rem', fontSize: '0.9rem' }}>❌ {errorMessage}</p>}

        <button onClick={handleSubmit} disabled={status === 'loading'}
          style={{ width: '100%', padding: '0.8rem', background: status === 'loading' ? '#95a5a6' : '#1a5632', color: '#ffffff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
          {status === 'loading' ? 'ログイン中...' : 'ログイン'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' }}>
          アカウントをお持ちでないですか？ <a href="/signup" style={{ color: '#1a5632', fontWeight: 600 }}>新規登録</a>
        </p>
      </main>
    </div>
  )
}
