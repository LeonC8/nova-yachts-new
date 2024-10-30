'use client'

import { useState, useEffect } from 'react'
import { initializeApp, getApps } from "firebase/app"
import { getDatabase, ref as dbRef, remove, get } from 'firebase/database'
import Image from 'next/image'

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
  mainPhoto: string;
  price: string;
  year: string;
  sizeFeet: string;
}

export function RemoveBoatPage() {
  const [boats, setBoats] = useState<Boat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBoats()
  }, [])

  const fetchBoats = async () => {
    try {
      const database = getDatabase()
      const boatsRef = dbRef(database, 'boats')
      const snapshot = await get(boatsRef)
      
      if (snapshot.exists()) {
        const boatsData: Boat[] = []
        snapshot.forEach((childSnapshot) => {
          boatsData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          })
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
      
      // Update local state
      setBoats(prevBoats => prevBoats.filter(boat => boat.id !== boatId))
      alert('Boat removed successfully!')
    } catch (err) {
      console.error('Error removing boat:', err)
      alert('Failed to remove boat. Please try again.')
    }
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Remove Boats</h2>
      
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
              
              <button
                onClick={() => handleRemoveBoat(boat.id)}
                className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-md 
                         hover:bg-red-600 focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Remove Boat
              </button>
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
