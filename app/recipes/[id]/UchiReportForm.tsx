'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

async function uploadImage(file: File, path: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${path}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
  const { error } = await supabase.storage.from('recipe-images').upload(fileName, file)
  if (error) return null
  const { data } = supabase.storage.from('recipe-images').getPublicUrl(fileName)
  return data.publicUrl
}

export default function UchiReportForm({ recipeId, userId, onSubmitted }: { recipeId: string; userId: string; onSubmitted: () => void }) {
  const [body, setBody] = useState('')
  const [success, setSuccess] = useState<boolean>(true)
  const [modifications, setModifications] = useState('')
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const addImage = (file: File) => {
    if (images.length >= 4) return
    setImages([...images, { file, preview: URL.createObjectURL(file) }])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!body.trim()) {
      setErrorMessage('レポートの内容を入力してください')
      setStatus('error')
      return
    }

    setStatus('saving')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMessage('ログインが必要です')
      setStatus('error')
      return
    }

    const { data: report, error: reportError } = await supabase
      .from('uchi_reports')
      .insert({
        recipe_id: recipeId,
        author_id: user.id,
        body,
        success,
        modifications: modifications || null,
      })
      .select()
      .single()

    if (reportError) {
      setErrorMessage(reportError.message)
      setStatus('error')
      return
    }

    // 画像アップロード
    if (report && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const url = await uploadImage(images[i].file, `uchi-reports/${user.id}`)
        if (url) {
          await supabase.from('uchi_report_images').insert({
            report_id: report.id,
            image_url: url,
            sort_order: i,
          })
        }
      }
    }

    // リセット
    setBody('')
    setSuccess(true)
    setModifications('')
    setImages([])
    setStatus('idle')
    onSubmitted()
  }

  return (
    <div style={{ background: '#f8faf8', border: '1px solid #e0e8e2', borderRadius: 12, padding: '1.2rem' }}>
      <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#1a5632' }}>📝 うちレポを書く</h3>

      {/* 成功/失敗 */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: '0.9rem' }}>再現結果</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSuccess(true)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              border: '2px solid #27ae60',
              background: success ? '#27ae60' : '#fff',
              color: success ? '#fff' : '#27ae60',
            }}>
            ✅ 成功
          </button>
          <button onClick={() => setSuccess(false)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              border: '2px solid #e74c3c',
              background: !success ? '#e74c3c' : '#fff',
              color: !success ? '#fff' : '#e74c3c',
            }}>
            ❌ 失敗
          </button>
        </div>
      </div>

      {/* レポート内容 */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>やってみた内容・結果 *</label>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="どのような条件で試したか、結果はどうだったかを書いてください"
          rows={4} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical' }} />
      </div>

      {/* 工夫した点 */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>工夫した点・変更点</label>
        <textarea value={modifications} onChange={e => setModifications(e.target.value)}
          placeholder="元のプロトコルから変更した点があれば"
          rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical' }} />
      </div>

      {/* 画像添付 */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: '0.9rem' }}>画像（最大4枚）</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={img.preview} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8 }} />
              <button onClick={() => removeImage(i)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#e74c3c', color: '#fff', border: 'none',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: '0.7rem', cursor: 'pointer', lineHeight: '18px', padding: 0,
                }}>×</button>
            </div>
          ))}
          {images.length < 4 && (
            <label style={{
              width: 70, height: 70, borderRadius: 8, border: '2px dashed #ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#aaa', fontSize: '1.5rem',
            }}>
              +
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && addImage(e.target.files[0])} />
            </label>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '0.5rem' }}>❌ {errorMessage}</p>
      )}

      <button onClick={handleSubmit} disabled={status === 'saving'}
        style={{
          padding: '0.6rem 1.5rem',
          background: status === 'saving' ? '#95a5a6' : '#1a5632',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: '0.9rem', fontWeight: 700,
          cursor: status === 'saving' ? 'not-allowed' : 'pointer',
        }}>
        {status === 'saving' ? '投稿中...' : 'うちレポを投稿'}
      </button>
    </div>
  )
}
