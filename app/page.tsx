'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/supabase-auth'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  cell_sourcing: { label: '細胞の調達', color: '#2e86c1' },
  production: { label: '生産工程', color: '#27ae60' },
  food_processing: { label: '食品加工', color: '#e67e22' },
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
}

const EXPERIMENT_TYPES = [
  { value: 'cooking', label: '調理' },
  { value: 'wet', label: 'ウェット実験' },
  { value: 'dry', label: 'ドライ解析' },
  { value: 'hardware', label: '機材開発' },
  { value: 'engineering', label: 'エンジニアリング' },
]

type Recipe = {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  experiment_type: string | null
  created_at: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  // フィルター状態
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedExpType, setSelectedExpType] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: recipesData } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: categoriesData } = await supabase
        .from('recipe_categories')
        .select('*')

      if (recipesData) {
        setRecipes(recipesData)
        setFilteredRecipes(recipesData)
      }

      const map: Record<string, string[]> = {}
      categoriesData?.forEach(c => {
        if (!map[c.recipe_id]) map[c.recipe_id] = []
        map[c.recipe_id].push(c.category)
      })
      setCategoryMap(map)
      setLoading(false)
    }
    init()
  }, [])

  // フィルタリング処理
  useEffect(() => {
    let result = [...recipes]

    // テキスト検索
    if (searchText.trim()) {
      const query = searchText.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      )
    }

    // カテゴリーフィルター
    if (selectedCategory) {
      result = result.filter(r =>
        (categoryMap[r.id] || []).includes(selectedCategory)
      )
    }

    // 実験タイプフィルター
    if (selectedExpType) {
      result = result.filter(r => r.experiment_type === selectedExpType)
    }

    setFilteredRecipes(result)
  }, [searchText, selectedCategory, selectedExpType, recipes, categoryMap])

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const clearFilters = () => {
    setSearchText('')
    setSelectedCategory(null)
    setSelectedExpType(null)
  }

  const hasActiveFilters = searchText || selectedCategory || selectedExpType

  if (loading) {
    return <main style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>読み込み中...</main>
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#1a5632', margin: 0 }}>🧫 Cell Recipe</h1>
          <p style={{ color: '#666', margin: 0 }}>細胞農業プロトコル共有プラットフォーム</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              <Link
                href="/recipes/new"
                style={{
                  background: '#1a5632', color: '#fff', padding: '0.5rem 1rem',
                  borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                }}
              >
                + 新しいレシピ
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'none', border: '1px solid #ccc', padding: '0.5rem 1rem',
                  borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#666',
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  background: '#1a5632', color: '#fff', padding: '0.5rem 1rem',
                  borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                }}
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                style={{
                  background: 'none', border: '1px solid #1a5632', color: '#1a5632',
                  padding: '0.5rem 1rem', borderRadius: 8, textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.9rem',
                }}
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 検索・フィルター */}
      <div style={{ background: '#f8faf8', border: '1px solid #e0e8e2', borderRadius: 12, padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
        {/* テキスト検索 */}
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="🔍 レシピを検索..."
          style={{
            width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ddd',
            borderRadius: 8, fontSize: '0.95rem', marginBottom: '0.8rem',
            outline: 'none',
          }}
        />

        {/* カテゴリーフィルター */}
        <div style={{ marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#888', marginRight: 8 }}>カテゴリー：</span>
          {Object.entries(CATEGORY_LABELS).map(([value, info]) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(selectedCategory === value ? null : value)}
              style={{
                padding: '0.25rem 0.7rem', borderRadius: 14, marginRight: 6,
                border: `1.5px solid ${info.color}`,
                background: selectedCategory === value ? info.color : '#fff',
                color: selectedCategory === value ? '#fff' : info.color,
                cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              }}
            >
              {info.label}
            </button>
          ))}
        </div>

        {/* 実験タイプフィルター */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: '#888', marginRight: 2 }}>実験タイプ：</span>
          {EXPERIMENT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedExpType(selectedExpType === t.value ? null : t.value)}
              style={{
                padding: '0.25rem 0.7rem', borderRadius: 14,
                border: '1.5px solid #aaa',
                background: selectedExpType === t.value ? '#1a5632' : '#fff',
                color: selectedExpType === t.value ? '#fff' : '#555',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* フィルターリセット */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              marginTop: 8, padding: '0.25rem 0.8rem', background: 'none',
              border: '1px solid #ccc', borderRadius: 8, color: '#888',
              cursor: 'pointer', fontSize: '0.8rem',
            }}
          >
            ✕ フィルターをリセット
          </button>
        )}
      </div>

      {/* 検索結果数 */}
      {hasActiveFilters && (
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.8rem' }}>
          {filteredRecipes.length} 件のレシピが見つかりました
        </p>
      )}

      {/* レシピ一覧 */}
      {filteredRecipes.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '3rem 0' }}>
          {hasActiveFilters
            ? '条件に一致するレシピが見つかりませんでした'
            : 'まだレシピがありません。最初のレシピを投稿しましょう！'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRecipes.map(recipe => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  border: '1px solid #e0e8e2', borderRadius: 12,
                  padding: '1.2rem 1.5rem', background: '#fff',
                  cursor: 'pointer', transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{recipe.title}</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {(categoryMap[recipe.id] || []).map(cat => {
                    const info = CATEGORY_LABELS[cat]
                    return info ? (
                      <span key={cat} style={{
                        background: info.color, color: '#fff',
                        padding: '0.15rem 0.6rem', borderRadius: 12,
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        {info.label}
                      </span>
                    ) : null
                  })}
                  {recipe.difficulty && (
                    <span style={{
                      background: '#f0f0f0', padding: '0.15rem 0.6rem',
                      borderRadius: 12, fontSize: '0.75rem',
                    }}>
                      {DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}
                    </span>
                  )}
                  {recipe.experiment_type && (
                    <span style={{
                      background: '#f0f0f0', padding: '0.15rem 0.6rem',
                      borderRadius: 12, fontSize: '0.75rem',
                    }}>
                      {EXPERIMENT_TYPES.find(t => t.value === recipe.experiment_type)?.label || recipe.experiment_type}
                    </span>
                  )}
                </div>
                {recipe.description && (
                  <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>
                    {recipe.description.length > 100
                      ? recipe.description.slice(0, 100) + '...'
                      : recipe.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
