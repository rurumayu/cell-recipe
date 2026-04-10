import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

export const revalidate = 0

export default async function Home() {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('recipe_categories')
    .select('*')

  const categoryMap: Record<string, string[]> = {}
  categories?.forEach(c => {
    if (!categoryMap[c.recipe_id]) categoryMap[c.recipe_id] = []
    categoryMap[c.recipe_id].push(c.category)
  })

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#1a5632', margin: 0 }}>🧫 Cell Recipe</h1>
          <p style={{ color: '#666', margin: 0 }}>細胞農業プロトコル共有プラットフォーム</p>
        </div>
        <Link
          href="/recipes/new"
          style={{
            background: '#1a5632',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          + 新しいレシピ
        </Link>
      </div>

      {!recipes || recipes.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '3rem 0' }}>
          まだレシピがありません。最初のレシピを投稿しましょう！
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              style={{
                border: '1px solid #e0e8e2',
                borderRadius: 12,
                padding: '1.2rem 1.5rem',
                background: '#fff',
              }}
            >
              <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>{recipe.title}</h2>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {(categoryMap[recipe.id] || []).map(cat => {
                  const info = CATEGORY_LABELS[cat]
                  return info ? (
                    <span
                      key={cat}
                      style={{
                        background: info.color,
                        color: '#fff',
                        padding: '0.15rem 0.6rem',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {info.label}
                    </span>
                  ) : null
                })}
                {recipe.difficulty && (
                  <span style={{
                    background: '#f0f0f0',
                    padding: '0.15rem 0.6rem',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                  }}>
                    {DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}
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
          ))}
        </div>
      )}
    </main>
  )
}
