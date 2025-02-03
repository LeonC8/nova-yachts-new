'use client'

import { useState, useEffect } from 'react'
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Phone, Mail, MapPin, Calendar, Ruler, Anchor, Navigation, Download, Send } from 'lucide-react'
import { FixedNavbar } from './FixedNavbar'
import { Footer } from './Footer'
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getDatabase, ref, get, Database } from 'firebase/database'
import { getStorage } from 'firebase/storage'
import { Navbar } from './Navbar'
import { Loader } from './Loader'
import Image from 'next/image'
import { generatePDF } from './BoatPDF'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SuccessModal } from "@/components/ui/success-modal"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgJw2Q15zd_5Xh6z5F3UHwyFAMAikbH4Q",
  authDomain: "nova-yachts-new.firebaseapp.com",
  projectId: "nova-yachts-new",
  storageBucket: "nova-yachts-new.appspot.com",
  messagingSenderId: "211610700774",
  appId: "1:211610700774:web:aec6546014d2073e08a427",
  measurementId: "G-QK02XR3XSZ",
  databaseURL: "https://nova-yachts-new-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase  
let app: FirebaseApp;
let database: Database;
let storage: any;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  storage = getStorage(app);
}

interface BoatDetailsProps {
  params: {
    id: string;
  };
}

interface BoatDetails {
  name: string;
  price: string;
  condition: string;
  year: string;
  sizeMeters: string;
  beamMeters: string;
  location: string;
  engines: string;
  fuelCapacity: string;
  description: string;
  equipment: Record<string, boolean>;
  mainPhoto: string;
  otherPhotos: string[];
  taxStatus: string;
  propulsionType: string;
}

