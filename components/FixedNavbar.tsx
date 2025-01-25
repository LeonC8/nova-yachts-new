'use client'

import { useState, useCallback } from 'react'
import { X, ArrowLeft, Phone, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export function FixedNavbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white text-black border-b border-gray-200 shadow-md">
        <div className="container mx-auto px-4 xl:px-20">
          <div className="flex justify-between items-center py-4">
            <div>
              <Link href="/home">
                <Image 
                  src="https://res.cloudinary.com/dsgx9xiva/image/upload/v1729862411/nova-yachts/logo/Nova_Yachts_3_uqn6wk_1_z8ikck.png"
                  alt="Nova Yachts Logo"
                  width={150}
                  height={30}
                  priority
                  className="h-11 w-auto cursor-pointer"
                />
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/contact" 
                className="bg-slate-800 text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center space-x-2"
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
          <nav className="flex overflow-x-auto space-x-4 py-2 text-gray-700 text-md items-center py-3">
            <button 
              onClick={handleGoBack}
              className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0 border border-gray-200 shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft size={15} />
            </button>
            <Link href="/" className="whitespace-nowrap hover:text-gray-600 flex-shrink-0">Home</Link>
            <Link href="/new-yachts" className="whitespace-nowrap hover:text-gray-600 flex-shrink-0">New Yachts</Link>
            <Link href="/pre-owned" className="whitespace-nowrap hover:text-gray-600 flex-shrink-0">Pre-owned</Link>
            <a href="https://www.fairline.com" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-gray-600 flex-shrink-0">Fairline</a>
            <a href="https://www.numarine.com" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap hover:text-gray-600 flex-shrink-0">Numarine</a>
            <Link href="/contact" className="whitespace-nowrap hover:text-gray-600 flex-shrink-0">Contact us</Link>
          </nav>
          <div className="fixed left-0 right-0 md:mt-1 h-px bg-gray-200" style={{top: '70px'}}></div>
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
              <li><button onClick={handleGoBack} className="flex items-center text-gray-800 hover:text-gray-600"><ArrowLeft size={20} className="mr-2" /> Go Back</button></li>
              <li><Link href="/" className="block text-gray-800 hover:text-gray-600">Home</Link></li>
              <li><Link href="/new-yachts" className="block text-gray-800 hover:text-gray-600">New Yachts</Link></li>
              <li><Link href="/pre-owned" className="block text-gray-800 hover:text-gray-600">Pre-owned</Link></li>
              <li><a href="https://www.fairline.com" target="_blank" rel="noopener noreferrer" className="block text-gray-800 hover:text-gray-600">Fairline</a></li>
              <li><a href="https://www.numarine.com" target="_blank" rel="noopener noreferrer" className="block text-gray-800 hover:text-gray-600">Numarine</a></li>
              <li><Link href="/contact" className="block text-gray-800 hover:text-gray-600">Contact us</Link></li>
              <li><a href="tel:+38598301987" className="flex items-center text-gray-800 hover:text-gray-600"><Phone size={20} className="mr-2" /> Call Us</a></li>
              <li><a href="mailto:office@novayachts.eu" className="flex items-center text-gray-800 hover:text-gray-600"><Mail size={20} className="mr-2" /> Email Us</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Spacer to push content below the fixed navbar */}
      <div className="h-[104px] md:h-[88px]"></div>
    </>
  )
}
