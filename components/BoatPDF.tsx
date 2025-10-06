import { jsPDF } from "jspdf";
import logoBlack from "../assets/logo-black.png";

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
  engineHours?: string;
}

// Update constants for image dimensions
const MAX_IMAGE_WIDTH = 170; // Max width in mm
const MAX_IMAGE_HEIGHT = 100; // Max height in mm
const LOGO_HEIGHT = 12; // Fixed height for logo
const LOGO_WIDTH = 35; // Fixed width for logo - adjust as needed
const IMAGE_QUALITY = 0.5;

// Add gallery constants
const GALLERY_IMAGES_PER_ROW = 2;
const GALLERY_SPACING = 5;

const getProxiedImageData = async (url: string): Promise<string> => {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const blob = await response.blob();

    // Create a new compressed image
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Scale down large images
        let { width, height } = img;
        const MAX_SIZE = 1200;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          } else {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed data URL
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error("Error getting proxied image:", error);
    throw error;
  }
};

// Add new helper function for cropping images
const cropImageToAspectRatio = (
  img: HTMLImageElement,
  targetAspectRatio: number
): { sx: number; sy: number; sWidth: number; sHeight: number } => {
  const imgAspectRatio = img.width / img.height;

  if (imgAspectRatio > targetAspectRatio) {
    // Image is wider than target - crop sides
    const desiredWidth = img.height * targetAspectRatio;
    const offset = (img.width - desiredWidth) / 2;
    return {
      sx: offset,
      sy: 0,
      sWidth: desiredWidth,
      sHeight: img.height,
    };
  } else {
    // Image is taller than target - crop top/bottom
    const desiredHeight = img.width / targetAspectRatio;
    const offset = (img.height - desiredHeight) / 2;
    return {
      sx: 0,
      sy: offset,
      sWidth: img.width,
      sHeight: desiredHeight,
    };
  }
};

// Update processMainImage function
const processMainImage = async (
  url: string,
  targetAspectRatio: number
): Promise<string> => {
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const crop = cropImageToAspectRatio(img, targetAspectRatio);
      canvas.width = crop.sWidth;
      canvas.height = crop.sHeight;

      // Fill with white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add rounded corners clipping
      const radius = Math.min(canvas.width, canvas.height) * 0.05;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, radius, radius);
      ctx.arcTo(
        canvas.width,
        canvas.height,
        canvas.width - radius,
        canvas.height,
        radius
      );
      ctx.arcTo(0, canvas.height, 0, canvas.height - radius, radius);
      ctx.arcTo(0, 0, radius, 0, radius);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        img,
        crop.sx,
        crop.sy,
        crop.sWidth,
        crop.sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

