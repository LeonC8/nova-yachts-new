'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Phone, Mail, ArrowLeft, Facebook, Instagram, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  transparentOnTop?: boolean;
}

export function Navbar({ transparentOnTop = true }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()

  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    if (transparentOnTop) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    } else {
      setIsScrolled(true)
    }
  }, [transparentOnTop])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const headerClasses = transparentOnTop
    ? `fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${isScrolled ? 'bg-white text-black shadow-md' : 'bg-transparent text-white'}`
    : 'sticky top-0 z-50 bg-white text-black shadow-md'

  const logoClasses = `h-10 md:h-12 w-auto ${(isScrolled || !transparentOnTop) ? 'invert opacity-80' : ''}`

  const navLinkClasses = transparentOnTop
    ? `${isScrolled ? 'text-gray-700' : 'text-gray-200'}`
    : 'text-gray-700'

  const dividerClasses = transparentOnTop
    ? `fixed left-0 right-0 md:mt-2 h-px ${isScrolled ? 'bg-gray-200' : 'bg-white bg-opacity-30'}`
    : 'absolute left-0 right-0 md:mt-2 h-px bg-gray-200'

  return (
    <>
      <header className={headerClasses}>
        <div className="container mx-auto px-4 xl:px-20">
          <div className="flex justify-between items-center py-4">
            <Image 
              src="https://res.cloudinary.com/dsgx9xiva/image/upload/v1729932049/nova-yachts/logo/nova-yachts_wrtrr2_fkh4xk.png"
              alt="NovaYachts Logo"
              width={150}
              height={20}
              className={logoClasses}
            />
            <div className="hidden md:flex items-center space-x-4">
              <a 
                href="https://www.facebook.com/novayachts.eu/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-current hover:text-gray-300 opacity-60 hover:opacity-100 transition-opacity"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <button 
                className="text-current hover:text-gray-300 opacity-60 hover:opacity-100 transition-opacity mr-4 cursor-not-allowed"
                disabled
              >
                <Instagram className="w-5 h-5" />
              </button>
              <Link 
                href="/contact" 
                className={`px-5 py-1 rounded-full transition-colors flex items-center space-x-2 ${
                  isScrolled || !transparentOnTop
                    ? 'bg-slate-800 text-white hover:bg-gray-800 border border-slate-800'
                    : 'border border-white/70 text-white hover:bg-white hover:text-black'
                }`}
              >
                <span>Contact</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <button className="md:hidden" onClick={toggleSidebar}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>  
          <nav className={`flex overflow-x-auto space-x-4 py-3 ${navLinkClasses} items-center`}>
            {!transparentOnTop && (
              <button 
                onClick={handleGoBack}
                className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0 border border-gray-200 shadow-sm"
                aria-label="Go back"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <Link href="/new-yachts" className="whitespace-nowrap hover:text-gray-300 flex-shrink-0">New Yachts</Link>
            <Link href="/pre-owned" className="whitespace-nowrap hover:text-gray-300 flex-shrink-0">Pre-owned</Link>
            <a href="https://www.fairline.com" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-gray-300 flex-shrink-0">Fairline</a>
            <a href="https://www.numarine.com" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-gray-300 flex-shrink-0">Numarine</a>
            <Link href="/contact" className="whitespace-nowrap hover:text-gray-300 flex-shrink-0">Contact us</Link>
          </nav>
          <div className={dividerClasses} style={{top: '70px'}}></div>
          {transparentOnTop && (
            <div className={`fixed left-0 right-0 md:mt-2 h-px ${isScrolled ? 'bg-gray-200 hidden' : 'bg-white bg-opacity-30'}`} style={{top: '122px'}}></div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="p-4">
          <button onClick={toggleSidebar} className="absolute top-4 right-4">
            <X className="w-6 h-6" />
          </button>
          <nav className="mt-8">
            <ul className="space-y-4">
              {!transparentOnTop && (
                <li>
                  <button onClick={handleGoBack} className="flex items-center text-gray-800 hover:text-gray-600">
                    <ArrowLeft size={20} className="mr-2" /> Go Back
                  </button>
                </li>
              )}
              <li><Link href="/home" className="block text-gray-800 hover:text-gray-600">Home</Link></li>
              <li><Link href="/new-yachts" className="block text-gray-800 hover:text-gray-600">New Yachts</Link></li>
              <li><Link href="/pre-owned" className="block text-gray-800 hover:text-gray-600">Pre-owned</Link></li>
              <li><a href="https://www.fairline.com" target="_blank" rel="noopener noreferrer" className="block text-gray-800 hover:text-gray-600">Fairline</a></li>
              <li><a href="https://www.numarine.com" target="_blank" rel="noopener noreferrer" className="block text-gray-800 hover:text-gray-600">Numarine</a></li>
              <li><Link href="/contact" className="block text-gray-800 hover:text-gray-600">Contact us</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
