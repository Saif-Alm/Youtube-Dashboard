import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'Youtube Dashboard',
  description: 'Modern dashboard for viewing and trimming videos with responsive design',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1a73e8',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1a73e8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background text-dark flex flex-col">
        {children}
      </body>
    </html>
  )
}
