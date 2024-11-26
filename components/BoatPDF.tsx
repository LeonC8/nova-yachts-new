import { jsPDF } from 'jspdf';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';

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

const IMAGE_WIDTH = 170; // Width in mm
const IMAGE_HEIGHT = 100; // Height in mm

const getImageFromURL = async (url: string): Promise<string> => {
  // Convert Firebase Storage URL to download URL
  if (url.includes('firebasestorage.googleapis.com')) {
    const storage = getStorage();
    const fileRef = storageRef(storage, url);
    try {
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return url;
    }
  }
  return url;
};

export const generatePDF = async (boatDetails: BoatDetails) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set custom fonts and colors
  const primaryColor = '#0f172a'; // slate-900
  const secondaryColor = '#64748b'; // slate-500
  
  let yPos = 15;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - (margin * 2);

  // Header with main image
  try {
    const mainPhotoURL = await getImageFromURL(boatDetails.mainPhoto);
    
    // Create an Image object
    const img = new Image();
    img.crossOrigin = 'Anonymous';  // Enable CORS
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = mainPhotoURL;
    });

    doc.addImage(
      img,
      'JPEG',
      (pageWidth - IMAGE_WIDTH) / 2,
      yPos,
      IMAGE_WIDTH,
      IMAGE_HEIGHT,
      undefined,
      'MEDIUM'
    );
    yPos += IMAGE_HEIGHT + 10;
  } catch (error) {
    console.error('Error adding main image:', error);
  }

  // Title and Price Section
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text(boatDetails.name, margin, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setTextColor(secondaryColor);
  doc.text(`€${Number(boatDetails.price).toLocaleString()}`, margin, yPos);
  doc.setFontSize(12);
  doc.text(`(${boatDetails.taxStatus === 'paid' ? 'VAT Paid' : 'VAT Not Paid'})`, margin + 50, yPos);
  yPos += 15;

  // Specifications Grid
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Specifications', margin, yPos);
  yPos += 8;

  const specs = [
    { label: 'Year', value: boatDetails.year },
    { label: 'Length', value: `${boatDetails.sizeMeters}m` },
    { label: 'Beam', value: `${boatDetails.beamMeters}m` },
    { label: 'Location', value: boatDetails.location },
    { label: 'Engines', value: boatDetails.engines },
    { label: 'Fuel Capacity', value: `${boatDetails.fuelCapacity}L` },
    { label: 'Propulsion', value: boatDetails.propulsionType },
  ];

  specs.forEach(spec => {
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text(spec.label, margin, yPos);
    doc.setTextColor(primaryColor);
    doc.text(spec.value, margin + 40, yPos);
    yPos += 7;
  });
  yPos += 10;

  // Description Section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Description', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  const description = boatDetails.description.replace(/\\n/g, '\n');
  const splitDescription = doc.splitTextToSize(description, contentWidth);
  doc.text(splitDescription, margin, yPos);
  yPos += splitDescription.length * 5 + 15;

  // Equipment Section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Equipment', margin, yPos);
  yPos += 8;

  // Create two columns for equipment
  const equipment = Object.entries(boatDetails.equipment)
    .filter(([_, value]) => value)
    .map(([item, _]) => item
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    );

  const midPoint = Math.ceil(equipment.length / 2);
  const leftColumn = equipment.slice(0, midPoint);
  const rightColumn = equipment.slice(midPoint);

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  let equipmentYPos = yPos;
  
  leftColumn.forEach((item, index) => {
    doc.text(`• ${item}`, margin, equipmentYPos);
    equipmentYPos += 6;
  });

  equipmentYPos = yPos;
  rightColumn.forEach((item, index) => {
    doc.text(`• ${item}`, margin + contentWidth/2, equipmentYPos);
    equipmentYPos += 6;
  });

  yPos = Math.max(equipmentYPos + 15, yPos);

  // Gallery page
  if (boatDetails.otherPhotos && boatDetails.otherPhotos.length > 0) {
    doc.addPage();
    yPos = 15;
    
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('Gallery', margin, yPos);
    yPos += 10;

    const imagesPerRow = 2;
    const imageWidth = contentWidth / imagesPerRow - 5;
    const imageHeight = 60;

    for (let i = 0; i < boatDetails.otherPhotos.length; i++) {
      try {
        const photoURL = await getImageFromURL(boatDetails.otherPhotos[i]);
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = photoURL;
        });

        const xPos = margin + (i % imagesPerRow) * (imageWidth + 5);
        
        doc.addImage(
          img,
          'JPEG',
          xPos,
          yPos,
          imageWidth,
          imageHeight,
          undefined,
          'MEDIUM'
        );

        if ((i + 1) % imagesPerRow === 0) {
          yPos += imageHeight + 10;
        }

        if (yPos > doc.internal.pageSize.height - imageHeight - 20 && i < boatDetails.otherPhotos.length - 1) {
          doc.addPage();
          yPos = 15;
        }
      } catch (error) {
        console.error(`Error adding image ${i}:`, error);
      }
    }
  }

  // Footer on last page
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  const footerY = doc.internal.pageSize.height - 20;
  doc.text('Nova Yachts', margin, footerY);
  doc.text('Hribarov Prilaz 10, Zagreb, Croatia', margin, footerY + 5);
  doc.text('office@novayachts.eu | +385 95 521 6033', margin, footerY + 10);

  // Save the PDF
  doc.save(`${boatDetails.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}; 