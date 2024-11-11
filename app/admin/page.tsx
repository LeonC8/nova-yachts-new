'use client'

import { useEffect, useState } from 'react'
import { BoatDashboard } from '@/components/BoatDashboard'
import { useRouter } from 'next/navigation'

interface LoginState {
  isLoggedIn: boolean;
  expiresAt: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check login state when component mounts
    const loginState = localStorage.getItem('loginState')
    if (loginState) {
      const parsedState: LoginState = JSON.parse(loginState)
      const currentTime = new Date().getTime()
      
      if (currentTime < parsedState.expiresAt) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('loginState')
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return <BoatDashboard initialAuthState={isAuthenticated} />
} 