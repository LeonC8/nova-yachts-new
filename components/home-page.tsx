"use client";

import { useState, useEffect } from "react";
import { Footer } from "./Footer";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, get, Database } from "firebase/database";
import { useRouter } from "next/navigation";
import { Loader } from "./Loader";
import { ArrowRight, X, Phone, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import {
  FEATURED_COUNT,
  SITE_CONFIG_PATH,
  normalizeSiteConfig,
  orderCategory,
  LEGACY_NEW_YACHTS_IDS,
  LEGACY_PRE_OWNED_YACHTS_IDS,
} from "@/lib/siteConfig";

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
let app: FirebaseApp;
let database: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

interface Boat {
  id: string;
  name: string;
  price: string;
  year: string;
  mainPhoto: string;
  inStock: string;
  basicListing: string;
  sold?: boolean;
}

// Summary for the "View all" button under each homepage section.
interface CategoryPreview {
  forSaleCount: number;
  // The next yachts on the category page after the featured ones.
  next: { id: string; name: string; mainPhoto: string }[];
}

const EMPTY_PREVIEW: CategoryPreview = { forSaleCount: 0, next: [] };

interface ViewAllButtonProps {
  label: string;
  preview: CategoryPreview;
  onClick: () => void;
}

function ViewAllButton({ label, preview, onClick }: ViewAllButtonProps) {
  const { forSaleCount, next } = preview;
  const namesLine =
    next.length > 0
      ? `Including ${next
          .slice(0, 2)
          .map((b) => b.name)
          .join(", ")}${forSaleCount > FEATURED_COUNT + 2 ? " & more" : ""}`
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group mt-6 md:mt-8 block w-full overflow-hidden rounded-lg bg-slate-900 text-left text-white shadow-md hover:bg-slate-800 hover:shadow-lg transition-all"
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
        {next.length > 0 && (
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-shrink-0">
            {next.map((boat) => (
              <div
                key={boat.id}
                className="relative h-20 overflow-hidden rounded bg-slate-700 md:h-16 md:w-24"
              >
                <Image
                  src={boat.mainPhoto}
                  alt={boat.name}
                  fill
                  sizes="(max-width: 768px) 33vw, 96px"
                  className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex min-w-0 items-center justify-between gap-4 md:flex-1">
          <div className="min-w-0">
            <p className="font-serif text-xl md:text-2xl">
              {forSaleCount > 0
                ? `View all ${forSaleCount} ${label}`
                : `View all ${label}`}
            </p>
            {namesLine && (
              <p className="mt-1 truncate text-xs text-slate-300 md:text-sm">
                {namesLine}
              </p>
            )}
          </div>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 transition-transform group-hover:translate-x-1 md:h-12 md:w-12">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </button>
  );
}

interface ContactOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function ContactOverlay({ isOpen, onClose }: ContactOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="text-xl text-gray-800 font-medium mb-3">Contact</h2>
        <p className="text-gray-600 mb-4 text-sm mb-6 pr-12">
          Please contact us to get more information about this yacht.
        </p>
        <div className="space-y-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-gray-800 mr-4" />
            <span className="text-gray-600 text-sm">
              Gomboševa 28, Zagreb, Croatia
            </span>
          </div>
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-800 mr-4" />
            <span className="text-gray-600 text-sm">+385 98 301 987</span>
          </div>
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-800 mr-4" />
            <span className="text-gray-600 text-sm">office@novayachts.eu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePageComponent() {
  const carouselImages = [
    "https://www.approvedboats.com/wp/wp-content/uploads/approvedboats.com/2023/12/F-lineSq68-ext01-rev.jpg",
    "https://images.boattrader.com/resize/1/88/14/8588814_20231013073947744_1_XLARGE.jpg",
    "https://images.boatsgroup.com/resize/1/39/55/8953955_20230717125914283_1_XLARGE.jpg",
  ];

  const brandCards = [
    {
      image:
        "https://res.cloudinary.com/dsgx9xiva/image/upload/v1659859877/nova-yachts/fairline/s68/Squadron_68_Exterior_CGI_03_1_wu7bj4.jpg",
      title: "Fairline",
      subtitle: "12 models",
      url: "https://www.fairline.com",
    },
    {
      image:
        "https://res.cloudinary.com/dsgx9xiva/image/upload/v1659859841/nova-yachts/numarine/32xp/slider1-32xp_jgxlq8.jpg",
      title: "Numarine",
      subtitle: "8 models",
      url: "https://www.numarine.com",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [inStockYachts, setInStockYachts] = useState<Boat[]>([]);
  const [preOwnedYachts, setPreOwnedYachts] = useState<Boat[]>([]);
  const [newPreview, setNewPreview] = useState<CategoryPreview>(EMPTY_PREVIEW);
  const [preOwnedPreview, setPreOwnedPreview] =
    useState<CategoryPreview>(EMPTY_PREVIEW);
  const [isLoading, setIsLoading] = useState(true);
  const [isContactOverlayOpen, setIsContactOverlayOpen] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const totalImages = carouselImages.length + brandCards.length;

  const router = useRouter();

  const handleViewAll = async (path: string) => {
    setIsLoading(true);
    router.push(path);
  };

  // Safety net: the loader waits for the hero/brand images' onLoad, which can
  // be missed (image finished before hydration) or never fire (load error).
  // Never keep visitors staring at a spinner for more than 3 seconds.
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  useEffect(() => {
    if (!app) {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
    }

    // Featured IDs come from the admin-managed siteConfig node. We read it once
    // up front; if it hasn't been configured yet we fall back to the legacy
    // hardcoded IDs so the homepage is never empty.
    let newIdOrder: string[] = LEGACY_NEW_YACHTS_IDS;
    let preOwnedIdOrder: string[] = LEGACY_PRE_OWNED_YACHTS_IDS;
    // Manual ordering of the category pages, used for the "View all" preview.
    let newPageOrder: string[] = [];
    let preOwnedPageOrder: string[] = [];

    // Count of yachts still for sale, plus the next few the visitor will see
    // on the category page after the featured ones.
    const buildPreview = (
      data: any,
      condition: "new" | "pre-owned",
      pageOrder: string[],
      featuredIds: string[]
    ): CategoryPreview => {
      const all = Object.keys(data || {})
        .filter((id) => data[id]?.condition === condition)
        .map((id) => ({
          id,
          name: data[id].name as string,
          mainPhoto: data[id].mainPhoto as string,
          basicListing: data[id].basicListing as string,
          sold: !!data[id].sold,
        }));
      const forSale = orderCategory(all, pageOrder).filter((b) => !b.sold);
      const featured = new Set(featuredIds);
      const next = forSale
        .filter((b) => !featured.has(b.id) && b.mainPhoto)
        .slice(0, 3)
        .map(({ id, name, mainPhoto }) => ({ id, name, mainPhoto }));
      return { forSaleCount: forSale.length, next };
    };

    const buildSections = (data: any) => {
      const newIds = newIdOrder.slice(0, FEATURED_COUNT);
      const preOwnedIds = preOwnedIdOrder.slice(0, FEATURED_COUNT);

      const collect = (ids: string[]): Boat[] =>
        ids
          .filter((id) => data && data[id])
          .map((id) => ({
            id,
            name: data[id].name,
            price: data[id].price,
            year: data[id].year,
            mainPhoto: data[id].mainPhoto,
            inStock: data[id].inStock,
            basicListing: data[id].basicListing,
            sold: data[id].sold || false,
          }));

      setInStockYachts(collect(newIds));
      setPreOwnedYachts(collect(preOwnedIds));
      setNewPreview(buildPreview(data, "new", newPageOrder, newIds));
      setPreOwnedPreview(
        buildPreview(data, "pre-owned", preOwnedPageOrder, preOwnedIds)
      );
    };

    const configRef = ref(database, SITE_CONFIG_PATH);
    get(configRef)
      .then((snap) => {
        const config = normalizeSiteConfig(snap.val());
        if (config.featured.new.length > 0) newIdOrder = config.featured.new;
        if (config.featured.preOwned.length > 0)
          preOwnedIdOrder = config.featured.preOwned;
        newPageOrder = config.order.new;
        preOwnedPageOrder = config.order.preOwned;
      })
      .catch(() => {
        // keep legacy fallback on error
      })
      .finally(() => {
        const boatsRef = ref(database, "boats");
        onValue(boatsRef, (snapshot) => {
          buildSections(snapshot.val());
        });
      });
  }, []);

  const handleImageLoad = () => {
    setImagesLoaded((prev) => {
      const newCount = prev + 1;
      if (newCount >= totalImages) {
        setIsLoading(false);
      }
      return newCount;
    });
  };

  return (
    <div>
      {isLoading && <Loader />}
      <Navbar transparentOnTop={true} />
      <main className="flex-grow">
        <section className="relative">
          <div className="relative h-[450px] md:h-[550px] overflow-hidden bg-gray-200">
            {carouselImages.map((img, index) => (
              <div
                key={index}
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={img}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageLoad}
                  fill
                  priority={index === 0}
                  quality={75}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black opacity-60"></div>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end justify-start text-white text-left pb-12 md:pb-14">
              <div className="container mx-auto px-4  xl:px-20">
                <h2 className="text-3xl md:text-4xl font-medium mb-4 font-serif md:pb-2">
                  Fairline and Numarine Croatia
                </h2>
                <p className="text-sm md:text-lg text-gray-200">
                  30 years experience | 500+ yachts sold
                </p>
              </div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 ">
              <div className="container mx-auto px-4 xl:px-20">
                <div className="flex space-x-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-8 h-0.5 ${
                        index === currentSlide
                          ? "bg-white"
                          : "bg-white bg-opacity-50"
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    ></button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="md:bg-gray-0 pb-6">
          <section className="container mx-auto px-4 py-8 md:py-12 xl:px-20">
            <h2 className="text-2xl font-medium mb-2 text-left font-serif">
              Our Brands
            </h2>
            <p className="text-gray-600 mb-6 text-sm">33-130 feet</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {brandCards.map((brand, index) => (
                <a
                  key={index}
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative rounded shadow-md overflow-hidden cursor-pointer group bg-gray-200"
                >
                  <div className="absolute inset-0 bg-black opacity-50"></div>
                  <Image
                    src={brand.image}
                    alt={`${brand.title} Yacht`}
                    className="w-full h-48 md:h-96 object-cover"
                    onLoad={handleImageLoad}
                  onError={handleImageLoad}
                    width={800}
                    height={600}
                    quality={75}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <div className="flex justify-between items-center w-full text-white">
                      <div>
                        <h3 className="text-lg md:text-xl font-normal mb-2 md:mb-4">
                          {brand.title}
                        </h3>
                        <p className="text-sm font-light text-gray-200 italic">
                          {brand.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform absolute bottom-5 right-4 text-gray-200" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>

        <hr className="border-t border-gray-300"></hr>
        <div className="md:bg-gray-50">
          <section className="container mx-auto px-4 mt-0 py-8 pb-10 overflow-hidden w-100 border- border-gray-200 border- md:border-none xl:px-20">
            <div className="flex justify-between items-center mb-6">
              <h2
                onClick={() => handleViewAll("/new-yachts")}
                className="text-2xl font-medium font-serif cursor-pointer hover:text-gray-600 transition-colors"
              >
                New Yachts
              </h2>
            </div>
            <div className="relative">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {inStockYachts.map((yacht) => (
                  <div
                    key={yacht.id}
                    className={`bg-white rounded border shadow-sm border-gray-0 overflow-hidden ${
                      yacht.basicListing !== "yes" && !yacht.sold
                        ? "cursor-pointer"
                        : ""
                    }`}
                  >
                    {yacht.sold ? (
                      <div className="cursor-default">
                        <div className="relative">
                          <Image
                            src={yacht.mainPhoto}
                            alt={yacht.name}
                            className="w-full h-48 md:h-64 object-cover opacity-75"
                            onLoad={handleImageLoad}
                  onError={handleImageLoad}
                            width={400}
                            height={300}
                            quality={75}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                            JUST SOLD
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-md font-medium mb-2 text-gray-600">
                            {yacht.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {Number(yacht.price) === 0
                              ? "Price on ask"
                              : `€ ${Number(
                                  yacht.price
                                ).toLocaleString()}`}{" "}
                            • {yacht.year}
                          </p>
                        </div>
                      </div>
                    ) : yacht.basicListing !== "yes" ? (
                      <Link href={`/boat/${yacht.id}`}>
                        <div className="relative">
                          <Image
                            src={yacht.mainPhoto}
                            alt={yacht.name}
                            className="w-full h-48 md:h-64 object-cover"
                            onLoad={handleImageLoad}
                  onError={handleImageLoad}
                            width={400}
                            height={300}
                            quality={75}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-md font-medium mb-2">
                                  {yacht.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {Number(yacht.price) === 0
                                    ? "Price on ask"
                                    : `€ ${Number(
                                        yacht.price
                                      ).toLocaleString()}`}{" "}
                                  • {yacht.year}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div
                        onClick={() => setIsContactOverlayOpen(true)}
                        className="cursor-pointer"
                      >
                        <Image
                          src={yacht.mainPhoto}
                          alt={yacht.name}
                          className="w-full h-48 md:h-64 object-cover"
                          onLoad={handleImageLoad}
                  onError={handleImageLoad}
                          width={400}
                          height={300}
                          quality={75}
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="p-4">
                          <h3 className="text-md font-medium mb-2">
                            {yacht.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {Number(yacht.price) === 0
                              ? "Price on ask"
                              : `€ ${Number(
                                  yacht.price
                                ).toLocaleString()}`}{" "}
                            • {yacht.year}
                          </p>
                          <p className="text-xs text-gray-600 mt-3 bg-gray-100 rounded-md p-1 w-fit font-medium border border-gray-200 px-2">
                            Contact for more information
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <ViewAllButton
              label="new yachts"
              preview={newPreview}
              onClick={() => handleViewAll("/new-yachts")}
            />
          </section>
        </div>

        <div className="md:bg-gray-0">
          <hr className="border-t border-gray-300"></hr>
          <section className="container mx-auto px-4 mt-0 py-8 pb-8 overflow-hidden border- border-gray-200 md:border-none xl:px-20">
            <div className="flex justify-between items-center mb-6">
              <h2
                onClick={() => handleViewAll("/pre-owned")}
                className="text-2xl font-medium font-serif cursor-pointer hover:text-gray-600 transition-colors"
              >
                Pre-owned
              </h2>
            </div>
            <div className="relative">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {preOwnedYachts.map((yacht) => (
                  <div
                    key={yacht.id}
                    className={`bg-white rounded border shadow-sm border-gray-200 overflow-hidden ${
                      yacht.basicListing !== "yes" && !yacht.sold
                        ? "cursor-pointer"
                        : ""
                    }`}
                  >
                    {yacht.sold ? (
                      <div className="cursor-default">
                        <div className="relative">
                          <Image
                            src={yacht.mainPhoto}
                            alt={yacht.name}
                            className="w-full h-48 md:h-64 object-cover opacity-75"
                            onLoad={handleImageLoad}
                  onError={handleImageLoad}
                            width={400}
                            height={300}
                            quality={75}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                            JUST SOLD
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-md font-medium mb-2 text-gray-600">
                            {yacht.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {Number(yacht.price) === 0
                              ? "POA"
                              : `€ ${Number(
                                  yacht.price
                                ).toLocaleString()}`}{" "}
                            • {yacht.year}
                          </p>
                        </div>
                      </div>
                    ) : yacht.basicListing !== "yes" ? (
                      <Link href={`/boat/${yacht.id}`}>
                        <div className="relative">
                          <Image
                            src={yacht.mainPhoto}
                            alt={yacht.name}
                            className="w-full h-48 md:h-64 object-cover"
                            onLoad={handleImageLoad}
                  onError={handleImageLoad}
                            width={400}
                            height={300}
                            quality={75}
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-md font-medium mb-2">
                                  {yacht.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {Number(yacht.price) === 0
                                    ? "POA"
                                    : `€ ${Number(
                                        yacht.price
                                      ).toLocaleString()}`}{" "}
                                  • {yacht.year}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-500 " />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div
                        onClick={() => setIsContactOverlayOpen(true)}
                        className="cursor-pointer"
                      >
                        <Image
                          src={yacht.mainPhoto}
                          alt={yacht.name}
                          className="w-full h-48 md:h-64 object-cover"
                          onLoad={handleImageLoad}
                  onError={handleImageLoad}
                          width={400}
                          height={300}
                          quality={75}
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="p-4">
                          <h3 className="text-md font-medium mb-2">
                            {yacht.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {Number(yacht.price) === 0
                              ? "Price on ask"
                              : `€ ${Number(
                                  yacht.price
                                ).toLocaleString()}`}{" "}
                            • {yacht.year}
                          </p>
                          <p className="text-xs text-gray-600 mt-3 bg-gray-100 rounded-md p-1 w-fit font-medium border border-gray-200 px-2">
                            Contact for more information
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <ViewAllButton
              label="pre-owned yachts"
              preview={preOwnedPreview}
              onClick={() => handleViewAll("/pre-owned")}
            />
          </section>
        </div>

        <hr className="border-t border-gray-300"></hr>
        <div className="md:bg-gray-50">
          <section className="container mx-auto px-4 mt-0 py-10 overflow-hidden xl:px-20">
            <h2 className="text-2xl font-medium mb-4 font-serif mb-8">
              About Us
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              With over 30 years of experience in delivering premium-quality
              motorboats and yachts we offer a large selection off new and
              second-hand boats.
            </p>
            <p className="text-gray-600 text-sm">
              Together with the delivery of new boats we offer you full warranty
              and service assistance. We also work closely together with charter
              management and leasing companies.
            </p>
          </section>
        </div>
      </main>
      <ContactOverlay
        isOpen={isContactOverlayOpen}
        onClose={() => setIsContactOverlayOpen(false)}
      />
      <Footer />
    </div>
  );
}
