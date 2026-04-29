'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/supabase-auth'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  cell_sourcing: { label: '細胞の調達', color: '#1a6fb0', icon: '🔬' },
  production: { label: '生産工程', color: '#1a7a3a', icon: '⚙️' },
  food_processing: { label: '食品加工', color: '#c45a00', icon: '🍽️' },
}

const DIFFICULTY_LABELS: Record<string, string> = { beginner: '初級', intermediate: '中級', advanced: '上級' }

const EXPERIMENT_TYPES = [
  { value: 'cooking', label: '調理', icon: '🍳' },
  { value: 'wet', label: 'ウェット実験', icon: '🧪' },
  { value: 'dry', label: 'ドライ解析', icon: '💻' },
  { value: 'hardware', label: '機材開発', icon: '🔧' },
  { value: 'engineering', label: 'エンジニアリング', icon: '⚙️' },
]

type Recipe = {
  id: string; title: string; description: string | null; difficulty: string | null;
  experiment_type: string | null; cover_image_url: string | null; created_at: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({})
  const [favCountMap, setFavCountMap] = useState<Record<string, number>>({})
  const [reportCountMap, setReportCountMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedExpType, setSelectedExpType] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: recipesData } = await supabase.from('recipes').select('*').eq('status', 'published').order('created_at', { ascending: false })
      const { data: categoriesData } = await supabase.from('recipe_categories').select('*')
      if (recipesData) {
        setRecipes(recipesData); setFilteredRecipes(recipesData)
        const { data: favsData } = await supabase.from('favorites').select('recipe_id')
        const fMap: Record<string, number> = {}; favsData?.forEach(f => { fMap[f.recipe_id] = (fMap[f.recipe_id] || 0) + 1 }); setFavCountMap(fMap)
        const { data: reportsData } = await supabase.from('uchi_reports').select('recipe_id')
        const rMap: Record<string, number> = {}; reportsData?.forEach(r => { rMap[r.recipe_id] = (rMap[r.recipe_id] || 0) + 1 }); setReportCountMap(rMap)
      }
      const map: Record<string, string[]> = {}; categoriesData?.forEach(c => { if (!map[c.recipe_id]) map[c.recipe_id] = []; map[c.recipe_id].push(c.category) }); setCategoryMap(map)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    let result = [...recipes]
    if (searchText.trim()) { const q = searchText.toLowerCase(); result = result.filter(r => r.title.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q))) }
    if (selectedCategory) result = result.filter(r => (categoryMap[r.id] || []).includes(selectedCategory))
    if (selectedExpType) result = result.filter(r => r.experiment_type === selectedExpType)
    setFilteredRecipes(result)
  }, [searchText, selectedCategory, selectedExpType, recipes, categoryMap])

  const handleSignOut = async () => { await signOut(); window.location.reload() }
  const clearFilters = () => { setSearchText(''); setSelectedCategory(null); setSelectedExpType(null) }
  const hasActiveFilters = searchText || selectedCategory || selectedExpType

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#ffffff', padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#1c2833' }}>読み込み中...</main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', color: '#1c2833', fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif' }}>
      {/* ヘッダー */}
      <header style={{ background: '#1a5632', color: '#ffffff', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🧫</span>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.2 }}>Cell Recipe</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>細胞農業プロトコル共有</div>
              </div>
            </div>
          </Link>
          <nav style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link href="/recipes/new" style={{ background: '#ffffff', color: '#1a5632', padding: '0.4rem 0.8rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>+ 新規投稿</Link>
                <Link href="/mypage" style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>マイページ</Link>
                <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: 'rgba(255,255,255,0.8)', padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>ログアウト</button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ background: '#ffffff', color: '#1a5632', padding: '0.4rem 0.8rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>ログイン</Link>
                <Link href="/signup" style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>新規登録</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 検索・フィルター */}
        <div style={{ background: '#f5f7f5', border: '1px solid #d5ddd7', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
          <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="🔍 レシピを検索..."
            style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #c0c8c2', borderRadius: 8, fontSize: '0.95rem', marginBottom: '0.8rem', outline: 'none', background: '#ffffff', color: '#1c2833' }} />

          <div style={{ marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#555', marginRight: 8, fontWeight: 600 }}>カテゴリー：</span>
            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(CATEGORY_LABELS).map(([value, info]) => (
                <button key={value} onClick={() => setSelectedCategory(selectedCategory === value ? null : value)}
                  style={{ padding: '0.25rem 0.7rem', borderRadius: 14, border: `2px solid ${info.color}`, background: selectedCategory === value ? info.color : '#ffffff', color: selectedCategory === value ? '#ffffff' : info.color, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {info.icon} {info.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#555', marginRight: 8, fontWeight: 600 }}>実験タイプ：</span>
            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              {EXPERIMENT_TYPES.map(t => (
                <button key={t.value} onClick={() => setSelectedExpType(selectedExpType === t.value ? null : t.value)}
                  style={{ padding: '0.25rem 0.7rem', borderRadius: 14, border: '2px solid #888', background: selectedExpType === t.value ? '#333333' : '#ffffff', color: selectedExpType === t.value ? '#ffffff' : '#333333', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ marginTop: 8, padding: '0.25rem 0.8rem', background: '#ffffff', border: '1px solid #aaa', borderRadius: 8, color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>✕ リセット</button>
          )}
        </div>

        {hasActiveFilters && <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.8rem' }}>{filteredRecipes.length} 件のレシピが見つかりました</p>}

        {/* レシピ一覧 */}
        {filteredRecipes.length === 0 ? (
          <p style={{ color: '#777', textAlign: 'center', padding: '3rem 0' }}>
            {hasActiveFilters ? '条件に一致するレシピが見つかりませんでした' : 'まだレシピがありません。最初のレシピを投稿しましょう！'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {filteredRecipes.map(recipe => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ border: '1px solid #d5ddd7', borderRadius: 12, padding: '1rem', background: '#ffffff', cursor: 'pointer', transition: 'box-shadow 0.2s', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  {/* サムネイル */}
                  {recipe.cover_image_url ? (
                    <img src={recipe.cover_image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0, background: '#e8ede9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🧫</div>
                  )}
                  {/* テキスト */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '1rem', margin: '0 0 0.3rem 0', color: '#1c2833' }}>{recipe.title}</h2>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      {(categoryMap[recipe.id] || []).map(cat => {
                        const info = CATEGORY_LABELS[cat]
                        return info ? <span key={cat} style={{ background: info.color, color: '#ffffff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700 }}>{info.icon} {info.label}</span> : null
                      })}
                      {recipe.difficulty && <span style={{ background: '#e8e8e8', color: '#333', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.68rem', fontWeight: 600 }}>{DIFFICULTY_LABELS[recipe.difficulty]}</span>}
                      {recipe.experiment_type && <span style={{ background: '#e8e8e8', color: '#333', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.68rem', fontWeight: 600 }}>{EXPERIMENT_TYPES.find(t => t.value === recipe.experiment_type)?.icon} {EXPERIMENT_TYPES.find(t => t.value === recipe.experiment_type)?.label}</span>}
                    </div>
                    {recipe.description && (
                      <p style={{ color: '#555', fontSize: '0.8rem', margin: '0 0 0.3rem 0', lineHeight: 1.4 }}>
                        {recipe.description.length > 60 ? recipe.description.slice(0, 60) + '...' : recipe.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: '#777' }}>
                      <span>❤️ {favCountMap[recipe.id] || 0}</span>
                      <span>📝 {reportCountMap[recipe.id] || 0} レポ</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
