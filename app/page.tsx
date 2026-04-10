import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('recipes').select('*')

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🧫 Cell Recipe</h1>
      <p>データベース接続テスト</p>
      {error ? (
        <p style={{ color: 'red' }}>❌ 接続エラー: {error.message}</p>
      ) : (
        <p style={{ color: 'green' }}>
          ✅ 接続成功！レシピ数: {data?.length ?? 0} 件
        </p>
      )}
    </main>
  )
}
