// Centralized site configuration stored in Firebase Realtime Database under
// the `siteConfig` node. This controls which yachts are featured on the
// homepage and the manual ordering of the category pages, all editable from
// the admin panel (no code changes / redeploys required).

export const firebaseConfig = {
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

// Number of yachts shown in each homepage featured section.
export const FEATURED_COUNT = 3;

// Path to the config node in Realtime Database.
export const SITE_CONFIG_PATH = "siteConfig";

export interface SiteConfig {
  // Ordered list of boat IDs featured on the homepage.
  featured: {
    new: string[];
    preOwned: string[];
  };
  // Ordered list of boat IDs for the dedicated category pages.
  order: {
    new: string[];
    preOwned: string[];
  };
}

export const EMPTY_SITE_CONFIG: SiteConfig = {
  featured: { new: [], preOwned: [] },
  order: { new: [], preOwned: [] },
};

// Legacy hardcoded featured IDs — used as a fallback the first time the admin
// opens the panel / before any config has been saved.
export const LEGACY_NEW_YACHTS_IDS = [
  "-OA7TvkMaDuVSbrNcH6l",
  "-OVYoHsESFYYlwMgp7qe",
  "-OUAizmOHXqeSDDZLr36",
];

export const LEGACY_PRE_OWNED_YACHTS_IDS = [
  "-OAD8tAn6Mpwkj9TrS11",
  "-OAChnNruMgk21661rVD",
  "-OS9s7vUAt16l0MrTnHb",
];

// Normalize whatever comes back from Firebase (which may be partial / missing
// nested keys) into a fully-shaped SiteConfig.
export function normalizeSiteConfig(raw: any): SiteConfig {
  return {
    featured: {
      new: Array.isArray(raw?.featured?.new) ? raw.featured.new : [],
      preOwned: Array.isArray(raw?.featured?.preOwned)
        ? raw.featured.preOwned
        : [],
    },
    order: {
      new: Array.isArray(raw?.order?.new) ? raw.order.new : [],
      preOwned: Array.isArray(raw?.order?.preOwned) ? raw.order.preOwned : [],
    },
  };
}

/**
 * Apply a saved manual ordering to a list of boats.
 *
 * Boats whose IDs appear in `orderedIds` come first, in that order. Any boats
 * not in the list (e.g. newly added yachts the admin hasn't ordered yet) are
 * appended afterwards, preserving their incoming order.
 */
export function applyManualOrder<T extends { id: string }>(
  boats: T[],
  orderedIds: string[]
): T[] {
  if (!orderedIds || orderedIds.length === 0) return boats;

  const indexOf = new Map<string, number>();
  orderedIds.forEach((id, i) => indexOf.set(id, i));

  return [...boats].sort((a, b) => {
    const ai = indexOf.has(a.id) ? indexOf.get(a.id)! : Number.MAX_SAFE_INTEGER;
    const bi = indexOf.has(b.id) ? indexOf.get(b.id)! : Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}
