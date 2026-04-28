'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  body: string
  success: boolean
  modifications: string | null
  created_at: string
  author_id: string
  author_name: string
  images: string[]
}

export default function UchiReportList({ recipeId, refreshKey }: { recipeId: string; refreshKey: number }) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)

      const { data: reportsData } = await supabase
        .from('uchi_reports')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false })

      if (!reportsData || reportsData.length === 0) {
        setReports([])
        setLoading(false)
        return
      }

      // 投稿者名を取得
      const authorIds = [...new Set(reportsData.map(r => r.author_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', authorIds)

      const profileMap: Record<string, string> = {}
      profiles?.forEach(p => {
        profileMap[p.id] = p.display_name || p.username || '不明'
      })

      // 画像を取得
      const reportIds = reportsData.map(r => r.id)
      const { data: imagesData } = await supabase
        .from('uchi_report_images')
        .select('*')
        .in('report_id', reportIds)
        .order('sort_order', { ascending: true })

      const imageMap: Record<string, string[]> = {}
      imagesData?.forEach(img => {
        if (!imageMap[img.report_id]) imageMap[img.report_id] = []
        imageMap[img.report_id].push(img.image_url)
      })

      const enriched: Report[] = reportsData.map(r => ({
        id: r.id,
        body: r.body,
        success: r.success,
        modifications: r.modifications,
        created_at: r.created_at,
        author_id: r.author_id,
        author_name: profileMap[r.author_id] || '不明',
        images: imageMap[r.id] || [],
      }))

      setReports(enriched)
      setLoading(false)
    }
    fetchReports()
  }, [recipeId, refreshKey])

  if (loading) {
    return <p style={{ color: '#999', fontSize: '0.9rem' }}>読み込み中...</p>
  }

  if (reports.length === 0) {
    return (
      <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
        まだうちレポがありません。最初のレポートを投稿してみましょう！
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {reports.map(report => (
        <div key={report.id} style={{
          border: '1px solid #e0e8e2', borderRadius: 10, padding: '1rem 1.2rem', background: '#fff',
        }}>
          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '0.15rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                background: report.success ? '#eafaf1' : '#fdedec',
                color: report.success ? '#27ae60' : '#e74c3c',
              }}>
                {report.success ? '✅ 成功' : '❌ 失敗'}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{report.author_name}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>
              {new Date(report.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>

          {/* 本文 */}
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', margin: '0 0 0.5rem 0', whiteSpace: 'pre-wrap' }}>
            {report.body}
          </p>

          {/* 工夫した点 */}
          {report.modifications && (
            <div style={{
              background: '#f8f9fa', borderLeft: '3px solid #1a5632',
              padding: '0.5rem 0.8rem', borderRadius: '0 6px 6px 0',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a5632' }}>工夫した点</span>
              <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.2rem 0 0 0', whiteSpace: 'pre-wrap' }}>
                {report.modifications}
              </p>
            </div>
          )}

          {/* 画像 */}
          {report.images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {report.images.map((url, i) => (
                <img key={i} src={url} alt=""
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0e0e0' }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
