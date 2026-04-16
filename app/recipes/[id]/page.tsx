import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

const EXPERIMENT_TYPE_LABELS: Record<string, string> = {
  cooking: '調理',
  wet: 'ウェット実験',
  dry: 'ドライ解析',
  hardware: '機材開発',
  engineering: 'エンジニアリング',
}

const EQUIPMENT_LEVEL_LABELS: Record<string, string> = {
  home: '家庭・DIY',
  community_lab: 'コミュニティラボ',
  professional: '研究機関レベル',
}

export const revalidate = 0

type Material = { name: string; amount: string }
type Step = { order: number; content: string }

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !recipe) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('recipe_categories')
    .select('category')
    .eq('recipe_id', id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', recipe.author_id)
    .single()

  const materials: Material[] = recipe.materials || []
  const steps: Step[] = recipe.steps || []

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      {/* 戻るリンク */}
      <Link href="/" style={{ color: '#1a5632', textDecoration: 'none', fontSize: '0.9rem' }}>
        ← レシピ一覧に戻る
      </Link>

      {/* タイトル */}
      <h1 style={{ fontSize: '1.8rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#1a5632' }}>
        {recipe.title}
      </h1>

      {/* メタ情報 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {categories?.map(c => {
          const info = CATEGORY_LABELS[c.category]
          return info ? (
            <span key={c.category} style={{
              background: info.color, color: '#fff',
              padding: '0.2rem 0.7rem', borderRadius: 12,
              fontSize: '0.8rem', fontWeight: 600,
            }}>
              {info.label}
            </span>
          ) : null
        })}
        {recipe.difficulty && (
          <span style={{ background: '#f0f0f0', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem' }}>
            {DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}
          </span>
        )}
        {recipe.experiment_type && (
          <span style={{ background: '#f0f0f0', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem' }}>
            {EXPERIMENT_TYPE_LABELS[recipe.experiment_type] || recipe.experiment_type}
          </span>
        )}
        {recipe.equipment_level && (
          <span style={{ background: '#f0f0f0', padding: '0.2rem 0.7rem', borderRadius: 12, fontSize: '0.8rem' }}>
            {EQUIPMENT_LEVEL_LABELS[recipe.equipment_level] || recipe.equipment_level}
          </span>
        )}
      </div>

      {/* 投稿者・日時 */}
      <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' }}>
        投稿者：{profile?.display_name || profile?.username || '不明'}
        　|　{new Date(recipe.created_at).toLocaleDateString('ja-JP')}
      </div>

      {/* 概要 */}
      {recipe.description && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#333' }}>{recipe.description}</p>
        </div>
      )}

      {/* 材料 */}
      {materials.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>
            材料・試薬・機材
          </h2>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
            {materials.map((mat, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 1rem',
                borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}>
                <span style={{ fontSize: '0.95rem' }}>{mat.name}</span>
                <span style={{ fontSize: '0.95rem', color: '#666', fontWeight: 500 }}>{mat.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 手順 */}
      {steps.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>
            手順
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#1a5632', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {step.order || i + 1}
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#333', margin: 0, paddingTop: 4 }}>
                  {step.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 結果 */}
      {recipe.results && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>
            結果
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#333' }}>{recipe.results}</p>
        </div>
      )}

      {/* 考察・コツ */}
      {recipe.tips && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a5632', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '2px solid #e0e8e2' }}>
            考察・コツ
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#333' }}>{recipe.tips}</p>
        </div>
      )}
    </main>
  )
}
