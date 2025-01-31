'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function ContactPage() {
  return (
    <>
      <Navbar transparentOnTop={false} />
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl text-gray-800 font-medium mb-6">Contact Us</h1>
          <div className="space-y-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-600 mr-4" />
              <span className="text-gray-600 text-sm">Hribarov Prilaz 10, Zagreb, Croatia</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-600 mr-4" />
              <span className="text-gray-600 text-sm">+385 98 301 987</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-600 mr-4" />
              <span className="text-gray-600 text-sm">office@novayachts.eu</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
