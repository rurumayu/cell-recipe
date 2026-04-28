'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  recipeId: string
  userId: string | null
}

export default function FavoriteButton({ recipeId, userId }: Props) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [count, setCount] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const fetchFavorites = async () => {
      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId)
      setCount(favCount || 0)

      if (userId) {
        const { data } = await supabase
          .from('favorites')
          .select('*')
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
          .single()
        setIsFavorited(!!data)
      }
    }
    fetchFavorites()
  }, [recipeId, userId])

  const handleToggle = async () => {
    if (!userId) {
      window.location.href = '/login'
      return
    }

    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)

    if (isFavorited) {
      setIsFavorited(false)
      setCount(prev => Math.max(0, prev - 1))
      await supabase.from('favorites').delete().eq('recipe_id', recipeId).eq('user_id', userId)
    } else {
      setIsFavorited(true)
      setCount(prev => prev + 1)
      await supabase.from('favorites').insert({ recipe_id: recipeId, user_id: userId })
    }
  }

  return (
    <button
      onClick={handleToggle}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '0.4rem 0.8rem', borderRadius: 20,
        border: isFavorited ? '1.5px solid #e74c3c' : '1.5px solid #ddd',
        background: isFavorited ? '#fdedec' : '#fff',
        color: isFavorited ? '#e74c3c' : '#999',
        cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.15)' : 'scale(1)',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{isFavorited ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  )
}
