import { jsPDF } from 'jspdf';

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

// Constants for maximum dimensions
const MAX_IMAGE_WIDTH = 170; // Max width in mm
const MAX_IMAGE_HEIGHT = 100; // Max height in mm
const GALLERY_IMAGE_MAX_WIDTH = 85; // Max width for gallery images
const GALLERY_IMAGE_HEIGHT = 60; // Target height for gallery images

const getProxiedImageData = async (url: string): Promise<string> => {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error getting proxied image:', error);
    throw error;
  }
};

// Helper function to calculate dimensions maintaining aspect ratio
const calculateDimensions = (originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) => {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if width exceeds maximum
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Scale down if height still exceeds maximum
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width, height };
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
    const mainPhotoData = await getProxiedImageData(boatDetails.mainPhoto);
    
    // Create temporary image to get dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = mainPhotoData;
    });

    // Calculate dimensions maintaining aspect ratio
    const { width: imageWidth, height: imageHeight } = calculateDimensions(
      img.width,
      img.height,
      MAX_IMAGE_WIDTH,
      MAX_IMAGE_HEIGHT
    );

    // Center the image horizontally
    const xPos = (pageWidth - imageWidth) / 2;

    // Add rounded corners rectangle as background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      xPos - 2,
      yPos - 2,
      imageWidth + 4,
      imageHeight + 4,
      3,
      3,
      'F'
    );

    doc.addImage(
      mainPhotoData,
      'JPEG',
      xPos,
      yPos,
      imageWidth,
      imageHeight,
      undefined,
      'MEDIUM'
    );
    yPos += imageHeight + 25;
  } catch (error) {
    console.error('Error adding main image:', error);
  }

  // Title and Price Section with more spacing
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text(boatDetails.name, margin, yPos);
  yPos += 12; // Increased spacing after title

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
  const description = boatDetails.description.replace(/\\n/g, '\n');
  const splitDescription = doc.splitTextToSize(description, contentWidth);
  const descriptionHeight = splitDescription.length * 5;
  const descriptionTitleHeight = 8; // Height of the title and spacing
  const totalDescriptionHeight = descriptionHeight + descriptionTitleHeight;

  // Check if description section will fit on current page
  if (yPos + totalDescriptionHeight > doc.internal.pageSize.height - 30) {
    doc.addPage();
    yPos = 20;
  }

  // Now we're sure both title and text will fit on the same page
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Description', margin, yPos);
  yPos += descriptionTitleHeight;

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text(splitDescription, margin, yPos);
  yPos += descriptionHeight + 15;

  // Check if equipment section needs a new page
  if (yPos > doc.internal.pageSize.height - 100) {
    doc.addPage();
    yPos = 20;
  }

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
    const spacing = 10; // Space between images

    for (let i = 0; i < boatDetails.otherPhotos.length; i++) {
      try {
        const photoData = await getProxiedImageData(boatDetails.otherPhotos[i]);
        
        // Create temporary image to get dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = photoData;
        });

        // Calculate dimensions maintaining aspect ratio
        const { width: imageWidth, height: imageHeight } = calculateDimensions(
          img.width,
          img.height,
          GALLERY_IMAGE_MAX_WIDTH,
          GALLERY_IMAGE_HEIGHT
        );

        const xPos = margin + (i % imagesPerRow) * (GALLERY_IMAGE_MAX_WIDTH + spacing);
        
        doc.addImage(
          photoData,
          'JPEG',
          xPos,
          yPos,
          imageWidth,
          imageHeight,
          undefined,
          'MEDIUM'
        );

        if ((i + 1) % imagesPerRow === 0) {
          yPos += GALLERY_IMAGE_HEIGHT + spacing;
        }

        if (yPos > doc.internal.pageSize.height - GALLERY_IMAGE_HEIGHT - 20 && i < boatDetails.otherPhotos.length - 1) {
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