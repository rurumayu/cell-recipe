'use client'

import Header from '@/components/Header'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  cell_sourcing: { label: '細胞の調達', color: '#2e86c1' },
  production: { label: '生産工程', color: '#27ae60' },
  food_processing: { label: '食品加工', color: '#e67e22' },
}

type Recipe = { id: string; title: string; description: string | null; status: string; created_at: string; updated_at: string }
type UchiReport = { id: string; body: string; success: boolean; created_at: string; recipe_id: string; recipe_title: string }
type FavRecipe = { recipe_id: string; title: string; cover_image_url: string | null; created_at: string }

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ username: string; display_name: string } | null>(null)
  const [drafts, setDrafts] = useState<Recipe[]>([])
  const [published, setPublished] = useState<Recipe[]>([])
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({})
  const [uchiReports, setUchiReports] = useState<UchiReport[]>([])
  const [favorites, setFavorites] = useState<FavRecipe[]>([])
  const [activeTab, setActiveTab] = useState<'recipes' | 'reports' | 'favorites'>('recipes')
  const [loading, setLoading] = useState(true)

  const fetchAll = async (userId: string) => {
    const { data: recipesData } = await supabase.from('recipes').select('*').eq('author_id', userId).order('updated_at', { ascending: false })
    if (recipesData) {
      setDrafts(recipesData.filter(r => r.status === 'draft'))
      setPublished(recipesData.filter(r => r.status === 'published'))
    }

    const { data: catsData } = await supabase.from('recipe_categories').select('*')
    const map: Record<string, string[]> = {}
    catsData?.forEach(c => { if (!map[c.recipe_id]) map[c.recipe_id] = []; map[c.recipe_id].push(c.category) })
    setCategoryMap(map)

    // うちレポ
    const { data: reportsData } = await supabase.from('uchi_reports').select('*').eq('author_id', userId).order('created_at', { ascending: false })
    if (reportsData) {
      const recipeIds = [...new Set(reportsData.map(r => r.recipe_id))]
      const { data: recipeTitles } = await supabase.from('recipes').select('id, title').in('id', recipeIds)
      const titleMap: Record<string, string> = {}
      recipeTitles?.forEach(r => { titleMap[r.id] = r.title })
      setUchiReports(reportsData.map(r => ({ ...r, recipe_title: titleMap[r.recipe_id] || '不明' })))
    }

    // お気に入り
    const { data: favsData } = await supabase.from('favorites').select('recipe_id, created_at').eq('user_id', userId).order('created_at', { ascending: false })
    if (favsData && favsData.length > 0) {
      const favRecipeIds = favsData.map(f => f.recipe_id)
      const { data: favRecipes } = await supabase.from('recipes').select('id, title, cover_image_url').in('id', favRecipeIds)
      const recipeMap: Record<string, { title: string; cover_image_url: string | null }> = {}
      favRecipes?.forEach(r => { recipeMap[r.id] = { title: r.title, cover_image_url: r.cover_image_url } })
      setFavorites(favsData.map(f => ({ recipe_id: f.recipe_id, title: recipeMap[f.recipe_id]?.title || '不明', cover_image_url: recipeMap[f.recipe_id]?.cover_image_url || null, created_at: f.created_at })))
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('username, display_name').eq('id', user.id).single()
      setProfile(profileData)
      await fetchAll(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const handlePublish = async (id: string) => { if (!confirm('公開しますか？')) return; await supabase.from('recipes').update({ status: 'published' }).eq('id', id); if (user) await fetchAll(user.id) }
  const handleUnpublish = async (id: string) => { if (!confirm('下書きに戻しますか？')) return; await supabase.from('recipes').update({ status: 'draft' }).eq('id', id); if (user) await fetchAll(user.id) }
  const handleDelete = async (id: string) => { if (!confirm('削除しますか？取り消せません。')) return; await supabase.from('recipes').delete().eq('id', id); if (user) await fetchAll(user.id) }
  const handleRemoveFav = async (recipeId: string) => { if (!user) return; await supabase.from('favorites').delete().eq('recipe_id', recipeId).eq('user_id', user.id); await fetchAll(user.id) }

  if (loading) return <main style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>読み込み中...</main>

  const tabStyle = (tab: string) => ({
    padding: '0.5rem 1.2rem', borderRadius: '8px 8px 0 0', border: '1px solid #e0e8e2', borderBottom: activeTab === tab ? '2px solid #1a5632' : '1px solid #e0e8e2',
    background: activeTab === tab ? '#fff' : '#f8faf8', color: activeTab === tab ? '#1a5632' : '#999',
    cursor: 'pointer' as const, fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.9rem',
  })

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <Link href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: '0.9rem' }}>← トップに戻る</Link>
      <h1 style={{ fontSize: '1.5rem', color: '#1a5632', marginTop: '1rem', marginBottom: '0.3rem' }}>マイページ</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{profile?.display_name || profile?.username || 'ユーザー'}</p>

      {/* タブ */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('recipes')} style={tabStyle('recipes')}>🧫 レシピ（{drafts.length + published.length}）</button>
        <button onClick={() => setActiveTab('reports')} style={tabStyle('reports')}>📝 うちレポ（{uchiReports.length}）</button>
        <button onClick={() => setActiveTab('favorites')} style={tabStyle('favorites')}>❤️ お気に入り（{favorites.length}）</button>
      </div>

      {/* レシピタブ */}
      {activeTab === 'recipes' && (
        <>
          <h2 style={{ fontSize: '1.1rem', color: '#b7950b', marginBottom: '0.8rem' }}>📝 下書き（{drafts.length}件）</h2>
          {drafts.length === 0 ? <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1.5rem' }}>下書きはありません</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {drafts.map(r => (
                <div key={r.id} style={{ border: '1px solid #e0e8e2', borderRadius: 10, padding: '1rem 1.2rem', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <Link href={`/recipes/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}><h3 style={{ fontSize: '1rem', margin: 0 }}>{r.title || '（無題）'}</h3></Link>
                    <span style={{ padding: '0.1rem 0.5rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, background: '#fef9e7', color: '#b7950b', flexShrink: 0, marginLeft: 8 }}>下書き</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.4rem' }}>{(categoryMap[r.id] || []).map(cat => { const info = CATEGORY_LABELS[cat]; return info ? <span key={cat} style={{ background: info.color, color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600 }}>{info.label}</span> : null })}</div>
                  <p style={{ fontSize: '0.8rem', color: '#999', margin: '0.3rem 0 0.6rem' }}>更新：{new Date(r.updated_at).toLocaleDateString('ja-JP')}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link href={`/recipes/${r.id}/edit`} style={{ padding: '0.3rem 0.8rem', background: '#fff', color: '#1a5632', border: '1px solid #1a5632', borderRadius: 6, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>✏️ 編集</Link>
                    <button onClick={() => handlePublish(r.id)} style={{ padding: '0.3rem 0.8rem', background: '#1a5632', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>🧫 公開する</button>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: '0.3rem 0.8rem', background: '#fff', color: '#e74c3c', border: '1px solid #f5b7b1', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>🗑 削除</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: '1.1rem', color: '#1a5632', marginBottom: '0.8rem' }}>🧫 公開中（{published.length}件）</h2>
          {published.length === 0 ? <p style={{ color: '#999', fontSize: '0.9rem' }}>公開中のレシピはありません</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {published.map(r => (
                <div key={r.id} style={{ border: '1px solid #e0e8e2', borderRadius: 10, padding: '1rem 1.2rem', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <Link href={`/recipes/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}><h3 style={{ fontSize: '1rem', margin: 0 }}>{r.title}</h3></Link>
                    <span style={{ padding: '0.1rem 0.5rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, background: '#eafaf1', color: '#1a5632', flexShrink: 0, marginLeft: 8 }}>公開中</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.4rem' }}>{(categoryMap[r.id] || []).map(cat => { const info = CATEGORY_LABELS[cat]; return info ? <span key={cat} style={{ background: info.color, color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600 }}>{info.label}</span> : null })}</div>
                  <p style={{ fontSize: '0.8rem', color: '#999', margin: '0.3rem 0 0.6rem' }}>更新：{new Date(r.updated_at).toLocaleDateString('ja-JP')}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link href={`/recipes/${r.id}/edit`} style={{ padding: '0.3rem 0.8rem', background: '#fff', color: '#1a5632', border: '1px solid #1a5632', borderRadius: 6, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>✏️ 編集</Link>
                    <button onClick={() => handleUnpublish(r.id)} style={{ padding: '0.3rem 0.8rem', background: '#fff', color: '#b7950b', border: '1px solid #f9e79f', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>📝 下書きに戻す</button>
                    <Link href={`/recipes/${r.id}`} style={{ padding: '0.3rem 0.8rem', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 6, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>👁 プレビュー</Link>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: '0.3rem 0.8rem', background: '#fff', color: '#e74c3c', border: '1px solid #f5b7b1', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>🗑 削除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* うちレポタブ */}
      {activeTab === 'reports' && (
        <>
          {uchiReports.length === 0 ? <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>まだうちレポを投稿していません</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {uchiReports.map(r => (
                <Link key={r.id} href={`/recipes/${r.recipe_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ border: '1px solid #e0e8e2', borderRadius: 10, padding: '1rem 1.2rem', background: '#fff', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a5632' }}>{r.recipe_title}</span>
                      <span style={{ padding: '0.1rem 0.5rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, background: r.success ? '#eafaf1' : '#fdedec', color: r.success ? '#1a5632' : '#c0392b' }}>{r.success ? '✅ 成功' : '❌ 失敗'}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#555', margin: '0.3rem 0' }}>{r.body.length > 80 ? r.body.slice(0, 80) + '...' : r.body}</p>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>{new Date(r.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* お気に入りタブ */}
      {activeTab === 'favorites' && (
        <>
          {favorites.length === 0 ? <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>お気に入りはまだありません</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {favorites.map(f => (
                <div key={f.recipe_id} style={{ border: '1px solid #e0e8e2', borderRadius: 10, padding: '0.8rem 1.2rem', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  {f.cover_image_url ? (
                    <img src={f.cover_image_url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0, background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧫</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <Link href={`/recipes/${f.recipe_id}`} style={{ textDecoration: 'none', color: 'inherit' }}><h3 style={{ fontSize: '0.95rem', margin: 0 }}>{f.title}</h3></Link>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.2rem 0 0' }}>{new Date(f.created_at).toLocaleDateString('ja-JP')} にお気に入り</p>
                  </div>
                  <button onClick={() => handleRemoveFav(f.recipe_id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem' }} title="お気に入り解除">❤️</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
