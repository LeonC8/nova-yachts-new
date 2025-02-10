'use client'

import { useState, useEffect } from 'react'
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getDatabase, ref, onValue, Database } from 'firebase/database'
import { FixedNavbar } from './FixedNavbar'
import { Footer } from './Footer'
import { useRouter } from 'next/navigation'
import { Navbar } from './Navbar'
import { Loader } from './Loader'
import { X, Phone, Mail, MapPin } from 'lucide-react'

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

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

interface Boat {
  id: string;
  name: string;
  price: string;
  year: string;
  mainPhoto: string;
  inStock: string;
  basicListing: string;
}

interface ContactOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function ContactOverlay({ isOpen, onClose }: ContactOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        
        <h2 className="text-xl text-gray-800 font-medium mb-3">Contact</h2>
        <p className="text-gray-600 mb-4 text-sm mb-6 pr-12">Please contact us to get more information about this yacht.</p>
        <div className="space-y-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-gray-800 mr-4" />
            <span className="text-gray-600 text-sm">Gomboševa 28, Zagreb, Croatia</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-800 mr-4" />
            <span className="text-gray-600 text-sm">+385 98 301 987</span>
          </div>
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-800 mr-4" />
            <span className="text-gray-600 text-sm">office@novayachts.eu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewYachtsPageComponent() {
  const [inStockYachts, setInStockYachts] = useState<Boat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isContactOverlayOpen, setIsContactOverlayOpen] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    if (!app) {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
    }

    const boatsRef = ref(database, 'boats');
    onValue(boatsRef, (snapshot) => {
      const data = snapshot.val();
      const yachts: Boat[] = [];
      for (const id in data) {
        if (data[id].inStock === "yes") {
          yachts.push({
            id,
            name: data[id].name,
            price: data[id].price,
            year: data[id].year,
            mainPhoto: data[id].mainPhoto,
            inStock: data[id].inStock,
            basicListing: data[id].basicListing
          });
        }
      }
      // Sort yachts: non-basic listings first, then basic listings
      const sortedYachts = yachts.sort((a, b) => {
        if (a.basicListing === b.basicListing) return 0;
        return a.basicListing === "yes" ? 1 : -1;
      });
      
      setInStockYachts(sortedYachts);
      // Ensure we're at the top before removing loading state
      window.scrollTo(0, 0);
      setIsLoading(false);
    });
  }, []);

  const handleBoatClick = (boat: Boat) => {
    if (boat.basicListing === "yes") {
      setIsContactOverlayOpen(true);
    } else {
      router.push(`/boat/${boat.id}`);
    }
  };

  return (
    <div>
      {isLoading && <Loader />}
      <Navbar transparentOnTop={false} />
      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:mt-4 mb-4 py-5 overflow-hidden xl:px-20">
          <h2 className="text-2xl font-medium mb-2 font-serif">New Yachts</h2>
          <p className="pt-0 pb-6 mt-0 text-gray-700 text-sm ">{inStockYachts.length} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {inStockYachts.map((yacht) => (
              <div 
                key={yacht.id} 
                className={`bg-white rounded shadow-md overflow-hidden ${yacht.basicListing !== "yes" ? "cursor-pointer" : ""}`}
                onClick={() => handleBoatClick(yacht)}
              >
                <img src={yacht.mainPhoto} alt={yacht.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  {/* <p className="text-xs font-semibold text-slate-500 mb-2">IMMEDIATE DELIVERY</p> */}
                  <h3 className="text-md font-medium mb-2">{yacht.name}</h3>
                  <p className="text-sm text-gray-600">{Number(yacht.price) === 0 ? "Price on ask" : `€ ${Number(yacht.price).toLocaleString()}`} • {yacht.year}</p>
                  {yacht.basicListing === 'yes' && (
                    <p className="text-xs text-gray-600 mt-3 bg-gray-100 rounded-md p-1 w-fit font-medium border border-gray-200 px-2">Contact for more information</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <ContactOverlay 
        isOpen={isContactOverlayOpen} 
        onClose={() => setIsContactOverlayOpen(false)} 
      />
    </div>
  )
}
