import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PropManager - Property Management System',
  description: 'A comprehensive property management system for landlords to manage tenants, invoices, and properties.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
   return (
     <html lang="en" className="bg-background" suppressHydrationWarning>
       <body className="font-sans antialiased" suppressHydrationWarning>
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           <AuthProvider>
             {children}
             <Toaster />
           </AuthProvider>
         </ThemeProvider>
         {process.env.NODE_ENV === 'production' && <Analytics />}
       </body>
     </html>
   )
}
