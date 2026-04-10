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

export default function NewRecipePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [experimentType, setExperimentType] = useState('')
  const [equipmentLevel, setEquipmentLevel] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [materials, setMaterials] = useState('')
  const [steps, setSteps] = useState('')
  const [results, setResults] = useState('')
  const [tips, setTips] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    )
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

    const materialsArray = materials
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({ name: line.trim() }))

    const stepsArray = steps
      .split('\n')
      .filter(line => line.trim())
      .map((line, i) => ({ order: i + 1, content: line.trim() }))

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title,
        description,
        difficulty: difficulty || null,
        experiment_type: experimentType || null,
        equipment_level: equipmentLevel || null,
        materials: materialsArray,
        steps: stepsArray,
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
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem' }}
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
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
            />
          </div>

          {/* 難易度・タイプ・設備 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>難易度</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択してください</option>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>実験タイプ</label>
              <select value={experimentType} onChange={e => setExperimentType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択してください</option>
                {EXPERIMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>必要設備</label>
              <select value={equipmentLevel} onChange={e => setEquipmentLevel(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc' }}>
                <option value="">選択してください</option>
                {EQUIPMENT_LEVELS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          {/* 材料 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>材料・試薬・機材</label>
            <textarea
              value={materials}
              onChange={e => setMaterials(e.target.value)}
              placeholder={'1行に1つずつ記入してください\n例：\nDMEM培地 500ml\nFBS 50ml\nペニシリン-ストレプトマイシン 5ml'}
              rows={5}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
            />
          </div>

          {/* 手順 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>手順</label>
            <textarea
              value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder={'1行に1ステップずつ記入してください\n例：\nクリーンベンチ内で培地を準備する\n細胞をトリプシン処理で剥離する\n遠心分離（300g, 5分）でペレットを回収'}
              rows={6}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
            />
          </div>

          {/* 結果 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>結果</label>
            <textarea
              value={results}
              onChange={e => setResults(e.target.value)}
              placeholder="実験の結果を記述してください"
              rows={3}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
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
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
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