// Update processGalleryImage function
const processGalleryImage = async (
  url: string,
  targetAspectRatio: number,
  options: { roundedCorners?: boolean } = {}
): Promise<string> => {
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const crop = cropImageToAspectRatio(img, targetAspectRatio);
      canvas.width = crop.sWidth;
      canvas.height = crop.sHeight;

      // Fill with white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add rounded corners if requested
      if (options.roundedCorners) {
        const radius = Math.min(canvas.width, canvas.height) * 0.05;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.arcTo(canvas.width, 0, canvas.width, radius, radius);
        ctx.arcTo(
          canvas.width,
          canvas.height,
          canvas.width - radius,
          canvas.height,
          radius
        );
        ctx.arcTo(0, canvas.height, 0, canvas.height - radius, radius);
        ctx.arcTo(0, 0, radius, 0, radius);
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(
        img,
        crop.sx,
        crop.sy,
        crop.sWidth,
        crop.sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

// Helper function to calculate dimensions maintaining aspect ratio
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
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

// Add this helper function for batch processing
const processBatch = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
};

// Add helper function to calculate centered position within fixed frame
const calculateCenteredPosition = (
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
) => {
  const xOffset = (containerWidth - imageWidth) / 2;
  const yOffset = (containerHeight - imageHeight) / 2;
  return { xOffset, yOffset };
};

const addHeaderAndFooter = (doc: jsPDF, pageNum: number) => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Adjust logo Y position to 8 (was 7, originally 10)
  doc.addImage(
    "https://res.cloudinary.com/dsgx9xiva/image/upload/v1729862411/nova-yachts/logo/Nova_Yachts_3_uqn6wk_1_z8ikck.png",
    "PNG",
    margin,
    8, // Changed from 7 to 8 for better positioning
    LOGO_WIDTH,
    LOGO_HEIGHT
  );

  // Improve email/phone visual hierarchy
  doc.setFontSize(9);
  doc.setTextColor("#94a3b8"); // Lighter color for labels
  doc.text("Email", pageWidth - margin - 60, 12);
  doc.text("Phone", pageWidth - margin - 60, 18);

  doc.setTextColor("#0f172a"); // Darker color for values
  doc.text("office@novayachts.eu", pageWidth - margin - 35, 12);
  doc.text("+385 98 301 987", pageWidth - margin - 35, 18);

  // Make separator lines bolder
  doc.setDrawColor("#cbd5e1");
  doc.setLineWidth(0.5); // Increased line width
  doc.line(margin, 25, pageWidth - margin, 25);

  // Footer with centered text
  doc.line(
    margin,
    doc.internal.pageSize.height - 25,
    pageWidth - margin,
    doc.internal.pageSize.height - 25
  );

  // Center both texts
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(11);
  doc.setTextColor("#0f172a");
  const websiteText = "www.novayachts.eu";
  const websiteWidth = doc.getTextWidth(websiteText);
  doc.text(websiteText, pageWidth / 2 - websiteWidth / 2, footerY);

  doc.setFontSize(9);
  doc.setTextColor("#64748b");
  const companyText = "Nova Yachts d.o.o Zagreb, Croatia";
  const companyWidth = doc.getTextWidth(companyText);
  doc.text(companyText, pageWidth / 2 - companyWidth / 2, footerY + 5);
};

export const generatePDF = async (boatDetails: BoatDetails) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 40; // Start after header

  // Add header to first page
  addHeaderAndFooter(doc, 1);

  // Boat name (title) - centered
  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor("#0f172a");
  const titleWidth = doc.getTextWidth(boatDetails.name);
  doc.text(boatDetails.name, pageWidth / 2 - titleWidth / 2, yPos);
  yPos += 8;

  // Location (subtitle) - centered
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#64748b");
  const locationText = `Location: ${boatDetails.location}`;
  const locationWidth = doc.getTextWidth(locationText);
  doc.text(locationText, pageWidth / 2 - locationWidth / 2, yPos);
  yPos += 12;

  // Main image with smaller fixed height and 80% width
  const MAIN_IMAGE_HEIGHT = 65; // Current height
  const MAIN_IMAGE_WIDTH = contentWidth * 0.8; // 80% of content width
  try {
    const mainPhotoData = await processMainImage(
      boatDetails.mainPhoto,
      MAIN_IMAGE_WIDTH / MAIN_IMAGE_HEIGHT
    );

    // Center the image horizontally by calculating the left margin
    const leftMargin = margin + (contentWidth - MAIN_IMAGE_WIDTH) / 2;

    // Add image at 80% content width, centered
    doc.addImage(
      mainPhotoData,
      "JPEG",
      leftMargin,
      yPos,
      MAIN_IMAGE_WIDTH,
      MAIN_IMAGE_HEIGHT
    );

    yPos += MAIN_IMAGE_HEIGHT + 15;
  } catch (error) {
    console.error("Error adding main image:", error);
  }

  // Price section - centered
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.setTextColor("#0f172a");
  const priceText = `€${Number(boatDetails.price).toLocaleString()}`;
  const priceWidth = doc.getTextWidth(priceText);
  doc.text(priceText, pageWidth / 2 - priceWidth / 2, yPos);
  yPos += 8;

  // VAT status - centered
  doc.setFontSize(12);
  doc.setTextColor("#64748b");
  const vatText =
    boatDetails.taxStatus === "paid" ? "VAT paid" : "VAT not paid";
  const vatWidth = doc.getTextWidth(vatText);
  doc.text(vatText, pageWidth / 2 - vatWidth / 2, yPos);
  yPos += 10;

  // Add two small images in a row above footer
  const smallImageHeight = 45; // Height for the small images
  const smallImageWidth = (contentWidth - GALLERY_SPACING) / 2; // Width accounting for spacing between images

  try {
    const smallImages = await Promise.all(
      boatDetails.otherPhotos.slice(0, 2).map((url) =>
        processGalleryImage(url, smallImageWidth / smallImageHeight, {
          roundedCorners: true,
        })
      )
    );

    // Position the images above footer
    const footerMargin = 35; // Space to leave for footer
    const smallImagesY =
      doc.internal.pageSize.height - footerMargin - smallImageHeight;

    // Add first image
    doc.addImage(
      smallImages[0],
      "JPEG",
      margin,
      smallImagesY,
      smallImageWidth,
      smallImageHeight
    );

    // Add second image
    doc.addImage(
      smallImages[1],
      "JPEG",
      margin + smallImageWidth + GALLERY_SPACING,
      smallImagesY,
      smallImageWidth,
      smallImageHeight
    );
  } catch (error) {
    console.error("Error adding small images:", error);
  }

  // Separator line
  doc.setDrawColor("#e2e8f0");
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Update specifications grid to 6 items
  const specs = [
    ["Year", String(boatDetails.year)],
    [
      "Engine hours",
      boatDetails.engineHours ? String(boatDetails.engineHours) : "-",
    ],
    ["Engines", String(boatDetails.engines)],
    ["LOA", `${boatDetails.sizeMeters} m`],
    ["Beam", `${boatDetails.beamMeters} m`],
    ["Propulsion type", `${boatDetails.propulsionType}`],
  ];

  // Create 3-column grid with reduced padding
  const colWidth = contentWidth / 3;
  const rowHeight = 20; // Increased from 15 to 20 for more spacing
  specs.forEach((spec, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const xPos = margin + col * colWidth;

    doc.setFontSize(10);
    doc.setTextColor("#64748b");
    doc.text(spec[0], xPos, yPos + row * rowHeight);

    doc.setFontSize(12);
    doc.setTextColor("#0f172a");
    doc.text(spec[1], xPos, yPos + row * rowHeight + 6);
  });

  yPos += Math.ceil(specs.length / 3) * rowHeight + 25;

  // Updated gallery section
  if (boatDetails.otherPhotos && boatDetails.otherPhotos.length > 0) {
    doc.addPage();
    addHeaderAndFooter(doc, 3);
    yPos = 40;

    // Update gallery title to serif font
    doc.setFont("times", "normal");
    doc.setFontSize(20);
    doc.setTextColor("#0f172a");
    doc.text("Gallery", margin, yPos);
    yPos += 20;

    // Calculate dynamic gallery dimensions
    const contentWidth = pageWidth - margin * 2;
    const galleryImageWidth =
      (contentWidth - (GALLERY_IMAGES_PER_ROW - 1) * GALLERY_SPACING) /
      GALLERY_IMAGES_PER_ROW;
    const galleryImageHeight = galleryImageWidth * (2 / 3); // 3:2 aspect ratio containers

    // Skip the first two photos when processing gallery images
    const galleryPhotos = boatDetails.otherPhotos.slice(2); // Start from the third photo

    // Process all photos in batches of 3
    for (let i = 0; i < galleryPhotos.length; i += GALLERY_IMAGES_PER_ROW) {
      try {
        const rowPhotos = await Promise.all(
          galleryPhotos
            .slice(i, i + GALLERY_IMAGES_PER_ROW)
            .map(async (url) => {
              const photoData = await processGalleryImage(
                url,
                galleryImageWidth / galleryImageHeight
              );
              return { photoData };
            })
        );

        rowPhotos.forEach((photo, index) => {
          const xPos = margin + index * (galleryImageWidth + GALLERY_SPACING);

          // Images are now pre-cropped to correct aspect ratio
          doc.addImage(
            photo.photoData,
            "JPEG",
            xPos,
            yPos,
            galleryImageWidth,
            galleryImageHeight
          );
        });

        yPos += galleryImageHeight + GALLERY_SPACING;

        // Add new page check
        if (
          yPos >
          doc.internal.pageSize.height -
            (galleryImageHeight + GALLERY_SPACING + 40)
        ) {
          doc.addPage();
          addHeaderAndFooter(
            doc,
            Math.floor(i / (GALLERY_IMAGES_PER_ROW * 2)) + 4
          );
          yPos = 40;
        }
      } catch (error) {
        console.error(`Error adding gallery row ${i}:`, error);
      }
    }

    // After gallery is complete, add description on the same page if there's space
    if (yPos > doc.internal.pageSize.height - 100) {
      // Check if we need a new page
      doc.addPage();
      addHeaderAndFooter(doc, doc.getNumberOfPages());
      yPos = 40;
    } else {
      yPos += 20; // Add some spacing if on same page
    }

    // Add Description section with proper pagination
    if (boatDetails.description && boatDetails.description.trim()) {
      // Description title
      doc.setFont("times", "normal");
      doc.setFontSize(20);
      doc.setTextColor("#0f172a");
      doc.text("Description", margin, yPos);
      yPos += 15;

      // Description text with padding
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor("#374151");

      // Add right padding only (30mm on right side)
      const rightPadding = 30;
      const descriptionWidth = contentWidth - rightPadding;

      // Split text into lines to handle line breaks and wrapping
      const descriptionText = boatDetails.description.replace(/\\n/g, "\n");
      const lines = doc.splitTextToSize(descriptionText, descriptionWidth);

      // Calculate line height and available space per page
      const lineHeight = 5;
      const bottomMargin = 35; // Space for footer
      const maxYPerPage = doc.internal.pageSize.height - bottomMargin;

      // Add lines with pagination
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (yPos + lineHeight > maxYPerPage) {
          doc.addPage();
          addHeaderAndFooter(doc, doc.getNumberOfPages());
          yPos = 40;
        }

        // Use simple text output without alignment options to prevent stretching
        doc.text(lines[i], margin, yPos);
        yPos += lineHeight;
      }
    }
  } else {
    // If no gallery, just add description on the next page
    doc.addPage();
    addHeaderAndFooter(doc, 3);
    yPos = 40;

    // Add Description section with proper pagination
    if (boatDetails.description && boatDetails.description.trim()) {
      // Description title
      doc.setFont("times", "normal");
      doc.setFontSize(20);
      doc.setTextColor("#0f172a");
      doc.text("Description", margin, yPos);
      yPos += 15;

      // Description text with padding
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor("#374151");

      // Add right padding only (30mm on right side)
      const rightPadding = 30;
      const descriptionWidth = contentWidth - rightPadding;

      // Split text into lines to handle line breaks and wrapping
      const descriptionText = boatDetails.description.replace(/\\n/g, "\n");
      const lines = doc.splitTextToSize(descriptionText, descriptionWidth);

      // Calculate line height and available space per page
      const lineHeight = 5;
      const bottomMargin = 35; // Space for footer
      const maxYPerPage = doc.internal.pageSize.height - bottomMargin;

      // Add lines with pagination
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (yPos + lineHeight > maxYPerPage) {
          doc.addPage();
          addHeaderAndFooter(doc, doc.getNumberOfPages());
          yPos = 40;
        }

        // Use simple text output without alignment options to prevent stretching
        doc.text(lines[i], margin, yPos);
        yPos += lineHeight;
      }
    }
  }

  // Save the PDF
  doc.save(`${boatDetails.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
};

// New interface for simplified boat data in brochure
interface BrochureBoat {
  id: string;
  name: string;
  price: string;
  year: string;
  sizeMeters: string;
  location: string;
  mainPhoto: string;
  taxStatus: string;
}

// Add interface for brochure options
interface BrochureOptions {
  title?: string;
  subtitle?: string;
}

// Constants for brochure layout
const BROCHURE_BOATS_PER_PAGE = 6;
const BROCHURE_COLS = 2;
const BROCHURE_ROWS = 3;
const BROCHURE_HORIZONTAL_SPACING = 6; // Spacing between cards in a row
const BROCHURE_VERTICAL_SPACING = 0; // Spacing between rows

export const generateBrochurePDF = async (
  boats: BrochureBoat[],
  options: BrochureOptions = {}
) => {
  const { title = "Nova Yachts", subtitle = "Collection" } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - 60; // Account for header and footer

  // Calculate card dimensions (always based on 6-boat layout for consistency)
  const cardWidth =
    (contentWidth - BROCHURE_HORIZONTAL_SPACING) / BROCHURE_COLS;
  const baseCardHeight =
    (contentHeight - (BROCHURE_ROWS - 1) * BROCHURE_VERTICAL_SPACING) /
    BROCHURE_ROWS;

  let currentPage = 1;
  let boatsOnCurrentPage = 0;

  // Add first page header
  addHeaderAndFooter(doc, currentPage);

  // Add brochure title and subtitle
  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor("#0f172a");
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth / 2 - titleWidth / 2, 41);

  // Add subtitle
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.setTextColor("#64748b");
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, pageWidth / 2 - subtitleWidth / 2, 51);

  let startY = 61; // Changed from 65 to 58 - Start position after title and subtitle

  // Process boats
  for (let boatIndex = 0; boatIndex < boats.length; boatIndex++) {
    const boat = boats[boatIndex];

    // Determine boats per page: 6 for all pages now
    const boatsPerPage = BROCHURE_BOATS_PER_PAGE; // Changed from conditional logic to always use 6

    // Check if we need a new page
    if (boatsOnCurrentPage >= boatsPerPage) {
      doc.addPage();
      currentPage++;
      addHeaderAndFooter(doc, currentPage);
      boatsOnCurrentPage = 0;
      startY = 40; // Reset Y position for new page
    }

    // Calculate card height based on page (subtract 10 only on first page)
    const cardHeight = currentPage === 1 ? baseCardHeight - 10 : baseCardHeight;
    const imageHeight = cardHeight * 0.65; // Slightly increase image portion
    const infoHeight = cardHeight * 0.35; // Reduce info portion

    // Calculate position in grid (always use 2-column layout)
    const col = boatsOnCurrentPage % BROCHURE_COLS;
    const row = Math.floor(boatsOnCurrentPage / BROCHURE_COLS);

    const cardX = margin + col * (cardWidth + BROCHURE_HORIZONTAL_SPACING);
    const cardY = startY + row * (cardHeight + BROCHURE_VERTICAL_SPACING);

    try {
      // Process and add boat image
      const imageData = await processMainImage(
        boat.mainPhoto,
        cardWidth / imageHeight
      );

      // Add boat image with rounded corners
      doc.addImage(imageData, "JPEG", cardX, cardY, cardWidth, imageHeight);

      // Add boat information below image
      const textStartY = cardY + imageHeight + 6; // Increased spacing from 3 to 6

      // Boat name - using same font as price used to be
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor("#0f172a");
      const nameText =
        boat.name.length > 30 ? boat.name.substring(0, 30) + "..." : boat.name;
      doc.text(nameText, cardX, textStartY);

      // Year and Price on same line with VAT status in parentheses
      doc.setFontSize(10);
      doc.setTextColor("#64748b");
      const priceText = `€${Number(boat.price).toLocaleString()}`;
      const vatText = boat.taxStatus === "paid" ? "VAT Paid" : "VAT Not Paid";
      doc.text(
        `${boat.year} • ${priceText} (${vatText})`,
        cardX,
        textStartY + 8
      ); // Combined line
    } catch (error) {
      console.error(`Error adding boat ${boat.name}:`, error);

      // Add placeholder if image fails
      doc.setDrawColor("#e2e8f0");
      doc.setFillColor("#f8fafc");
      doc.rect(cardX, cardY, cardWidth, imageHeight, "F");

      // Add "No Image" text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor("#94a3b8");
      const noImageText = "Image not available";
      const noImageWidth = doc.getTextWidth(noImageText);
      doc.text(
        noImageText,
        cardX + (cardWidth - noImageWidth) / 2,
        cardY + imageHeight / 2
      );

      // Still add boat information
      const textStartY = cardY + imageHeight + 6; // Increased spacing from 3 to 6

      // Boat name - using same font as price used to be
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor("#0f172a");
      const nameText =
        boat.name.length > 30 ? boat.name.substring(0, 30) + "..." : boat.name;
      doc.text(nameText, cardX, textStartY);

      // Year and Price on same line with VAT status in parentheses
      doc.setFontSize(10);
      doc.setTextColor("#64748b");
      const priceText = `€${Number(boat.price).toLocaleString()}`;
      const vatText = boat.taxStatus === "paid" ? "VAT Paid" : "VAT Not Paid";
      doc.text(
        `${boat.year} • ${priceText} (${vatText})`,
        cardX,
        textStartY + 8
      ); // Combined line
    }

    boatsOnCurrentPage++;
  }

  // Save the PDF
  const currentDate = new Date().toISOString().split("T")[0];
  doc.save(`Nova-Yachts-Brochure-${currentDate}.pdf`);
};
