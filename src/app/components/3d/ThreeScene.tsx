'use client'

import { useEffect, useRef, useCallback } from 'react'

// Global Three.js instance to prevent multiple imports
let THREE: typeof import('three') | null = null
let threePromise: Promise<typeof import('three')> | null = null

const loadThree = async () => {
  if (THREE) return THREE
  if (threePromise) return threePromise
  
  threePromise = import('three').then((module) => {
    THREE = module
    return module
  })
  
  return threePromise
}

export function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const cleanupRef = useRef<(() => void) | null>(null)

  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = undefined
    }
    
    if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement)
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    
    sceneRef.current = null
  }, [])

  useEffect(() => {
    if (!mountRef.current) return

    let mounted = true

    const initThreeScene = async () => {
      try {
        const THREE = await loadThree()
        
        if (!mounted || !mountRef.current) return

        // Scene setup
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
          75, 
          window.innerWidth / window.innerHeight, 
          0.1, 
          1000
        )
        const renderer = new THREE.WebGLRenderer({ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        })
        
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        
        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement)
        }
        
        sceneRef.current = scene
        rendererRef.current = renderer

        // Create starfield
        const starGeometry = new THREE.BufferGeometry()
        const starCount = 800 // Reduced for performance
        const starPositions = new Float32Array(starCount * 3)
        
        for (let i = 0; i < starCount * 3; i++) {
          starPositions[i] = (Math.random() - 0.5) * 1500
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
        const starMaterial = new THREE.PointsMaterial({ 
          color: 0x9333ea, // Purple color to match theme
          size: 1.5,
          transparent: true,
          opacity: 0.6
        })
        const stars = new THREE.Points(starGeometry, starMaterial)
        scene.add(stars)

        // Create floating geometric shapes
        const shapes: any[] = []
        const shapeCount = 15 // Reduced for performance
        
        for (let i = 0; i < shapeCount; i++) {
          const geometry = Math.random() > 0.5 
            ? new THREE.BoxGeometry(1.5, 1.5, 1.5)
            : new THREE.SphereGeometry(0.8, 12, 12)
          
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.6, 0.5), // Purple/pink hues
            wireframe: true,
            transparent: true,
            opacity: 0.2
          })
          
          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.set(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80
          )
          mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          )
          shapes.push(mesh)
          scene.add(mesh)
        }

        // Create floating poster rectangles
        const posters: any[] = []
        const posterCount = 6 // Reduced for performance
        
        for (let i = 0; i < posterCount; i++) {
          const geometry = new THREE.PlaneGeometry(3, 4.5)
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.8 + Math.random() * 0.1, 0.4, 0.4),
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide
          })
          
          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.set(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 60
          )
          mesh.rotation.y = Math.random() * Math.PI
          posters.push(mesh)
          scene.add(mesh)
        }

        camera.position.z = 25

        // Animation loop with performance optimization
        let lastTime = 0
        const targetFPS = 60
        const frameTime = 1000 / targetFPS

        const animate = (currentTime: number) => {
          if (!mounted) return
          
          animationRef.current = requestAnimationFrame(animate)
          
          // Throttle animation to target FPS
          if (currentTime - lastTime < frameTime) return
          lastTime = currentTime
          
          const time = currentTime * 0.001 // Convert to seconds
          
          // Pre-calculate common values
          const timeOffset = time * 0.5
          const cameraTimeX = time * 0.0002
          const cameraTimeY = time * 0.0001
          
          // Rotate stars slowly
          stars.rotation.y = time * 0.0002
          
          // Animate shapes
          shapes.forEach((shape, index) => {
            const speed = 0.003 + index * 0.0001
            shape.rotation.x += speed
            shape.rotation.y += speed
            shape.position.y += Math.sin(time + index) * 0.008
          })
          
          // Animate posters
          posters.forEach((poster, index) => {
            poster.rotation.y += 0.001
            poster.position.y += Math.sin(timeOffset + index * 0.5) * 0.015
          })
          
          // Subtle camera movement
          camera.position.x = Math.sin(cameraTimeX) * 3
          camera.position.y = Math.cos(cameraTimeY) * 2
          camera.lookAt(0, 0, 0)
          
          if (renderer && scene && camera) {
            renderer.render(scene, camera)
          }
        }
        
        animate(0)

        // Handle resize
        const handleResize = () => {
          if (!camera || !renderer || !mounted) return
          
          const width = window.innerWidth
          const height = window.innerHeight
          
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }
        
        window.addEventListener('resize', handleResize)
        
        // Store cleanup function
        cleanupRef.current = () => {
          window.removeEventListener('resize', handleResize)
          
          // Dispose of geometries and materials
          shapes.forEach(shape => {
            shape.geometry.dispose()
            if (Array.isArray(shape.material)) {
              shape.material.forEach((material: any) => material.dispose())
            } else {
              shape.material.dispose()
            }
          })
          
          posters.forEach(poster => {
            poster.geometry.dispose()
            if (Array.isArray(poster.material)) {
              poster.material.forEach((material: any) => material.dispose())
            } else {
              poster.material.dispose()
            }
          })
          
          starGeometry.dispose()
          starMaterial.dispose()
        }

      } catch (error) {
        console.error('Three.js initialization failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    initThreeScene()

    return () => {
      mounted = false
      cleanup()
    }
  }, [cleanup])

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}