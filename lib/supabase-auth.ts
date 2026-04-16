import { supabase } from './supabase'

export async function signUp(email: string, password: string, username: string) {
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

  // サインアップ後に自動ログイン
  if (data.user) {
    await supabase.auth.signInWithPassword({ email, password })
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
