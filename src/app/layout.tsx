import type { Metadata } from 'next'
import { Inter, Poppins, Righteous } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins'
})

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-righteous'
})

export const metadata: Metadata = {
  title: 'CinemaVerse - Your Ultimate Movie & Anime Hub',
  description: 'Discover, track, and review your favorite movies and anime. Join CinemaVerse for personalized recommendations, seasonal charts, and community reviews.',
  keywords: 'movies, anime, reviews, watchlist, cinema, entertainment, streaming, jikan, anilist',
  authors: [{ name: 'CinemaVerse Team' }],
  creator: 'CinemaVerse',
  publisher: 'CinemaVerse',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cinemaverse.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CinemaVerse - Your Ultimate Movie & Anime Hub',
    description: 'Discover, track, and review your favorite movies and anime.',
    url: 'https://cinemaverse.app',
    siteName: 'CinemaVerse',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CinemaVerse - Movie & Anime Hub',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CinemaVerse - Your Ultimate Movie & Anime Hub',
    description: 'Discover, track, and review your favorite movies and anime.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_CODE,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${righteous.variable} dark`} suppressHydrationWarning>
      <body className={`${poppins.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}