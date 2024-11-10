interface ResizeOptions {
  maxSize?: number;
  maxSizeBytes?: number;
  quality?: number;
}

export const resizeImage = async (
  file: File,
  options: ResizeOptions = {}
): Promise<File> => {
  const {
    maxSize = 1000,
    maxSizeBytes = 1024 * 1024, // 1MB
    quality = 0.8
  } = options;

  // If file is smaller than maxSizeBytes and dimensions are within maxSize, return original
  if (
    file.size <= maxSizeBytes &&
    (await getImageDimensions(file)).width <= maxSize &&
    (await getImageDimensions(file)).height <= maxSize
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Start with original file type
        let outputType = file.type;
        
        // If it's a HEIC/HEIF image from iPhone, convert to JPEG
        if (file.type.includes('heic') || file.type.includes('heif')) {
          outputType = 'image/jpeg';
        }

        // Convert canvas to Blob with adaptive quality
        canvas.toBlob(
          async (blob) => {
            if (!blob) return;

            // If still too large, reduce quality incrementally
            let currentQuality = quality;
            let currentBlob = blob;
            
            while (currentBlob.size > maxSizeBytes && currentQuality > 0.1) {
              currentQuality -= 0.1;
              currentBlob = await new Promise((resolve) => 
                canvas.toBlob((b) => resolve(b!), outputType, currentQuality)
              );
            }

            const resizedFile = new File([currentBlob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          outputType,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
}; 