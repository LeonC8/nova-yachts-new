// Video upload helpers shared by the Add and Edit boat forms.
//
// Videos are stored in Firebase Storage under `boat-videos/` and the boat
// record keeps an ordered `videos: string[]` of download URLs. Unlike photos,
// videos are uploaded as-is (no client-side compression), so we use resumable
// uploads to report progress on large files.

import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

// Hard cap per file. Every view streams the file from Firebase Storage, so
// very large files are slow for visitors and costly in bandwidth.
export const MAX_VIDEO_MB = 300;

export interface VideoItem {
  id: string;
  // Download URL for saved videos, or an object URL preview for new ones.
  url: string;
  file?: File;
  isNew?: boolean;
}

export function videoItemsFromUrls(urls: string[] | undefined): VideoItem[] {
  return (urls || []).map((url, i) => ({ id: `existing-video-${i}`, url }));
}

export function videoItemsFromFiles(files: File[]): VideoItem[] {
  return files.map((file, i) => ({
    id: `new-video-${Date.now()}-${i}`,
    url: URL.createObjectURL(file),
    file,
    isNew: true,
  }));
}

function guessContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return "video/mp4";
}

/**
 * Upload any new videos and return the final ordered list of URLs.
 * `onProgress` receives overall progress (0–100) across all new files.
 */
export async function uploadVideos(
  items: VideoItem[],
  onProgress?: (percent: number) => void
): Promise<string[]> {
  const storage = getStorage();
  const newItems = items.filter((v) => v.isNew && v.file);
  const totalBytes = newItems.reduce((sum, v) => sum + v.file!.size, 0);
  const transferred = new Map<string, number>();

  const report = () => {
    if (!onProgress || totalBytes === 0) return;
    let done = 0;
    transferred.forEach((n) => (done += n));
    onProgress(Math.min(100, Math.round((done / totalBytes) * 100)));
  };

  return Promise.all(
    items.map(async (item) => {
      if (!item.isNew || !item.file) return item.url;
      const file = item.file;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `boat-videos/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}_${safeName}`;
      const task = uploadBytesResumable(storageRef(storage, path), file, {
        contentType: guessContentType(file),
      });
      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            transferred.set(item.id, snap.bytesTransferred);
            report();
          },
          reject,
          () => resolve()
        );
      });
      return getDownloadURL(task.snapshot.ref);
    })
  );
}
