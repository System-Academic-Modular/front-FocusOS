import React from "react"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FocusOS',
  description: 'O seu cockpit tático de produtividade e foco neural.',
  manifest: '/manifest.webmanifest', // Conexão direta com o PWA!
  icons: {
    icon: '/icon.svg?v=1', 
    shortcut: '/icon.svg?v=1',
    apple: '/icon.svg?v=1',
  },
}

// Configuração de Câmera/Tela do Celular
export const viewport: Viewport = {
  themeColor: '#09090b', // Pinta a barra de status do celular com a nossa cor escura
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Impede que o iPhone dê zoom automático ao focar nos inputs
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}