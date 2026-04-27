import { supabase } from './supabase'

export async function signUp(email: string, password: string, username: string) {
  // 1. ユーザー作成
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      },
    },
  })
  if (error) return { user: null, error }

  // 2. 自動ログイン
  if (data.user) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { user: null, error: signInError }

    // 3. ログイン後にprofileを作成（ログイン状態でないとRLSで弾かれるため）
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
      display_name: username,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // profileの作成に失敗してもユーザー作成自体は成功しているので続行
    }
  }

  return { user: data.user, error: null }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { user: data?.user ?? null, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
