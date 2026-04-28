'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import UchiReportForm from './UchiReportForm'
import UchiReportList from './UchiReportList'
import FavoriteButton from './FavoriteButton'
import type { User } from '@supabase/supabase-js'

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  cell_sourcing: { label: '細胞の調達', color: '#2e86c1' },
  production: { label: '生産工程', color: '#27ae60' },
  food_processing: { label: '食品加工', color: '#e67e22' },
}
const DIFFICULTY_LABELS: Record<string, string> = { beginner: '初級', intermediate: '中級', advanced: '上級' }
const EXPERIMENT_TYPE_LABELS: Record<string, string> = { cooking: '調理', wet: 'ウェット実験', dry: 'ドライ解析', hardware: '機材開発', engineering: 'エンジニアリング' }
const EQUIPMENT_LEVEL_LABELS: Record<string, string> = { home: '家庭・DIY', community_lab: 'コミュニティラボ', professional: '研究機関レベル' }

type Material = { name: string; amount: string }
type Step = { order: number; content: string; image_url?: string }
type Recipe = { id: string; title: string; description: string | null; difficulty: string | null; experiment_type: string | null; equipment_level: string | null; materials: Material[]; steps: Step[]; results: string | null; tips: string | null; cover_image_url: string | null; author_id: string; created_at: string; status: string }

export default function RecipeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [authorName, setAuthorName] = useState('不明')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportRefreshKey, setReportRefreshKey] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [showReportForm, setShowReportForm] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: recipeData, error } = await supabase.from('recipes').select('*').eq('id', id).single()
      if (error || !recipeData) { setLoading(false); return }
      setRecipe(recipeData)
      const { data: cats } = await supabase.from('recipe_categories').select('category').eq('recipe_id', id)
      setCategories(cats?.map(c => c.category) || [])
      const { data: profile } = await supabase.from('profiles').select('username, display_name').eq('id', recipeData.author_id).single()
      setAuthorName(profile?.display_name || profile?.username || '不明')
      const { count } = await supabase.from('uchi_reports').select('*', { count: 'exact', head: true }).eq('recipe_id', id)
      setReportCount(count || 0)
      setLoading(false)
    }
    init()
  }, [id])

  const handleReportSubmitted = async () => {
    setReportRefreshKey(prev => prev + 1)
    setShowReportForm(false)
    const { count } = await supabase.from('uchi_reports').select('*', { count: 'exact', head: true }).eq('recipe_id', id)
    setReportCount(count || 0)
  }

  if (loading) return <main style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>読み込み中...</main>
  if (!recipe) return <main style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>レシピが見つかりませんでした</main>

  const materials: Material[] = recipe.materials || []
  const steps: Step[] = recipe.steps || []
  const isOwner = user && user.id === recipe.author_id

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <Link href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: '0.9rem' }}>← レシピ一覧に戻る</Link>

      {recipe.cover_image_url && (
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <img src={recipe.cover_image_url} alt={recipe.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 12 }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: recipe.cover_image_url ? '0.5rem' : '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#1a5632', flex: 1 }}>{recipe.title}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: '0.3rem' }}>
          <FavoriteButton recipeId={id} userId={user?.id || null} />
          {isOwner && (
            <Link href={`/recipes/${id}/edit`} style={{ padding: '0.4rem 0.8rem', background: '#fff', color: '#1a5632', border: '1px solid #1a5632', borderRadius: 8, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>✏️ 編集</Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {categories.map(cat => { const info = CATEGORY_LABELS[cat]; return info ? <span key={cat} style={{ background: info.color, color: '#fff', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{info.label}</span> : null })}
        {recipe.difficulty && <span style={{ background: '#f0f0f0', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem' }}>{DIFFICULTY_LABELS[recipe.difficulty]}</span>}
        {recipe.experiment_type && <span style={{ background: '#f0f0f0', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem' }}>{EXPERIMENT_TYPE_LABELS[recipe.experiment_type]}</span>}
        {recipe.equipment_level && <span style={{ background: '#f0f0f0', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem' }}>{EQUIPMENT_LEVEL_LABELS[recipe.equipment_level]}</span>}
      </div>

      <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
        投稿者：{authorName}　|　{new Date(recipe.created_at).toLocaleDateString('ja-JP')}
      </div>

      {recipe.description && <div style={{ marginBottom: '2rem' }}><p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#333' }}>{recipe.description}</p></div>}

      {materials.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>材料・試薬・機材</h2>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
            {materials.map((mat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderTop: i > 0 ? '1px solid #f0f0f0' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <span style={{ fontSize: '0.95rem' }}>{mat.name}</span>
                <span style={{ fontSize: '0.95rem', color: '#666', fontWeight: 500 }}>{mat.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>手順</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a5632', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>{step.order || i + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#333', margin: 0, paddingTop: 4 }}>{step.content}</p>
                  {step.image_url && <img src={step.image_url} alt={`手順${step.order || i + 1}`} style={{ marginTop: 8, maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #e0e0e0' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recipe.results && <div style={{ marginBottom: '2rem' }}><h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>結果</h2><p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#333' }}>{recipe.results}</p></div>}
      {recipe.tips && <div style={{ marginBottom: '2rem' }}><h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>考察・コツ</h2><p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#333' }}>{recipe.tips}</p></div>}

      {/* うちレポセクション */}
      <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '3px solid #e0e8e2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#1a5632', margin: 0 }}>📝 うちレポ（{reportCount}件）</h2>
          {user && !showReportForm && <button onClick={() => setShowReportForm(true)} style={{ padding: '0.5rem 1rem', background: '#1a5632', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+ うちレポを書く</button>}
          {!user && <Link href="/login" style={{ padding: '0.5rem 1rem', background: '#1a5632', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>ログインしてうちレポを書く</Link>}
        </div>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>「ウチでつくってみたレポート」— このプロトコルを試した結果を共有しましょう</p>
        {showReportForm && user && <UchiReportForm recipeId={id} userId={user.id} onSubmitted={handleReportSubmitted} />}
        <div style={{ marginTop: '1.5rem' }}><UchiReportList recipeId={id} refreshKey={reportRefreshKey} /></div>
      </div>
    </main>
  )
}
