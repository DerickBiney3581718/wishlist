import type { Metadata } from 'next'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wishlist.tweenlearning.com'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Tween Learning — Join the waitlist',
  description:
    'Tween Learning is a new kind of learning platform built for real-world skills in tech and innovation. Join the waitlist and be first to access cohort 1.',
  openGraph: {
    title: 'Tween Learning — Join the waitlist',
    description:
      'Be first in line to learn what’s next. Real-world skills in tech and innovation.',
    url: appUrl,
    siteName: 'Tween Learning',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tween Learning — Join the waitlist',
    description: 'Be first in line to learn what’s next.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/*
          Loaded by literal family name rather than next/font, because
          page.module.css and the admin pages reference 'DM Mono' and
          'Archivo' directly — next/font emits hashed family names.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
