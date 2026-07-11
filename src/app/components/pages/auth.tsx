'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Loading } from '../ui/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAppContext } from '../../context/AppContext'
import { auth, user as userApi } from '../../utils/supabase/client'
import { toast } from 'sonner'
import { validateEmail, validatePassword, validateName, sanitizeInput } from '../../utils/validation'
import { logger } from '../../utils/logger'

interface FormErrors {
  email?: string
  password?: string
  name?: string
  confirmPassword?: string
  general?: string
}

export function Auth() {
  const { setState, refreshWatchlist, refreshStats } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field if it exists
    setErrors(prev => {
      if (prev[name as keyof FormErrors]) {
        const next = { ...prev }
        delete next[name as keyof FormErrors]
        return next
      }
      return prev
    })
  }, [])

  const validateSignInForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const validateSignUpForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!validateName(formData.name)) {
      newErrors.name = 'Name must be between 2 and 50 characters'
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!validateSignInForm()) return
    setIsLoading(true)

    try {
      const sanitizedEmail = sanitizeInput(formData.email)
      const { data, error } = await auth.signIn(sanitizedEmail, formData.password)
      
      if (error) {
        setErrors({ general: error })
        toast.error(error)
        return
      }

      if (data?.user) {
        const { data: userData, error: userError } = await userApi.getProfile()
        if (userError) {
          logger.warn('Profile fetch error', userError)
        }

        setState({ 
          user: userData || data.user,
          currentPage: 'dashboard'
        })

        await Promise.allSettled([refreshWatchlist(), refreshStats()])
        toast.success('Signed in successfully!')
        logger.info('User signed in successfully')
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred'
      setErrors({ general: errorMsg })
      toast.error(errorMsg)
      logger.error('Sign in error', error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateSignInForm, setState, refreshWatchlist, refreshStats])

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!validateSignUpForm()) return
    setIsLoading(true)

    try {
      const sanitizedEmail = sanitizeInput(formData.email)
      const sanitizedName = sanitizeInput(formData.name)
      const { data, error } = await auth.signUp(sanitizedEmail, formData.password, sanitizedName)
      
      if (error) {
        setErrors({ general: error })
        toast.error(error)
        return
      }

      if (data?.user) {
        if (!data.session) {
          toast.success('Account created! Please check your email inbox to verify your account before signing in.', { duration: 6000 })
          setActiveTab('signin')
        } else {
          setState({ user: data.user, currentPage: 'dashboard' })
          toast.success('Account created successfully!')
        }
        logger.info('User signed up successfully')
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred'
      setErrors({ general: errorMsg })
      toast.error(errorMsg)
      logger.error('Sign up error', error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateSignUpForm, setState])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/20 via-background to-pink-900/20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">3D</span>
              </div>
            </motion.div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome to CinemaVerse
            </CardTitle>
            <CardDescription>Sign in to track your anime and movie journey</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        required
                      />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>
                  </div>

                  {errors.general && (
                    <div className="text-sm text-red-500 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      {errors.general}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loading size="sm" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        name="name"
                        placeholder="Full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        required
                      />
                      {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        required
                      />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                        required
                      />
                      {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  {errors.general && (
                    <div className="text-sm text-red-500 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      {errors.general}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loading size="sm" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setState({ currentPage: 'home' })}
                className="text-muted-foreground hover:text-foreground"
              >
                Continue as guest
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}