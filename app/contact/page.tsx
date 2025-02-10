'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MapPin, Phone, Mail, Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SuccessModal } from "@/components/ui/success-modal"

interface FormElements extends HTMLFormControlsCollection {
  name: HTMLInputElement;
  email: HTMLInputElement;
  phone: HTMLInputElement;
  message: HTMLTextAreaElement;
}

interface ContactForm extends HTMLFormElement {
  readonly elements: FormElements;
}

export default function ContactPage() {
  const [isSending, setIsSending] = useState(false)
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent<ContactForm>) => {
    e.preventDefault()
    setIsSending(true)
    setFormStatus('idle')

    const form = e.currentTarget
    const formData = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      message: form.elements.message.value
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormStatus('success')
        form.reset()
        setShowSuccessModal(true)
      } else {
        setFormStatus('error')
      }
    } catch (error) {
      setFormStatus('error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Navbar transparentOnTop={false} />
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h1 className="text-2xl text-gray-800 font-medium mb-6">Contact Us</h1>
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-600 mr-4" />
                <span className="text-gray-600 text-sm">Gomboševa 28, Zagreb, Croatia</span>
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

            <div className="pt-8 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Send us a message</h2>
              <p className="text-sm text-gray-500 mb-6">We will get back to you as soon as possible.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Your email"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Your phone number"
                    className="w-full"
                  />
                </div>
                <div>
                  <Textarea
                    name="message"
                    placeholder="Your message"
                    required
                    className="w-full min-h-[100px]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-slate-800 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
                {formStatus === 'error' && (
                  <p className="text-red-600 text-sm">Failed to send message. Please try again.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <SuccessModal 
        open={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
    </>
  )
}
