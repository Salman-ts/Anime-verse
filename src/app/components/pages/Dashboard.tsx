'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Clock, Star, TrendingUp, Calendar, Award, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { ContentCard } from '../cards/ContentCards'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { useAppContext } from '../../context/AppContext'

const dashboardData = {
  stats: {
    totalWatched: 156,
    totalHours: 2340,
    averageRating: 8.2,
    watchlistItems: 23
  },
  recentActivity: [
    { id: 1, title: "Attack on Titan", action: "completed", date: "2 days ago", poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=150&fit=crop" },
    { id: 2, title: "Your Name", action: "rated 9/10", date: "1 week ago", poster: "https://images.unsplash.com/photo-1489599856821-1ba4bfb1cb1d?w=100&h=150&fit=crop" },
    { id: 3, title: "Demon Slayer", action: "added to watchlist", date: "2 weeks ago", poster: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=100&h=150&fit=crop" }
  ],
  watchlist: [
    { id: 1, title: "Spirited Away", type: "movie" as const, rating: 9.3, year: 2001, genre: "Adventure", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=450&fit=crop", status: "Planned" },
    { id: 2, title: "Jujutsu Kaisen", type: "anime" as const, rating: 8.9, year: 2020, genre: "Action", poster: "https://images.unsplash.com/photo-1565115531-92b2b2fa7bb0?w=300&h=450&fit=crop", status: "Watching" },
    { id: 3, title: "Akira", type: "movie" as const, rating: 8.0, year: 1988, genre: "Sci-Fi", poster: "https://images.unsplash.com/photo-1578662996446-99932eeeec7a?w=300&h=450&fit=crop", status: "Completed" }
  ],
  goals: {
    yearlyTarget: 200,
    currentProgress: 156,
    monthlyTarget: 15,
    monthlyProgress: 12
  }
}

export function Dashboard() {
  const { state, refreshStats, refreshWatchlist } = useAppContext()

  // Use real data if available, fallback to mock data
  const stats: any = state.stats || dashboardData.stats
  const watchlist = state.watchlist || []
  const user = state.user

  useEffect(() => {
    if (user) {
      refreshStats()
      refreshWatchlist()
    }
  }, [user, refreshStats, refreshWatchlist])

  // Calculate goal progress
  const yearlyTarget = 200
  const monthlyTarget = 15
  const completionPercentage = (stats.totalWatched / yearlyTarget) * 100
  const monthlyProgress = Math.min(stats.totalWatched % 12, monthlyTarget) // Simplified monthly calculation
  const monthlyPercentage = (monthlyProgress / monthlyTarget) * 100

  // Filter watchlist by status
  const plannedItems = watchlist.filter((item: any) => item.status === 'Planned' || item.status === 'Watching')
  const completedItems = watchlist.filter((item: any) => item.status === 'Completed')
  const favoriteItems = watchlist.filter((item: any) => item.status === 'Favorite')

  return (
    <div className="min-h-screen pt-8 pb-20 bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your anime and movie journey
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-border/50 hover:border-purple-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Watched</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWatched}</div>
              <p className="text-xs text-muted-foreground">+{Math.max(0, stats.totalWatched - 144)} from last month</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Watched</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.totalWatched * 15).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">≈ {Math.round(stats.totalWatched * 15 / 24)} days total</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating ? stats.averageRating.toFixed(1) : '0'}/10</div>
              <p className="text-xs text-muted-foreground">Based on {stats.totalReviews || 0} reviews</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watchlist</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{watchlist.length}</div>
              <p className="text-xs text-muted-foreground">Items in watchlist</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Goals & Activity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Goals Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-500" />
                    2024 Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Yearly Target</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalWatched}/{yearlyTarget}
                      </span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(completionPercentage)}% complete
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">This Month</span>
                      <span className="text-sm text-muted-foreground">
                        {monthlyProgress}/{monthlyTarget}
                      </span>
                    </div>
                    <Progress value={monthlyPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(monthlyPercentage)}% of monthly goal
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="w-12 h-16 flex-shrink-0">
                          <ImageWithFallback
                            src={activity.poster}
                            alt={activity.title}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Watchlist */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="watchlist" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="watchlist">My Watchlist</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>

                <TabsContent value="watchlist" className="mt-6">
                  {plannedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {plannedItems.map((item: any, index: number) => {
                        const content = {
                          id: parseInt(item.contentId),
                          title: item.title,
                          type: item.type,
                          rating: 8.0,
                          year: 2020,
                          genre: 'Unknown',
                          poster: item.poster,
                          status: item.status
                        }
                        
                        return (
                          <ContentCard
                            key={item.contentId}
                            content={content}
                            viewMode="grid"
                            index={index}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No planned items yet</h3>
                      <p className="text-muted-foreground">
                        Add anime and movies to your watchlist to see them here
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                  {completedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedItems.map((item: any, index: number) => {
                        const content = {
                          id: parseInt(item.contentId),
                          title: item.title,
                          type: item.type,
                          rating: 8.0,
                          year: 2020,
                          genre: 'Unknown',
                          poster: item.poster,
                          status: item.status
                        }
                        
                        return (
                          <ContentCard
                            key={item.contentId}
                            content={content}
                            viewMode="grid"
                            index={index}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No completed items yet</h3>
                      <p className="text-muted-foreground">
                        Mark items as completed to see them here
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                  {favoriteItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteItems.map((item: any, index: number) => {
                        const content = {
                          id: parseInt(item.contentId),
                          title: item.title,
                          type: item.type,
                          rating: 8.0,
                          year: 2020,
                          genre: 'Unknown',
                          poster: item.poster,
                          status: item.status
                        }
                        
                        return (
                          <ContentCard
                            key={item.contentId}
                            content={content}
                            viewMode="grid"
                            index={index}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                      <p className="text-muted-foreground">
                        Mark your favorite anime and movies to see them here
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}