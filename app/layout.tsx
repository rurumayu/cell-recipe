import './globals.css'
import Header from '@/components/Header'

export const metadata = {
  title: 'Cell Recipe',
  description: '細胞農業プロトコル共有プラットフォーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ minHeight: '100vh', background: '#ffffff', color: '#1c2833', margin: 0 }}>
        <Header />
        {children}
      </body>
    </html>
  )
}
