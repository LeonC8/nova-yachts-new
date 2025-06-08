"use client";

import { useState, useEffect } from "react";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getDatabase, ref as dbRef, update } from "firebase/database";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { resizeImage } from "../utils/imageResizer";

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
  [key: string]: any;
}

interface EditBoatFormProps {
  boat: Boat;
  onSuccess: () => void;
}

interface PhotoItem {
  id: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

export function EditBoatForm({ boat, onSuccess }: EditBoatFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState(boat);
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<PhotoItem[]>(() =>
    (boat.otherPhotos || []).map((url, index) => ({
      id: `existing-${index}`,
      url,
    }))
  );
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const factor = 3.28084;
    if (name === "sizeFeet") {
      setFormData((prev) => ({
        ...prev,
        sizeFeet: value,
        sizeMeters: (parseFloat(value) / factor).toFixed(2),
      }));
    } else if (name === "sizeMeters") {
      setFormData((prev) => ({
        ...prev,
        sizeMeters: value,
        sizeFeet: (parseFloat(value) * factor).toFixed(2),
      }));
    }
  };

  const handleBeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const factor = 3.28084;
    if (name === "beamFeet") {
      setFormData((prev) => ({
        ...prev,
        beamFeet: value,
        beamMeters: (parseFloat(value) / factor).toFixed(2),
      }));
    } else if (name === "beamMeters") {
      setFormData((prev) => ({
        ...prev,
        beamMeters: value,
        beamFeet: (parseFloat(value) * factor).toFixed(2),
      }));
    }
  };

  const handleEquipmentChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [name]: !prev.equipment[name as keyof typeof prev.equipment],
      },
    }));
  };

  const handleMainPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainPhoto(e.target.files[0]);
    }
  };

  const handleOtherPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        file,
        isNew: true,
      }));
      setOtherPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(otherPhotos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOtherPhotos(items);
  };

  const removePhoto = (id: string) => {
    setOtherPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const storage = getStorage();
      const database = getDatabase();

      let mainPhotoUrl = formData.mainPhoto;
      if (mainPhoto) {
        const resizedMainPhoto = await resizeImage(mainPhoto, {
          maxSize: 1920,
        });
        const mainPhotoRef = storageRef(
          storage,
          `boat-images/main/${mainPhoto.name}`
        );
        await uploadBytes(mainPhotoRef, resizedMainPhoto);
        mainPhotoUrl = await getDownloadURL(mainPhotoRef);
      }

      const updatedOtherPhotoUrls = await Promise.all(
        otherPhotos.map(async (photo) => {
          if (photo.isNew && photo.file) {
            const resizedFile = await resizeImage(photo.file, {
              maxSize: 1920,
            });
            const photoRef = storageRef(
              storage,
              `boat-images/other/${photo.file.name}`
            );
            await uploadBytes(photoRef, resizedFile);
            return getDownloadURL(photoRef);
          }
          return photo.url;
        })
      );

      const formattedDescription = formData.description.replace(/\n/g, "\\n");

      const updatedBoatData = {
        ...formData,
        description: formattedDescription,
        mainPhoto: mainPhotoUrl,
        otherPhotos: updatedOtherPhotoUrls,
      };

      const boatRef = dbRef(database, `boats/${boat.id}`);
      await update(boatRef, updatedBoatData);

      alert("Boat updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error updating boat:", error);
      alert("Error updating boat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4 mb-6">
        <button
          onClick={onSuccess}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">Edit Boat</h2>
      </div>

      <div className="mb-6 overflow-x-auto">
        <nav className="flex space-x-4 border-b border-gray-200">
          {["basic", "equipment", "description", "photos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "basic" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Boat Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price (€)
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="taxStatus"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tax Status
              </label>
              <select
                name="taxStatus"
                value={formData.taxStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select tax status</option>
                <option value="paid">Paid</option>
                <option value="not-paid">Not Paid</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select condition</option>
                <option value="pre-owned">Pre-owned</option>
                <option value="new">New</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Year
              </label>
              <input
                type="text"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="engines"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Engines
              </label>
              <input
                type="text"
                id="engines"
                name="engines"
                value={formData.engines}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="engineHours"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Engine Hours
              </label>
              <input
                type="number"
                id="engineHours"
                name="engineHours"
                value={formData.engineHours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="propulsionType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Propulsion Type
              </label>
              <input
                type="text"
                id="propulsionType"
                name="propulsionType"
                value={formData.propulsionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="sizeFeet"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Size (ft)
              </label>
              <input
                type="number"
                id="sizeFeet"
                name="sizeFeet"
                value={formData.sizeFeet}
                onChange={handleSizeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="sizeMeters"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Size (m)
              </label>
              <input
                type="number"
                id="sizeMeters"
                name="sizeMeters"
                value={formData.sizeMeters}
                onChange={handleSizeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="beamFeet"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Beam (ft)
              </label>
              <input
                type="number"
                id="beamFeet"
                name="beamFeet"
                value={formData.beamFeet}
                onChange={handleBeamChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="beamMeters"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Beam (m)
              </label>
              <input
                type="number"
                id="beamMeters"
                name="beamMeters"
                value={formData.beamMeters}
                onChange={handleBeamChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="fuelCapacity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fuel Capacity (L)
              </label>
              <input
                type="number"
                id="fuelCapacity"
                name="fuelCapacity"
                value={formData.fuelCapacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="basicListing"
                  name="basicListing"
                  checked={formData.basicListing === "yes"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicListing: e.target.checked ? "yes" : "no",
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="basicListing"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Basic Listing (can't be clicked into)
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "equipment" && (
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
                <label
                  htmlFor={key}
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        )}

        {activeTab === "description" && (
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
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

        {activeTab === "photos" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="mainPhoto"
                className="block text-sm font-medium text-gray-700"
              >
                Main Photo
              </label>
              <input
                type="file"
                id="mainPhoto"
                onChange={handleMainPhotoChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {formData.mainPhoto && !mainPhoto && (
                <div className="relative w-48 h-48 mt-2">
                  <img
                    src={formData.mainPhoto}
                    alt="Current main photo"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              )}
              {mainPhoto && (
                <div className="relative w-48 h-48 mt-2">
                  <img
                    src={URL.createObjectURL(mainPhoto)}
                    alt="New main photo"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="otherPhotos"
                className="block text-sm font-medium text-gray-700"
              >
                Other Photos
              </label>
              <input
                type="file"
                id="otherPhotos"
                onChange={handleOtherPhotosChange}
                multiple
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              {otherPhotos.length > 0 && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable
                    droppableId="droppable-photos"
                    direction="vertical"
                  >
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4 mt-4"
                      >
                        {otherPhotos.map((photo, index) => (
                          <Draggable
                            key={photo.id}
                            draggableId={photo.id}
                            index={index}
                          >
                            {(
                              provided: DraggableProvided,
                              snapshot: DraggableStateSnapshot
                            ) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center space-x-4 p-2 bg-white rounded-lg border ${
                                  snapshot.isDragging
                                    ? "border-blue-500 shadow-lg"
                                    : "border-gray-200"
                                }`}
                              >
                                <div className="relative w-24 h-24 flex-shrink-0">
                                  <img
                                    src={photo.url}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-grow flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">
                                    Image {index + 1}{" "}
                                    {photo.isNew ? "(New)" : ""}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(photo.id)}
                                    className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {loading ? "Updating Boat..." : "Update Boat"}
        </button>
      </form>
    </div>
  );
}
