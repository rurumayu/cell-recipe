'use client'

import { useState } from 'react'
import { signUp } from '@/lib/supabase-auth'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!email || !password || !username) { setErrorMessage('すべての項目を入力してください'); setStatus('error'); return }
    if (password.length < 6) { setErrorMessage('パスワードは6文字以上にしてください'); setStatus('error'); return }
    setStatus('loading')
    const { error } = await signUp(email, password, username)
    if (error) { setErrorMessage(error.message); setStatus('error') }
    else { window.location.href = '/' }
  }

  const inputStyle = { width: '100%', padding: '0.7rem', border: '1px solid #c0c8c2', borderRadius: 8, fontSize: '1rem', background: '#ffffff', color: '#1c2833' }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.3rem', textAlign: 'center', marginBottom: '1.5rem', color: '#1a5632' }}>アカウント作成</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem', color: '#333' }}>ユーザー名</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="例：cell_chef" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem', color: '#333' }}>メールアドレス</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" style={inputStyle} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem', color: '#333' }}>パスワード（6文字以上）</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
      </div>

      {status === 'error' && <p style={{ color: '#c0392b', marginBottom: '1rem', fontSize: '0.9rem' }}>❌ {errorMessage}</p>}

      <button onClick={handleSubmit} disabled={status === 'loading'}
        style={{ width: '100%', padding: '0.8rem', background: status === 'loading' ? '#95a5a6' : '#1a5632', color: '#ffffff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}>
        {status === 'loading' ? '登録中...' : 'アカウントを作成'}
      </button>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' }}>
        すでにアカウントをお持ちですか？ <a href="/login" style={{ color: '#1a5632', fontWeight: 600 }}>ログイン</a>
      </p>
    </main>
  )
}
