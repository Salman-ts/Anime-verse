'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, User, Home, Compass, BarChart3, LogOut, Settings, Moon, Sun, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useAppContext } from '../../context/AppContext'

export function Navbar() {
  const { state, setState, signOut } = useAppContext()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Browse', icon: Compass },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
  ], [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-heavy border-b border-border/40 shadow-xl'
          : 'bg-background/60 backdrop-blur-md border-b border-border/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setState({ currentPage: 'home' })}
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              CinemaVerse
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 ml-10">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = state.currentPage === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => setState({ currentPage: item.id })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search anime, movies, genres..."
                value={state.searchQuery}
                onChange={(e) => {
                  setState({ searchQuery: e.target.value })
                  if (e.target.value && state.currentPage !== 'browse') {
                    setState({ currentPage: 'browse' })
                  }
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setState({ darkMode: !state.darkMode })}
              className="rounded-xl hover:bg-accent transition-transform hover:scale-105"
            >
              {mounted && state.darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-purple-400" />
              )}
            </Button>

            {state.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-white/20">
                      <AvatarImage src={state.user.avatar} alt={state.user.name} />
                      <AvatarFallback className="bg-primary text-white">
                        {state.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-heavy border-border/40 text-foreground">
                  <DropdownMenuItem
                    onClick={() => setState({ currentPage: 'dashboard' })}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-purple-400" />
                    <span>Dashboard Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setState({ currentPage: 'dashboard' })}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4 text-cyan-400" />
                    <span>Watchlist & Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-rose-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setState({ currentPage: 'auth' })}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-4"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Search & Menu Toggles */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              aria-label="Toggle mobile search"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

        </div>
      </div>

      {/* Dedicated Mobile Search Bar */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/10 glass-heavy px-4 py-3"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                autoFocus
                placeholder="Search anime, movies, genres..."
                value={state.searchQuery}
                onChange={(e) => {
                  setState({ searchQuery: e.target.value })
                  if (e.target.value && state.currentPage !== 'browse') {
                    setState({ currentPage: 'browse' })
                  }
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/10 glass-heavy px-4 py-4 space-y-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search anime..."
                value={state.searchQuery}
                onChange={(e) => {
                  setState({ searchQuery: e.target.value })
                  if (e.target.value) {
                    setState({ currentPage: 'browse' })
                    setShowMobileMenu(false)
                  }
                }}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setState({ currentPage: item.id })
                      setShowMobileMenu(false)
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-semibold ${
                      state.currentPage === item.id
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}