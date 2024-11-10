import { getDatabase, ref, get } from 'firebase/database';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import BoatDetails from '@/components/boat-details';

// Firebase config
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
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export async function generateStaticParams() {
  const db = getDatabase(app);
  const boatsRef = ref(db, 'boats');
  const snapshot = await get(boatsRef);
  const boats = snapshot.val();

  return Object.keys(boats).map((id) => ({
    id: id,
  }));
}
  
interface BoatPageProps {
  params: {
    id: string;
  };
}

export default function BoatPage({ params }: BoatPageProps) {
  return <BoatDetails params={params} />;
}
