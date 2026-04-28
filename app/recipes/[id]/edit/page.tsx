'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
  { value: 'cell_sourcing', label: '細胞の調達', color: '#2e86c1' },
  { value: 'production', label: '生産工程', color: '#27ae60' },
  { value: 'food_processing', label: '食品加工', color: '#e67e22' },
]
const DIFFICULTIES = [
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
]
const EXPERIMENT_TYPES = [
  { value: 'cooking', label: '調理' },
  { value: 'wet', label: 'ウェット実験' },
  { value: 'dry', label: 'ドライ解析' },
  { value: 'hardware', label: '機材開発' },
  { value: 'engineering', label: 'エンジニアリング' },
]
const EQUIPMENT_LEVELS = [
  { value: 'home', label: '家庭・DIY' },
  { value: 'community_lab', label: 'コミュニティラボ' },
  { value: 'professional', label: '研究機関レベル' },
]

type Material = { name: string; amount: string }
type Step = { content: string; imageFile: File | null; imagePreview: string; image_url?: string }

async function uploadImage(file: File, path: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${path}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
  const { error } = await supabase.storage.from('recipe-images').upload(fileName, file)
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from('recipe-images').getPublicUrl(fileName)
  return data.publicUrl
}

export default function EditRecipePage() {
  const params = useParams()
  const recipeId = params.id as string

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [experimentType, setExperimentType] = useState('')
  const [equipmentLevel, setEquipmentLevel] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([{ name: '', amount: '' }])
  const [steps, setSteps] = useState<Step[]>([{ content: '', imageFile: null, imagePreview: '', image_url: '' }])
  const [results, setResults] = useState('')
  const [tips, setTips] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [recipeStatus, setRecipeStatus] = useState('draft')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const { data: recipe } = await supabase.from('recipes').select('*').eq('id', recipeId).single()
      if (!recipe || recipe.author_id !== user.id) { window.location.href = '/mypage'; return }

      setOriginalData({ title: recipe.title, description: recipe.description, difficulty: recipe.difficulty, experiment_type: recipe.experiment_type, equipment_level: recipe.equipment_level, materials: recipe.materials, steps: recipe.steps, results: recipe.results, tips: recipe.tips })
      setTitle(recipe.title || '')
      setDescription(recipe.description || '')
      setDifficulty(recipe.difficulty || '')
      setExperimentType(recipe.experiment_type || '')
      setEquipmentLevel(recipe.equipment_level || '')
      setResults(recipe.results || '')
      setTips(recipe.tips || '')
      setCoverImageUrl(recipe.cover_image_url || '')
      setCoverImagePreview(recipe.cover_image_url || '')
      setRecipeStatus(recipe.status)

      const mats = recipe.materials || []
      setMaterials(mats.length > 0 ? mats : [{ name: '', amount: '' }])

      const stps = (recipe.steps || []).map((s: { content: string; image_url?: string }) => ({
        content: s.content, imageFile: null, imagePreview: s.image_url || '', image_url: s.image_url || '',
      }))
      setSteps(stps.length > 0 ? stps : [{ content: '', imageFile: null, imagePreview: '', image_url: '' }])

      const { data: cats } = await supabase.from('recipe_categories').select('category').eq('recipe_id', recipeId)
      if (cats && cats.length > 0) setSelectedCategory(cats[0].category)

      setLoading(false)
    }
    init()
  }, [recipeId])

  const updateMaterial = (i: number, field: keyof Material, value: string) => { const u = [...materials]; u[i][field] = value; setMaterials(u) }
  const addMaterial = () => setMaterials([...materials, { name: '', amount: '' }])
  const removeMaterial = (i: number) => { if (materials.length > 1) setMaterials(materials.filter((_, j) => j !== i)) }
  const updateStep = (i: number, content: string) => { const u = [...steps]; u[i].content = content; setSteps(u) }
  const addStep = () => setSteps([...steps, { content: '', imageFile: null, imagePreview: '', image_url: '' }])
  const removeStep = (i: number) => { if (steps.length > 1) setSteps(steps.filter((_, j) => j !== i)) }
  const handleStepImage = (i: number, file: File | null) => {
    const u = [...steps]
    if (file) { u[i].imageFile = file; u[i].imagePreview = URL.createObjectURL(file) }
    else { u[i].imageFile = null; u[i].imagePreview = u[i].image_url || '' }
    setSteps(u)
  }
  const handleCoverImage = (file: File | null) => {
    if (file) { setCoverImageFile(file); setCoverImagePreview(URL.createObjectURL(file)) }
    else { setCoverImageFile(null); setCoverImagePreview(coverImageUrl) }
  }

  const handleSubmit = async (newStatus?: string) => {
    if (!title.trim()) { setErrorMessage('タイトルを入力してください'); setStatus('error'); return }
    if (!userId) return
    setStatus('saving')

    let finalCoverUrl = coverImageUrl
    if (coverImageFile) {
      setUploadProgress('カバー画像をアップロード中...')
      finalCoverUrl = await uploadImage(coverImageFile, `covers/${userId}`) || coverImageUrl
    }

    const stepsData = []
    const validSteps = steps.filter(s => s.content.trim())
    for (let i = 0; i < validSteps.length; i++) {
      const step = validSteps[i]
      let imgUrl = step.image_url || null
      if (step.imageFile) {
        setUploadProgress(`手順${i + 1}の画像をアップロード中...`)
        imgUrl = await uploadImage(step.imageFile, `steps/${userId}`) || imgUrl
      }
      stepsData.push({ order: i + 1, content: step.content.trim(), image_url: imgUrl })
    }

    setUploadProgress('保存中...')
    const materialsData = materials.filter(m => m.name.trim()).map(m => ({ name: m.name.trim(), amount: m.amount.trim() }))
    const finalStatus = newStatus || recipeStatus

    const newData = { title, description, difficulty: difficulty || null, experiment_type: experimentType || null, equipment_level: equipmentLevel || null, materials: materialsData, steps: stepsData, results, tips }

    // 公開済みレシピの場合、編集履歴を保存
    if (recipeStatus === 'published' && originalData) {
      await supabase.from('recipe_edit_history').insert({
        recipe_id: recipeId, edited_by: userId,
        old_data: originalData, new_data: newData,
      })
    }

    const { error } = await supabase.from('recipes').update({
      ...newData, status: finalStatus, cover_image_url: finalCoverUrl,
    }).eq('id', recipeId)

    if (error) { setErrorMessage(error.message); setStatus('error'); return }

    // カテゴリー更新
    await supabase.from('recipe_categories').delete().eq('recipe_id', recipeId)
    if (selectedCategory) {
      await supabase.from('recipe_categories').insert({ recipe_id: recipeId, category: selectedCategory })
    }

    setUploadProgress('')
    setStatus('success')
  }

  if (loading) return <main style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>読み込み中...</main>

  const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem' }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🧫 レシピを編集</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {recipeStatus === 'draft' ? '📝 下書き' : '🧫 公開中'}のレシピを編集しています
        {recipeStatus === 'published' && <span style={{ fontSize: '0.8rem', color: '#888' }}>（編集履歴が記録されます）</span>}
      </p>

      {status === 'success' ? (
        <div style={{ background: '#eafaf1', border: '2px solid #27ae60', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#1a5632' }}>✅ 保存しました！</h2>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={() => window.location.href = `/recipes/${recipeId}`}
              style={{ padding: '0.5rem 1.2rem', background: '#1a5632', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>レシピを見る</button>
            <button onClick={() => window.location.href = '/mypage'}
              style={{ padding: '0.5rem 1.2rem', background: 'none', border: '1px solid #1a5632', color: '#1a5632', borderRadius: 8, cursor: 'pointer' }}>マイページへ</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>タイトル *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>カバー画像</label>
            {coverImagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                <img src={coverImagePreview} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid #e0e0e0' }} />
                <button onClick={() => handleCoverImage(null)} style={{ position: 'absolute', top: -8, right: -8, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, fontSize: '0.8rem', cursor: 'pointer', lineHeight: '24px', padding: 0 }}>×</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', borderRadius: 10, padding: '2rem', cursor: 'pointer', color: '#999', fontSize: '0.9rem' }}>
                📷 クリックしてカバー画像を選択
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverImage(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>カテゴリー *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 20, border: `2px solid ${cat.color}`, background: selectedCategory === cat.value ? cat.color : '#fff', color: selectedCategory === cat.value ? '#fff' : cat.color, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>{cat.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>概要説明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>難易度</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択</option>{DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>実験タイプ</label>
              <select value={experimentType} onChange={e => setExperimentType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択</option>{EXPERIMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>必要設備</label>
              <select value={equipmentLevel} onChange={e => setEquipmentLevel(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択</option>{EQUIPMENT_LEVELS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>材料・試薬・機材</label>
            <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', background: '#f5f5f5', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, color: '#666' }}><span>品名</span><span>分量</span><span></span></div>
              {materials.map((mat, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', borderTop: '1px solid #f0f0f0', alignItems: 'center' }}>
                  <input type="text" value={mat.name} onChange={e => updateMaterial(i, 'name', e.target.value)} style={{ border: 'none', padding: '0.6rem 0.8rem', fontSize: '0.95rem', outline: 'none' }} />
                  <input type="text" value={mat.amount} onChange={e => updateMaterial(i, 'amount', e.target.value)} style={{ border: 'none', borderLeft: '1px solid #f0f0f0', padding: '0.6rem 0.8rem', fontSize: '0.95rem', outline: 'none', textAlign: 'right' }} />
                  <button onClick={() => removeMaterial(i)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                </div>))}
            </div>
            <button onClick={addMaterial} style={{ marginTop: 8, padding: '0.4rem 1rem', background: 'none', border: '1px dashed #aaa', borderRadius: 8, color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}>+ 材料を追加</button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>手順</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a5632', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, marginTop: 6 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <textarea value={step.content} onChange={e => updateStep(i, e.target.value)} rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.95rem', resize: 'vertical' }} />
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: '0.8rem', color: '#666', cursor: 'pointer', padding: '0.2rem 0.6rem', border: '1px solid #ddd', borderRadius: 6 }}>📷 画像を添付<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleStepImage(i, e.target.files?.[0] || null)} /></label>
                      {step.imagePreview && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={step.imagePreview} alt="" style={{ height: 50, borderRadius: 6 }} />
                          <button onClick={() => handleStepImage(i, null)} style={{ position: 'absolute', top: -6, right: -6, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', cursor: 'pointer', lineHeight: '18px', padding: 0 }}>×</button>
                        </div>)}
                    </div>
                  </div>
                  <button onClick={() => removeStep(i)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem', marginTop: 6 }}>×</button>
                </div>))}
            </div>
            <button onClick={addStep} style={{ marginTop: 8, padding: '0.4rem 1rem', background: 'none', border: '1px dashed #aaa', borderRadius: 8, color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}>+ 手順を追加</button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>結果</label>
            <textarea value={results} onChange={e => setResults(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>考察・コツ</label>
            <textarea value={tips} onChange={e => setTips(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          {status === 'error' && <p style={{ color: 'red', marginBottom: '1rem' }}>❌ {errorMessage}</p>}
          {uploadProgress && <p style={{ color: '#1a5632', marginBottom: '1rem', fontSize: '0.9rem' }}>⏳ {uploadProgress}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            {recipeStatus === 'draft' && (
              <>
                <button onClick={() => handleSubmit('draft')} disabled={status === 'saving'}
                  style={{ flex: 1, padding: '0.8rem', background: '#fff', color: '#1a5632', border: '2px solid #1a5632', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>📝 下書き保存</button>
                <button onClick={() => handleSubmit('published')} disabled={status === 'saving'}
                  style={{ flex: 1, padding: '0.8rem', background: '#1a5632', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>🧫 公開する</button>
              </>
            )}
            {recipeStatus === 'published' && (
              <button onClick={() => handleSubmit()} disabled={status === 'saving'}
                style={{ flex: 1, padding: '0.8rem', background: '#1a5632', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                {status === 'saving' ? '保存中...' : '✏️ 変更を保存'}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  )
}
