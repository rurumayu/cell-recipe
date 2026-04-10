'use client'

import { useState } from 'react'
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
type Step = { content: string; imageFile: File | null; imagePreview: string }

export default function NewRecipePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [experimentType, setExperimentType] = useState('')
  const [equipmentLevel, setEquipmentLevel] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [materials, setMaterials] = useState<Material[]>([{ name: '', amount: '' }])
  const [steps, setSteps] = useState<Step[]>([{ content: '', imageFile: null, imagePreview: '' }])
  const [results, setResults] = useState('')
  const [tips, setTips] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    )
  }

  // --- 材料の操作 ---
  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const updated = [...materials]
    updated[index][field] = value
    setMaterials(updated)
  }
  const addMaterial = () => setMaterials([...materials, { name: '', amount: '' }])
  const removeMaterial = (index: number) => {
    if (materials.length > 1) setMaterials(materials.filter((_, i) => i !== index))
  }

  // --- 手順の操作 ---
  const updateStep = (index: number, content: string) => {
    const updated = [...steps]
    updated[index].content = content
    setSteps(updated)
  }
  const addStep = () => setSteps([...steps, { content: '', imageFile: null, imagePreview: '' }])
  const removeStep = (index: number) => {
    if (steps.length > 1) setSteps(steps.filter((_, i) => i !== index))
  }
  const handleStepImage = (index: number, file: File | null) => {
    const updated = [...steps]
    if (file) {
      updated[index].imageFile = file
      updated[index].imagePreview = URL.createObjectURL(file)
    } else {
      updated[index].imageFile = null
      updated[index].imagePreview = ''
    }
    setSteps(updated)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('タイトルを入力してください')
      setStatus('error')
      return
    }
    if (selectedCategories.length === 0) {
      setErrorMessage('カテゴリーを1つ以上選択してください')
      setStatus('error')
      return
    }

    setStatus('saving')

    const materialsData = materials
      .filter(m => m.name.trim())
      .map(m => ({ name: m.name.trim(), amount: m.amount.trim() }))

    const stepsData = steps
      .filter(s => s.content.trim())
      .map((s, i) => ({ order: i + 1, content: s.content.trim() }))

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title,
        description,
        difficulty: difficulty || null,
        experiment_type: experimentType || null,
        equipment_level: equipmentLevel || null,
        materials: materialsData,
        steps: stepsData,
        results,
        tips,
        status: 'draft',
        author_id: '00000000-0000-0000-0000-000000000000',
      })
      .select()
      .single()

    if (recipeError) {
      setErrorMessage(recipeError.message)
      setStatus('error')
      return
    }

    if (recipe && selectedCategories.length > 0) {
      const categoryRows = selectedCategories.map(cat => ({
        recipe_id: recipe.id,
        category: cat,
      }))
      await supabase.from('recipe_categories').insert(categoryRows)
    }

    setStatus('success')
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #ccc',
    borderRadius: 8,
    fontSize: '1rem',
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🧫 新しいレシピを投稿</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>細胞農業の実験プロトコルを共有しましょう</p>

      {status === 'success' ? (
        <div style={{ background: '#eafaf1', border: '2px solid #27ae60', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#1a5632' }}>✅ 投稿完了！</h2>
          <p style={{ marginTop: '0.5rem' }}>レシピが保存されました</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '1rem' }}
          >
            トップに戻る
          </button>
        </div>
      ) : (
        <>
          {/* タイトル */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：低コスト培地での筋芽細胞増殖プロトコル"
              style={inputStyle}
            />
          </div>

          {/* カテゴリー */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>カテゴリー（複数選択可）*</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 20,
                    border: `2px solid ${cat.color}`,
                    background: selectedCategories.includes(cat.value) ? cat.color : '#fff',
                    color: selectedCategories.includes(cat.value) ? '#fff' : cat.color,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 説明 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>概要説明</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="このプロトコルの目的や概要を簡単に説明してください"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>

          {/* 難易度・タイプ・設備 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>難易度</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択</option>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>実験タイプ</label>
              <select value={experimentType} onChange={e => setExperimentType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択</option>
                {EXPERIMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>必要設備</label>
              <select value={equipmentLevel} onChange={e => setEquipmentLevel(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択</option>
                {EQUIPMENT_LEVELS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          {/* 材料 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>材料・試薬・機材</label>
            <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
              {/* ヘッダー */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', background: '#f5f5f5', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>
                <span>品名</span>
                <span>分量</span>
                <span></span>
              </div>
              {materials.map((mat, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', borderTop: '1px solid #f0f0f0', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={mat.name}
                    onChange={e => updateMaterial(i, 'name', e.target.value)}
                    placeholder={i === 0 ? '例：DMEM培地' : ''}
                    style={{ border: 'none', padding: '0.6rem 0.8rem', fontSize: '0.95rem', outline: 'none' }}
                  />
                  <input
                    type="text"
                    value={mat.amount}
                    onChange={e => updateMaterial(i, 'amount', e.target.value)}
                    placeholder={i === 0 ? '500ml' : ''}
                    style={{ border: 'none', borderLeft: '1px solid #f0f0f0', padding: '0.6rem 0.8rem', fontSize: '0.95rem', outline: 'none', textAlign: 'right' }}
                  />
                  <button
                    onClick={() => removeMaterial(i)}
                    style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem', padding: '0.3rem' }}
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addMaterial}
              style={{ marginTop: 8, padding: '0.4rem 1rem', background: 'none', border: '1px dashed #aaa', borderRadius: 8, color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              + 材料を追加
            </button>
          </div>

          {/* 手順 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>手順</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* 番号 */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#1a5632', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, marginTop: 6,
                  }}>
                    {i + 1}
                  </div>
                  {/* 入力エリア */}
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={step.content}
                      onChange={e => updateStep(i, e.target.value)}
                      placeholder={i === 0 ? '例：クリーンベンチ内で培地を準備する' : ''}
                      rows={2}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.95rem', resize: 'vertical' }}
                    />
                    {/* 画像添付 */}
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: '0.8rem', color: '#666', cursor: 'pointer', padding: '0.2rem 0.6rem', border: '1px solid #ddd', borderRadius: 6 }}>
                        📷 画像を添付
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleStepImage(i, e.target.files?.[0] || null)}
                        />
                      </label>
                      {step.imagePreview && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={step.imagePreview} alt="" style={{ height: 50, borderRadius: 6 }} />
                          <button
                            onClick={() => handleStepImage(i, null)}
                            style={{ position: 'absolute', top: -6, right: -6, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', cursor: 'pointer', lineHeight: '18px', padding: 0 }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 削除ボタン */}
                  <button
                    onClick={() => removeStep(i)}
                    style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem', marginTop: 6 }}
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              style={{ marginTop: 8, padding: '0.4rem 1rem', background: 'none', border: '1px dashed #aaa', borderRadius: 8, color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              + 手順を追加
            </button>
          </div>

          {/* 結果 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>結果</label>
            <textarea
              value={results}
              onChange={e => setResults(e.target.value)}
              placeholder="実験の結果を記述してください"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>

          {/* コツ */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>考察・コツ</label>
            <textarea
              value={tips}
              onChange={e => setTips(e.target.value)}
              placeholder="うまくいくためのポイントや注意点があれば"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>

          {/* エラー表示 */}
          {status === 'error' && (
            <p style={{ color: 'red', marginBottom: '1rem' }}>❌ {errorMessage}</p>
          )}

          {/* 投稿ボタン */}
          <button
            onClick={handleSubmit}
            disabled={status === 'saving'}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: status === 'saving' ? '#95a5a6' : '#1a5632',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: status === 'saving' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'saving' ? '保存中...' : 'レシピを投稿する'}
          </button>
        </>
      )}
    </main>
  )
}
