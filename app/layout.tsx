import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { auth } from "@/auth"
import { Providers } from '@/components/Providers'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ReactNode } from 'react'
import PwaManager from '@/components/PwaManager'

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
})

export const metadata = {
  title: 'Hisab Management System',
  description: 'Hisab Management System is a secure personal finance, expense tracking, shared family ledger, and document vault web application.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hisab Management System',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}

export const viewport = {
  themeColor: '#6366F1',
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
      <body className={`${plusJakartaSans.variable} font-sans bg-background`}>
        <Providers session={session}>
          {children}
        </Providers>
        <PwaManager />
        <Toaster position="bottom-right" offset={96} />
      </body>
    </html>
  )
}

