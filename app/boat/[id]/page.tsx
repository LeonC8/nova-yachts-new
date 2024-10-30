import { getDatabase, ref, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import BoatDetails from '@/components/boat-details';

// Firebase config (copy from your existing config)
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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// This function is required for static export with dynamic routes
export async function generateStaticParams() {
  const boatsRef = ref(database, 'boats');
  const snapshot = await get(boatsRef);
  const boats = snapshot.val() || {};
  
  return Object.keys(boats).map((id) => ({
    id: id,
  }));
}

// Your existing page component
export default function Page({ params }: { params: { id: string } }) {
  return <BoatDetails params={params} />;
}
