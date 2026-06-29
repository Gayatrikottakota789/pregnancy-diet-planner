import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pregnancy Diet & Nutrition Planner',
  description: 'Plan your pregnancy diet with food safety checker, meal suggestions, and nutrition tracking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-pink-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
