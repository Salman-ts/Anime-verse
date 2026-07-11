'use client'

import { useMemo } from 'react'
import { HeroSection } from '../sections/HeroSection'
import { TrendingSection } from '../sections/TrendingSection'
import { FeaturedSection } from '../sections/FeaturedSection'
import { ScheduleSection } from '../sections/ScheduleSection'
import { QuotesSection } from '../sections/QuotesSection'
import { SEO } from '../SEO'

export function Home() {
  const seoProps = useMemo(() => ({
    title: "CinemaVerse - Your Ultimate Movie & Anime Hub",
    description: "Discover, track, and review your favorite movies and anime. Join CinemaVerse for personalized recommendations, live simulcast charts, and community reviews."
  }), [])

  return (
    <>
      <SEO {...seoProps} />
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <HeroSection />
        <div className="relative z-10 space-y-4">
          <TrendingSection />
          <FeaturedSection />
          <ScheduleSection />
          <QuotesSection />
        </div>
      </div>
    </>
  )
}