'use client'

import { useState, useEffect } from 'react'
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage'
import { getDatabase, ref as dbRef, push, Database } from 'firebase/database'

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
let storage: FirebaseStorage;
let database: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
  database = getDatabase(app);
}

export function AddBoatForm() {
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    name: '',
    condition: '',
    taxStatus: '',
    engines: '',
    propulsionType: '',
    location: '',
    price: '',
    year: '',
    sizeFeet: '',
    sizeMeters: '',
    beamFeet: '',
    beamMeters: '',
    fuelCapacity: '',
    description: '',
    inStock: '',
    basicListing: '', // Add this new field
    equipment: {
      airConditioning: false,
      generator: false,
      hydraulicPasarelle: false,
      gps: false,
      autopilot: false,
      radar: false,
      satTV: false,
      solarPanel: false,
      bowThruster: false,
      sternThruster: false,
      teakCockpit: false,
      teakFlybridge: false,
      teakSidedeck: false,
    },
  })


  const [mainPhoto, setMainPhoto] = useState<File | null>(null)
  const [otherPhotos, setOtherPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!app) {
      app = initializeApp(firebaseConfig); 
      storage = getStorage(app);
      database = getDatabase(app);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const factor = 3.28084 // 1 meter = 3.28084 feet
    if (name === 'sizeFeet') {
      setFormData(prev => ({ ...prev, sizeFeet: value, sizeMeters: (parseFloat(value) / factor).toFixed(2) }))
    } else if (name === 'sizeMeters') {
      setFormData(prev => ({ ...prev, sizeMeters: value, sizeFeet: (parseFloat(value) * factor).toFixed(2) }))
    }
  }

  const handleBeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const factor = 3.28084 // 1 meter = 3.28084 feet
    if (name === 'beamFeet') {
      setFormData(prev => ({ ...prev, beamFeet: value, beamMeters: (parseFloat(value) / factor).toFixed(2) }))
    } else if (name === 'beamMeters') {
      setFormData(prev => ({ ...prev, beamMeters: value, beamFeet: (parseFloat(value) * factor).toFixed(2) }))
    }
  }

  const handleEquipmentChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [name]: !prev.equipment[name as keyof typeof prev.equipment] }
    }))
  }

  const handleMainPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainPhoto(e.target.files[0])
    }
  }

  const handleOtherPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setOtherPhotos(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!storage || !database) {
        throw new Error('Firebase not initialized');
      }

      // Format description to preserve newlines
      const formattedDescription = formData.description.replace(/\n/g, '\\n')

      // Upload main photo
      let mainPhotoUrl = ''
      if (mainPhoto) {
        const mainPhotoRef = storageRef(storage, `boat-images/main/${mainPhoto.name}`)
        await uploadBytes(mainPhotoRef, mainPhoto)
        mainPhotoUrl = await getDownloadURL(mainPhotoRef)
      }

      // Upload other photos
      const otherPhotoUrls = await Promise.all(
        otherPhotos.map(async (photo) => {
          const photoRef = storageRef(storage, `boat-images/other/${photo.name}`)
          await uploadBytes(photoRef, photo)
          return getDownloadURL(photoRef)
        })
      )

      // Prepare boat data with formatted description
      const boatData = {
        ...formData,
        description: formattedDescription, // Use formatted description
        mainPhoto: mainPhotoUrl,
        otherPhotos: otherPhotoUrls,
      }

      // Add boat data to Realtime Database
      const boatsRef = dbRef(database, 'boats');
      await push(boatsRef, boatData);

      alert('Boat added successfully!')
      // Reset form (you may want to implement a more thorough reset)
      setFormData({ ...formData, name: '', price: '', year: '' }) // Add other fields as needed
      setMainPhoto(null)
      setOtherPhotos([])
    } catch (error) {
      console.error('Error adding boat:', error)
      alert('Error adding boat. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add New Boat</h2>
      <div className="mb-6 overflow-x-auto">
        <nav className="flex space-x-4 border-b border-gray-200">
          {['basic', 'equipment', 'description', 'photos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Boat Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select condition</option>
                <option value="pre-owned">Pre-owned</option>
                <option value="new">New</option>
              </select>
            </div>
            <div>
              <label htmlFor="taxStatus" className="block text-sm font-medium text-gray-700 mb-1">Tax Status</label>
              <select
                name="taxStatus"
                value={formData.taxStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, taxStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select tax status</option>
                <option value="paid">Paid</option>
                <option value="not-paid">Not Paid</option>
              </select>
            </div>
            <div>
              <label htmlFor="engines" className="block text-sm font-medium text-gray-700 mb-1">Engines</label>
              <input
                type="text"
                id="engines"
                name="engines"
                value={formData.engines}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="propulsionType" className="block text-sm font-medium text-gray-700 mb-1">Propulsion Type</label>
              <input
                type="text"
                id="propulsionType"
                name="propulsionType"
                value={formData.propulsionType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="sizeFeet" className="block text-sm font-medium text-gray-700 mb-1">Size (ft)</label>
              <input
                type="number"
                id="sizeFeet"
                name="sizeFeet"
                value={formData.sizeFeet}
                onChange={handleSizeChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="sizeMeters" className="block text-sm font-medium text-gray-700 mb-1">Size (m)</label>
              <input
                type="number"
                id="sizeMeters"
                name="sizeMeters"
                value={formData.sizeMeters}
                onChange={handleSizeChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="beamFeet" className="block text-sm font-medium text-gray-700 mb-1">Beam (ft)</label>
              <input
                type="number"
                id="beamFeet"
                name="beamFeet"
                value={formData.beamFeet}
                onChange={handleBeamChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="beamMeters" className="block text-sm font-medium text-gray-700 mb-1">Beam (m)</label>
              <input
                type="number"
                id="beamMeters"
                name="beamMeters"
                value={formData.beamMeters}
                onChange={handleBeamChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fuelCapacity" className="block text-sm font-medium text-gray-700 mb-1">Fuel Capacity (L)</label>
              <input
                type="number"
                id="fuelCapacity"
                name="fuelCapacity"
                value={formData.fuelCapacity}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="inStock" className="block text-sm font-medium text-gray-700 mb-1">In Stock</label>
              <select
                name="inStock"
                value={formData.inStock}
                onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select availability</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label htmlFor="basicListing" className="block text-sm font-medium text-gray-700 mb-1">Basic Listing (can&apos;t be clicked into)</label>
              <select
                name="basicListing"
                value={formData.basicListing}
                onChange={(e) => setFormData(prev => ({ ...prev, basicListing: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(formData.equipment).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={value}
                  onChange={() => handleEquipmentChange(key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={key} className="ml-2 text-sm font-medium text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'description' && (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="mainPhoto" className="block text-sm font-medium text-gray-700 mb-1">Main Photo</label>
              <input
                type="file"
                id="mainPhoto"
                onChange={handleMainPhotoChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="otherPhotos" className="block text-sm font-medium text-gray-700 mb-1">Other Photos</label>
              <input
                type="file"
                id="otherPhotos"
                onChange={handleOtherPhotosChange}
                multiple
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {loading ? 'Adding Boat...' : 'Add Boat'}
        </button>
      </form>
    </div>
  )
}
