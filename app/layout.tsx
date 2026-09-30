import type { Metadata } from 'next'
import { Nunito, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const nunito = Nunito({
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EventPulse AI — Gestión de eventos inteligente',
  description: 'Plataforma SaaS B2B para organización de eventos con IA.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
