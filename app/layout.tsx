import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { auth } from "@/auth"
import { Providers } from '@/components/Providers'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Hisab Management System',
  description: 'Professional finance management app for Indian users',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hisab',
  },
}

export const viewport = {
  themeColor: '#3B82F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-background">
        <Providers session={session}>
          {children}
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