const parseDescription = (description: string) => {
  return description.replace(/\\n/g, '\n');
};

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function BoatDetails({ params }: BoatDetailsProps) {
  const { id } = params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [boatDetails, setBoatDetails] = useState<BoatDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    const fetchBoatDetails = async () => {
      if (!database) {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        storage = getStorage(app);
      }

      scrollToTop();
      
      const boatRef = ref(database, `boats/${id}`);
      const snapshot = await get(boatRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setBoatDetails(data);
      } else {
        console.log("No data available");
      }
      
      setTimeout(scrollToTop, 100);
      setIsLoading(false);
    };

    fetchBoatDetails();
  }, [id]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % boatImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + boatImages.length) % boatImages.length)
  }

  useEffect(() => {
    if (isCarouselOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCarouselOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      nextImage()
    } else if (isRightSwipe) {
      prevImage()
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSending(true)
    setFormStatus('idle')

    const form = e.currentTarget
    const formData: ContactFormData = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          boatName: boatDetails?.name,
          boatId: id
        }),
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

  const handlePdfGeneration = async () => {
    if (!boatDetails || isPdfLoading) return;
    setIsPdfLoading(true);
    try {
      await generatePDF(boatDetails);
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!boatDetails) {
    return <div>No boat found</div>;
  }

  const boatImages = boatDetails.otherPhotos ? [boatDetails.mainPhoto, ...boatDetails.otherPhotos] : [boatDetails.mainPhoto];

  return (
    <>
    <Navbar transparentOnTop={false} />
    <main className="container mx-auto px-4 py-3 md:pt-6 overflow-x-hidden md:px-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 mt-2 md:mt-4">
        <div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-gray-500 mb-0 tracking-wider">{boatDetails.condition.toUpperCase()}</p>
            <Button 
              onClick={handlePdfGeneration}
              className="md:hidden flex items-center justify-center bg-white text-gray-800 border border-gray-300 rounded-md w-8 h-8 p-0 hover:bg-white active:bg-white"
              size="icon"
              disabled={isPdfLoading}
            >
              {isPdfLoading ? (
                <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </Button>
          </div>
          <h1 className="text-3xl font-serif mt-3 text-gray-800">{boatDetails.name}</h1>
          <p className="text-sm font-normal text-gray-600 mt-4 md:hidden">
            € {Number(boatDetails.price).toLocaleString()} 
            {boatDetails.taxStatus === 'paid' ? ' (VAT Paid)' : ' (VAT Not Paid)'}  
          </p>
        </div>
        <div className="hidden md:block text-right">
          <span className="text-xl font-medium">
            €{Number(boatDetails.price).toLocaleString()} 
          </span>
          <p className="text-sm text-gray-500 mt-3">{boatDetails.taxStatus === 'paid' ? ' (VAT Paid)' : ' (VAT Not Paid)'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
        <div className="lg:col-span-3 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="lg:col-span-2 relative h-[250px] lg:h-[500px] overflow-hidden rounded-lg cursor-pointer" onClick={() => { setCurrentImageIndex(0); setIsCarouselOpen(true); }}>
              <Image 
                src={boatImages[0]} 
                alt={`${boatDetails.name} - Main Image`} 
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                priority
                className="object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs font-medium text-gray-300 hover:bg-opacity-70 transition-all duration-200 ease-in-out">
                {boatImages.length} photos
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-2">
              {boatImages.slice(1, 5).map((img, index) => (
                <div key={index} className="relative h-[245px] overflow-hidden rounded-lg cursor-pointer" onClick={() => { setCurrentImageIndex(index + 1); setIsCarouselOpen(true); }}>
                  <Image 
                    src={img} 
                    alt={`${boatDetails.name} - Image ${index + 2}`} 
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Mobile view */}
            <div className="grid grid-cols-4 gap-2 lg:hidden">
              {boatImages.slice(1, 5).map((img, index) => (
                <div key={index} className="relative h-[60px] overflow-hidden rounded-lg cursor-pointer" onClick={() => { setCurrentImageIndex(index + 1); setIsCarouselOpen(true); }}>
                  <Image 
                    src={img} 
                    alt={`${boatDetails.name} - Image ${index + 2}`} 
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <section className="mb-8">
            <h2 className="text-xl text-gray-800 font-medium mb-6">General</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-300 px-4 py-4 flex flex-col justify-between h-full">
                <div className="text-md font-medium text-gray-700 mb-4">{boatDetails.year}</div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span>Year</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-300 px-4 py-4 flex flex-col justify-between h-full">
                <div className="text-md font-medium text-gray-700 mb-4">{boatDetails.sizeMeters}m</div>
                <div className="flex items-center text-sm text-gray-500">
                  <Ruler className="h-4 w-4 text-gray-500 mr-2" />
                  <span>Length</span>
                </div>
              </div>
              
              <div className="col-span-2 bg-white p-3 rounded-lg shadow-sm border border-gray-300 px-4 py-4 flex flex-col justify-between h-full">
                <div className="text-md font-medium text-gray-700 mb-4">{boatDetails.engines}</div>
                <div className="flex items-center text-sm text-gray-500">
                  <Anchor className="h-4 w-4 text-gray-500 mr-2" />
                  <span>Engines</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl text-gray-800 font-medium mb-6 pt-4">Details</h2>
            <div className="space-y-2">
              {[
                { label: "Location", value: boatDetails.location ? `${boatDetails.location}` : '-' },
                { label: "Beam", value: boatDetails.beamMeters ? `${boatDetails.beamMeters} m` : '-' },
                { label: "Fuel capacity", value: boatDetails.fuelCapacity ? `${boatDetails.fuelCapacity} L` : '-' },
                { label: "Propulsion type", value: boatDetails.propulsionType ? `${boatDetails.propulsionType}` : '-' },
              ].map((detail, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">{detail.label}</span>
                  <span className="text-sm font-medium text-gray-700">{detail.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl text-gray-800 font-medium mb-6 pt-4">Description</h2>
            <p style={{ whiteSpace: 'pre-wrap' }} className='text-gray-600 text-sm'>
              {parseDescription(boatDetails.description)}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl text-gray-800 font-medium mb-6">Equipment</h2>
            <div className="space-y-2">
              {Object.entries(boatDetails.equipment).map(([item, value]) => {
                if (value) {
                  const formattedItem = item
                    .split(/(?=[A-Z])/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                  return (
                    <div key={item} className="flex justify-between items-center py-2 border-b border-gray-200 text-sm">
                      <span className="text-gray-700">{formattedItem}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="md:sticky md:top-4 space-y-8">
            <section className="lg:bg-white lg:p-6 lg:rounded-lg lg:shadow-lg lg:border lg:border-gray-300">
              <h2 className="text-xl text-gray-800 font-medium mb-6">Contact</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-800 mr-4" />
                  <span className="text-gray-500 text-sm">Hribarov Prilaz 10, Zagreb, Croatia</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-800 mr-4" />
                  <span className="text-gray-500 text-sm">+385 98 301 987</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-800 mr-4" />
                  <span className="text-gray-500 text-sm">office@novayachts.eu</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Send us a message</h3>
                <p className="text-sm text-gray-500 mb-4">We will get back to you as soon as possible.</p>
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
            </section>

            {/* You can add more sections here if needed */}
          </div>
        </div>
      </div>

      <Dialog open={isCarouselOpen} onOpenChange={setIsCarouselOpen}>
        {isCarouselOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white z-50 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-md p-2 transition-all duration-200 ease-in-out"
              onClick={() => setIsCarouselOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <div 
              className="relative w-full h-[80vh] flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Image 
                src={boatImages[currentImageIndex]} 
                alt={`${boatDetails.name} - Fullscreen Image`} 
                fill
                sizes="100vw"
                className="object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2 shadow-lg transition-all duration-200 ease-in-out"
                onClick={prevImage}
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2 shadow-lg transition-all duration-200 ease-in-out"
                onClick={nextImage}
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-30 rounded-full px-3 py-2">
                {boatImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-4 h-0.5 rounded-full transition-all duration-200 ease-in-out ${
                      index === currentImageIndex ? 'bg-white w-6' : 'bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </main>
    <div className="container mx-auto px-4 md:px-20 mb-8 hidden md:block">
      <Button 
        onClick={handlePdfGeneration}
        className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-white hover:shadow-md transition-shadow duration-200"
        disabled={isPdfLoading}
      >
        {isPdfLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isPdfLoading ? 'Preparing PDF...' : 'Export to PDF'}
      </Button>
    </div>
    <Footer />
    <SuccessModal 
      open={showSuccessModal} 
      onClose={() => setShowSuccessModal(false)} 
    />
    </>
  )
}
