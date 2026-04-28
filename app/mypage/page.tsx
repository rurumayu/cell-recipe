'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  cell_sourcing: { label: '細胞の調達', color: '#2e86c1' },
  production: { label: '生産工程', color: '#27ae60' },
  food_processing: { label: '食品加工', color: '#e67e22' },
}

type Recipe = {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ username: string; display_name: string } | null>(null)
  const [drafts, setDrafts] = useState<Recipe[]>([])
  const [published, setPublished] = useState<Recipe[]>([])
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchRecipes = async (userId: string) => {
    const { data: recipesData } = await supabase
      .from('recipes')
      .select('*')
      .eq('author_id', userId)
      .order('updated_at', { ascending: false })

    if (recipesData) {
      setDrafts(recipesData.filter(r => r.status === 'draft'))
      setPublished(recipesData.filter(r => r.status === 'published'))
    }

    const { data: categoriesData } = await supabase
      .from('recipe_categories')
      .select('*')
    const map: Record<string, string[]> = {}
    categoriesData?.forEach(c => {
      if (!map[c.recipe_id]) map[c.recipe_id] = []
      map[c.recipe_id].push(c.category)
    })
    setCategoryMap(map)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      await fetchRecipes(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const handlePublish = async (recipeId: string) => {
    if (!confirm('このレシピを公開しますか？')) return

    const { error } = await supabase
      .from('recipes')
      .update({ status: 'published' })
      .eq('id', recipeId)

    if (error) {
      alert('公開に失敗しました: ' + error.message)
      return
    }

    if (user) await fetchRecipes(user.id)
  }

  const handleUnpublish = async (recipeId: string) => {
    if (!confirm('このレシピを非公開（下書き）に戻しますか？')) return

    const { error } = await supabase
      .from('recipes')
      .update({ status: 'draft' })
      .eq('id', recipeId)

    if (error) {
      alert('操作に失敗しました: ' + error.message)
      return
    }

    if (user) await fetchRecipes(user.id)
  }

  const handleDelete = async (recipeId: string) => {
    if (!confirm('このレシピを削除しますか？この操作は取り消せません。')) return

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }

    if (user) await fetchRecipes(user.id)
  }

  if (loading) {
    return <main style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>読み込み中...</main>
  }

  const RecipeCard = ({ recipe, isDraft }: { recipe: Recipe; isDraft: boolean }) => (
    <div style={{
      border: '1px solid #e0e8e2', borderRadius: 10, padding: '1rem 1.2rem',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
        <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
          <h3 style={{ fontSize: '1rem', margin: 0, cursor: 'pointer' }}>{recipe.title || '（無題）'}</h3>
        </Link>
        <span style={{
          padding: '0.1rem 0.5rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0, marginLeft: 8,
          background: isDraft ? '#fef9e7' : '#eafaf1',
          color: isDraft ? '#b7950b' : '#1a5632',
        }}>
          {isDraft ? '下書き' : '公開中'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        {(categoryMap[recipe.id] || []).map(cat => {
          const info = CATEGORY_LABELS[cat]
          return info ? (
            <span key={cat} style={{
              background: info.color, color: '#fff',
              padding: '0.1rem 0.5rem', borderRadius: 10,
              fontSize: '0.7rem', fontWeight: 600,
            }}>{info.label}</span>
          ) : null
        })}
      </div>

      <p style={{ fontSize: '0.8rem', color: '#999', margin: '0.3rem 0 0.6rem' }}>
        更新：{new Date(recipe.updated_at).toLocaleDateString('ja-JP')}
      </p>

      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {isDraft && (
          <button onClick={() => handlePublish(recipe.id)}
            style={{
              padding: '0.3rem 0.8rem', background: '#1a5632', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600,
            }}>
            🧫 公開する
          </button>
        )}
        {!isDraft && (
          <button onClick={() => handleUnpublish(recipe.id)}
            style={{
              padding: '0.3rem 0.8rem', background: '#fff', color: '#b7950b',
              border: '1px solid #f9e79f', borderRadius: 6, cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600,
            }}>
            📝 下書きに戻す
          </button>
        )}
        <Link href={`/recipes/${recipe.id}`}
          style={{
            padding: '0.3rem 0.8rem', background: '#fff', color: '#666',
            border: '1px solid #ddd', borderRadius: 6, textDecoration: 'none',
            fontSize: '0.8rem', fontWeight: 500,
          }}>
          👁 プレビュー
        </Link>
        <button onClick={() => handleDelete(recipe.id)}
          style={{
            padding: '0.3rem 0.8rem', background: '#fff', color: '#e74c3c',
            border: '1px solid #f5b7b1', borderRadius: 6, cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 500,
          }}>
          🗑 削除
        </button>
      </div>
    </div>
  )

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <Link href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: '0.9rem' }}>
        ← トップに戻る
      </Link>

      <h1 style={{ fontSize: '1.5rem', color: '#1a5632', marginTop: '1rem', marginBottom: '0.3rem' }}>
        マイページ
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {profile?.display_name || profile?.username || 'ユーザー'}
      </p>

      {/* 下書き */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#b7950b', marginBottom: '0.8rem' }}>
          📝 下書き（{drafts.length}件）
        </h2>
        {drafts.length === 0 ? (
          <p style={{ color: '#999', fontSize: '0.9rem' }}>下書きはありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {drafts.map(r => <RecipeCard key={r.id} recipe={r} isDraft />)}
          </div>
        )}
      </div>

      {/* 公開済み */}
      <div>
        <h2 style={{ fontSize: '1.1rem', color: '#1a5632', marginBottom: '0.8rem' }}>
          🧫 公開中のレシピ（{published.length}件）
        </h2>
        {published.length === 0 ? (
          <p style={{ color: '#999', fontSize: '0.9rem' }}>公開中のレシピはありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {published.map(r => <RecipeCard key={r.id} recipe={r} isDraft={false} />)}
          </div>
        )}
      </div>
    </main>
  )
}
