'use client'

import { useState } from 'react'
import { signUp } from '@/lib/supabase-auth'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!email || !password || !username) {
      setErrorMessage('すべての項目を入力してください')
      setStatus('error')
      return
    }
    if (password.length < 6) {
      setErrorMessage('パスワードは6文字以上にしてください')
      setStatus('error')
      return
    }

    setStatus('loading')
    const { error } = await signUp(email, password, username)

    if (error) {
      setErrorMessage(error.message)
      setStatus('error')
    } else {
      window.location.href = '/'
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.7rem',
    border: '1px solid #ccc',
    borderRadius: 8,
    fontSize: '1rem',
  }

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: '3rem 2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.3rem' }}>🧫 Cell Recipe</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>アカウント作成</p>

      {status === 'success' ? (
        <div style={{ background: '#eafaf1', border: '2px solid #27ae60', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ color: '#1a5632', fontSize: '1.2rem' }}>✅ 登録完了！</h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
            確認メールを送信しました。<br />メール内のリンクをクリックして認証を完了してください。
          </p>
          <a href="/login" style={{ display: 'inline-block', marginTop: '1rem', color: '#1a5632', fontWeight: 600 }}>
            ログインページへ →
          </a>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="例：cell_chef"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>パスワード（6文字以上）</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {status === 'error' && (
            <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>❌ {errorMessage}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={status === 'loading'}
            style={{
              width: '100%', padding: '0.8rem', background: '#1a5632', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? '登録中...' : 'アカウントを作成'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
            すでにアカウントをお持ちですか？{' '}
            <a href="/login" style={{ color: '#1a5632', fontWeight: 600 }}>ログイン</a>
          </p>
        </>
      )}
    </main>
  )
}
