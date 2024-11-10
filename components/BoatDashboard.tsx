'use client'

import { useState, useEffect } from 'react'
import { initializeApp, getApps } from "firebase/app"
import { getDatabase, ref as dbRef, remove, get } from 'firebase/database'
import Image from 'next/image'
import { EditBoatForm } from './EditBoatForm'
import AddBoatForm from './AddBoatForm'

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
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

interface Boat {
  id: string;
  name: string;
  condition: string;
  taxStatus: string;
  engines: string;
  propulsionType: string;
  location: string;
  price: string;
  year: string;
  sizeFeet: string;
  sizeMeters: string;
  beamFeet: string;
  beamMeters: string;
  fuelCapacity: string;
  description: string;
  basicListing: string;
  equipment: {
    airConditioning: boolean;
    generator: boolean;
    hydraulicPasarelle: boolean;
    gps: boolean;
    autopilot: boolean;
    radar: boolean;
    satTV: boolean;
    solarPanel: boolean;
    bowThruster: boolean;
    sternThruster: boolean;
    teakCockpit: boolean;
    teakFlybridge: boolean;
    teakSidedeck: boolean;
  };
  mainPhoto?: string;
  otherPhotos?: string[];
}

export function BoatDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [boats, setBoats] = useState<Boat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list')
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null)

  useEffect(() => {
    if (isLoggedIn) {
      fetchBoats()
    }
  }, [isLoggedIn])

  const fetchBoats = async () => {
    try {
      const database = getDatabase()
      const boatsRef = dbRef(database, 'boats')
      const snapshot = await get(boatsRef)
      
      if (snapshot.exists()) {
        const boatsData: Boat[] = []
        snapshot.forEach((childSnapshot) => {
          const boatData = childSnapshot.val()
          const boat: Boat = {
            id: childSnapshot.key as string,
            name: boatData.name || '',
            condition: boatData.condition || '',
            taxStatus: boatData.taxStatus || '',
            engines: boatData.engines || '',
            propulsionType: boatData.propulsionType || '',
            location: boatData.location || '',
            price: boatData.price || '',
            year: boatData.year || '',
            sizeFeet: boatData.sizeFeet || '',
            sizeMeters: boatData.sizeMeters || '',
            beamFeet: boatData.beamFeet || '',
            beamMeters: boatData.beamMeters || '',
            fuelCapacity: boatData.fuelCapacity || '',
            description: boatData.description || '',
            basicListing: boatData.basicListing || '',
            equipment: {
              airConditioning: boatData.equipment?.airConditioning || false,
              generator: boatData.equipment?.generator || false,
              hydraulicPasarelle: boatData.equipment?.hydraulicPasarelle || false,
              gps: boatData.equipment?.gps || false,
              autopilot: boatData.equipment?.autopilot || false,
              radar: boatData.equipment?.radar || false,
              satTV: boatData.equipment?.satTV || false,
              solarPanel: boatData.equipment?.solarPanel || false,
              bowThruster: boatData.equipment?.bowThruster || false,
              sternThruster: boatData.equipment?.sternThruster || false,
              teakCockpit: boatData.equipment?.teakCockpit || false,
              teakFlybridge: boatData.equipment?.teakFlybridge || false,
              teakSidedeck: boatData.equipment?.teakSidedeck || false,
            },
            mainPhoto: boatData.mainPhoto || '',
            otherPhotos: boatData.otherPhotos || [],
          }
          boatsData.push(boat)
        })
        setBoats(boatsData)
      }
    } catch (err) {
      setError('Failed to fetch boats')
      console.error('Error fetching boats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBoat = async (boatId: string) => {
    if (!window.confirm('Are you sure you want to remove this boat?')) {
      return
    }

    try {
      const database = getDatabase()
      const boatRef = dbRef(database, `boats/${boatId}`)
      await remove(boatRef)
      
      setBoats(prevBoats => prevBoats.filter(boat => boat.id !== boatId))
      alert('Boat removed successfully!')
    } catch (err) {
      console.error('Error removing boat:', err)
      alert('Failed to remove boat. Please try again.')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const email = (e.currentTarget as any).email.value
    const password = (e.currentTarget as any).password.value

    if (email === 'office@novayachts.eu' && password === 'numarine26XP') {
      setIsLoggedIn(true)
      setLoginError('')
    } else {
      setLoginError('Invalid credentials')
    }
  }

  const handleEditClick = (boat: Boat) => {
    setSelectedBoat(boat)
    setView('edit')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-500 text-sm text-center">
                {loginError}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    )
  }

  if (view === 'add') {
    return (
      <div>
        
        <AddBoatForm onSuccess={() => {
          fetchBoats()
          setView('list')
        }} />
      </div>
    )
  }

  if (view === 'edit' && selectedBoat) {
    return (
      <div>
        
        <EditBoatForm 
          boat={selectedBoat} 
          onSuccess={() => {
            fetchBoats()
            setView('list')
          }} 
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Boat Dashboard</h2>
        <button
          onClick={() => setView('add')}
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Boat
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {boats.map((boat) => (
          <div 
            key={boat.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="relative h-48 w-full">
              {boat.mainPhoto ? (
                <Image
                  src={boat.mainPhoto}
                  alt={boat.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  No Image
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{boat.name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Year: {boat.year}</p>
                <p>Size: {boat.sizeFeet} ft</p>
                <p>Price: €{boat.price}</p>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEditClick(boat)}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md 
                           hover:bg-blue-600 focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveBoat(boat.id)}
                  className="bg-red-500 text-white py-2 px-4 rounded-md 
                           hover:bg-red-600 focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {boats.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No boats found in the database.
        </div>
      )}
    </div>
  )
} 