"use client";

import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref as dbRef, remove, get } from "firebase/database";
import Image from "next/image";
import { EditBoatForm } from "./EditBoatForm";
import AddBoatForm from "./AddBoatForm";
import { generateBrochurePDF } from "./BoatPDF";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgJw2Q15zd_5Xh6z5F3UHwyFAMAikbH4Q",
  authDomain: "nova-yachts-new.firebaseapp.com",
  projectId: "nova-yachts-new",
  storageBucket: "nova-yachts-new.appspot.com",
  messagingSenderId: "211610700774",
  appId: "1:211610700774:web:aec6546014d2073e08a427",
  measurementId: "G-QK02XR3XSZ",
  databaseURL:
    "https://nova-yachts-new-default-rtdb.europe-west1.firebasedatabase.app",
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
  engineHours: string;
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
  sold?: boolean;
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

interface LoginState {
  isLoggedIn: boolean;
  expiresAt: number;
}

// Add this to the component props
interface BoatDashboardProps {
  initialAuthState: boolean;
}

export function BoatDashboard({ initialAuthState }: BoatDashboardProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuthState);
  const [loginError, setLoginError] = useState("");
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [isBrochureLoading, setIsBrochureLoading] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedBoatIds, setSelectedBoatIds] = useState<Set<string>>(
    new Set()
  );
  const [brochureTitle, setBrochureTitle] = useState("Nova Yachts");
  const [brochureSubtitle, setBrochureSubtitle] = useState("Collection");

  useEffect(() => {
    if (isLoggedIn) {
      fetchBoats();
    }
  }, [isLoggedIn]);

  const fetchBoats = async () => {
    try {
      const database = getDatabase();
      const boatsRef = dbRef(database, "boats");
      const snapshot = await get(boatsRef);

      if (snapshot.exists()) {
        const boatsData: Boat[] = [];
        snapshot.forEach((childSnapshot) => {
          const boatData = childSnapshot.val();
          const boat: Boat = {
            id: childSnapshot.key as string,
            name: boatData.name || "",
            condition: boatData.condition || "",
            taxStatus: boatData.taxStatus || "",
            engines: boatData.engines || "",
            engineHours: boatData.engineHours || "",
            propulsionType: boatData.propulsionType || "",
            location: boatData.location || "",
            price: boatData.price || "",
            year: boatData.year || "",
            sizeFeet: boatData.sizeFeet || "",
            sizeMeters: boatData.sizeMeters || "",
            beamFeet: boatData.beamFeet || "",
            beamMeters: boatData.beamMeters || "",
            fuelCapacity: boatData.fuelCapacity || "",
            description: boatData.description || "",
            basicListing: boatData.basicListing || "",
            sold: boatData.sold || false,
            equipment: {
              airConditioning: boatData.equipment?.airConditioning || false,
              generator: boatData.equipment?.generator || false,
              hydraulicPasarelle:
                boatData.equipment?.hydraulicPasarelle || false,
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
            mainPhoto: boatData.mainPhoto || "",
            otherPhotos: boatData.otherPhotos || [],
          };
          boatsData.push(boat);
        });
        setBoats(boatsData);
      }
    } catch (err) {
      setError("Failed to fetch boats");
      console.error("Error fetching boats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBoat = async (boatId: string) => {
    if (!window.confirm("Are you sure you want to remove this boat?")) {
      return;
    }

    try {
      const database = getDatabase();
      const boatRef = dbRef(database, `boats/${boatId}`);
      await remove(boatRef);

      setBoats((prevBoats) => prevBoats.filter((boat) => boat.id !== boatId));
      alert("Boat removed successfully!");
    } catch (err) {
      console.error("Error removing boat:", err);
      alert("Failed to remove boat. Please try again.");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.currentTarget as any).email.value;
    const password = (e.currentTarget as any).password.value;

    if (email === "office@novayachts.eu" && password === "numarine26XP") {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const loginState: LoginState = {
        isLoggedIn: true,
        expiresAt: new Date().getTime() + thirtyDaysInMs,
      };
      localStorage.setItem("loginState", JSON.stringify(loginState));

      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loginState");
    setIsLoggedIn(false);
  };

  const handleEditClick = (boat: Boat) => {
    setSelectedBoat(boat);
    setView("edit");
  };

  const handleBrochureGeneration = async () => {
    if (boats.length === 0 || isBrochureLoading) return;

    setIsBrochureLoading(true);

    try {
      // Convert boats to brochure format
      const brochureBoats = boats
        .filter((boat) => !boat.sold) // Only include non-sold boats
        .map((boat) => ({
          id: boat.id,
          name: boat.name,
          price: boat.price,
          year: boat.year,
          sizeMeters: boat.sizeMeters,
          location: boat.location,
          mainPhoto: boat.mainPhoto || "",
          taxStatus: boat.taxStatus,
        }));

      if (brochureBoats.length === 0) {
        alert("No boats available for brochure generation.");
        return;
      }

      await generateBrochurePDF(brochureBoats, {
        title: brochureTitle,
        subtitle: brochureSubtitle,
      });
    } catch (error) {
      console.error("Error generating brochure:", error);
      alert("Failed to generate brochure. Please try again.");
    } finally {
      setIsBrochureLoading(false);
    }
  };

  const handleSelectionBrochureGeneration = async () => {
    if (selectedBoatIds.size === 0) {
      alert("Please select at least one boat.");
      return;
    }

    setIsBrochureLoading(true);
    setShowSelectionModal(false);

    try {
      // Convert selected boats to brochure format
      const brochureBoats = boats
        .filter((boat) => selectedBoatIds.has(boat.id) && !boat.sold)
        .map((boat) => ({
          id: boat.id,
          name: boat.name,
          price: boat.price,
          year: boat.year,
          sizeMeters: boat.sizeMeters,
          location: boat.location,
          mainPhoto: boat.mainPhoto || "",
          taxStatus: boat.taxStatus,
        }));

      if (brochureBoats.length === 0) {
        alert("No selected boats available for brochure generation.");
        return;
      }

      await generateBrochurePDF(brochureBoats, {
        title: brochureTitle,
        subtitle: brochureSubtitle,
      });
    } catch (error) {
      console.error("Error generating brochure:", error);
      alert("Failed to generate brochure. Please try again.");
    } finally {
      setIsBrochureLoading(false);
    }
  };

  const handleBoatSelection = (boatId: string, isSelected: boolean) => {
    const newSelectedBoatIds = new Set(selectedBoatIds);
    if (isSelected) {
      newSelectedBoatIds.add(boatId);
    } else {
      newSelectedBoatIds.delete(boatId);
    }
    setSelectedBoatIds(newSelectedBoatIds);
  };

  const handleSelectAll = () => {
    const availableBoats = boats.filter((boat) => !boat.sold);
    setSelectedBoatIds(new Set(availableBoats.map((boat) => boat.id)));
  };

  const handleDeselectAll = () => {
    setSelectedBoatIds(new Set());
  };

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
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
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
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
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
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (view === "add") {
    return (
      <div>
        <AddBoatForm
          onSuccess={() => {
            fetchBoats();
            setView("list");
          }}
        />
      </div>
    );
  }

  if (view === "edit" && selectedBoat) {
    return (
      <div>
        <EditBoatForm
          boat={selectedBoat}
          onSuccess={() => {
            fetchBoats();
            setView("list");
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Boat Dashboard</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setView("add")}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Boat
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
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
                  style={{ objectFit: "cover" }}
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

      {/* Brochure Generation Buttons */}
      {boats.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          {/* Brochure Title and Subtitle Inputs */}
          <div className="max-w-2xl mx-auto mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Customize Brochure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="brochure-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Brochure Title
                </label>
                <input
                  id="brochure-title"
                  type="text"
                  value={brochureTitle}
                  onChange={(e) => setBrochureTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             text-sm"
                  placeholder="Enter brochure title"
                />
              </div>
              <div>
                <label
                  htmlFor="brochure-subtitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Brochure Subtitle
                </label>
                <input
                  id="brochure-subtitle"
                  type="text"
                  value={brochureSubtitle}
                  onChange={(e) => setBrochureSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             text-sm"
                  placeholder="Enter brochure subtitle"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleBrochureGeneration}
              disabled={isBrochureLoading}
              className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                         transition-colors duration-200 flex items-center gap-2 text-lg font-medium
                         disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isBrochureLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Generating Brochure...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Create Brochure from All Yachts
                </>
              )}
            </button>

            <button
              onClick={() => setShowSelectionModal(true)}
              disabled={isBrochureLoading}
              className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                         transition-colors duration-200 flex items-center gap-2 text-lg font-medium
                         disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Export Selection
            </button>
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">
            Generate a complete brochure PDF with all available yachts or select
            specific ones
          </p>
        </div>
      )}

      {/* Selection Modal */}
      {showSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Select Yachts for Brochure
                </h2>
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Deselect All
                </button>
                <span className="text-sm text-gray-600">
                  {selectedBoatIds.size} selected
                </span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boats
                  .filter((boat) => !boat.sold)
                  .map((boat) => (
                    <div
                      key={boat.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="relative h-32 w-full">
                        {boat.mainPhoto ? (
                          <Image
                            src={boat.mainPhoto}
                            alt={boat.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              No Image
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={selectedBoatIds.has(boat.id)}
                            onChange={(e) =>
                              handleBoatSelection(boat.id, e.target.checked)
                            }
                            className="w-5 h-5 text-blue-600 border-2 border-white rounded focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">
                          {boat.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {boat.year} • €{Number(boat.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectionBrochureGeneration}
                disabled={selectedBoatIds.size === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                           transition-colors duration-200 font-medium
                           disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                Generate Brochure ({selectedBoatIds.size} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
