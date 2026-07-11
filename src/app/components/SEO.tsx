import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
}

export function SEO({ 
  title = 'CinemaVerse - Your Ultimate Movie & Anime Hub',
  description = 'Discover, track, and review your favorite movies and anime. Join CinemaVerse for personalized recommendations and community reviews.',
  keywords = 'movies, anime, reviews, watchlist, cinema, entertainment',
  image = '/og-image.jpg',
  url = 'https://cinemaverse.app'
}: SEOProps) {
  const fullTitle = title.includes('CinemaVerse') ? title : `${title} | CinemaVerse`

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  )
}