"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Phone,
  Mail,
  ArrowLeft,
  Facebook,
  Instagram,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  transparentOnTop?: boolean;
}

export function Navbar({ transparentOnTop = true }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    if (transparentOnTop) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsScrolled(true);
    }
  }, [transparentOnTop]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const headerClasses = transparentOnTop
    ? `fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
        isScrolled
          ? "bg-white text-black shadow-md"
          : "bg-transparent text-white"
      }`
    : "sticky top-0 z-50 bg-white text-black shadow-md";

  const logoClasses = `h-10 md:h-12 w-auto ${
    isScrolled || !transparentOnTop ? "invert opacity-80" : ""
  }`;

  const navLinkClasses = transparentOnTop
    ? `${isScrolled ? "text-gray-600" : "text-gray-200"}`
    : "text-gray-600";

  const dividerClasses = transparentOnTop
    ? `fixed left-0 right-0 md:mt-2 h-px ${
        isScrolled ? "bg-gray-200" : "bg-white bg-opacity-30"
      }`
    : "absolute left-0 right-0 md:mt-2 h-px bg-gray-200";

  return (
    <>
      <header className={headerClasses}>
        <div className="container mx-auto px-4 xl:px-20">
          <div className="flex items-center py-4">
            <button className="mr-5" onClick={toggleSidebar}>
              <svg
                className={`w-5 h-5 ${
                  isScrolled || !transparentOnTop
                    ? "text-gray-800"
                    : "text-white"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex-1 flex items-center">
              <Image
                src="https://res.cloudinary.com/dsgx9xiva/image/upload/v1729932049/nova-yachts/logo/nova-yachts_wrtrr2_fkh4xk.png"
                alt="NovaYachts Logo"
                width={150}
                height={20}
                className={`${logoClasses} mr-auto mb-1`}
              />
              <div className="hidden md:flex items-center space-x-4">
                <a
                  href="https://www.facebook.com/novayachts.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-current hover:text-gray-300 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <Facebook className="w-4 h-4 stroke-[1.5]" />
                </a>
                <button
                  className="text-current hover:text-gray-300 opacity-90 hover:opacity-100 transition-opacity mr-4 cursor-not-allowed"
                  disabled
                >
                  <Instagram className="w-4 h-4 stroke-[1.5]" />
                </button>
                <Link
                  href="/contact"
                  className={`px-5 py-1 md:py-2 rounded-full transition-colors flex items-center space-x-2 ${
                    isScrolled || !transparentOnTop
                      ? "bg-slate-800 text-white hover:bg-gray-800 border border-slate-800"
                      : "border border-white/70 text-white hover:bg-white hover:text-black"
                  }`}
                >
                  <span className="text-xs md:text-sm">Contact</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <a
                href="https://wa.me/38598301987"
                className={`md:hidden flex items-center justify-center ml-2 ${
                  isScrolled || !transparentOnTop
                    ? "text-green-600 hover:text-green-700"
                    : "text-white hover:text-gray-200"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>
          <nav
            className={`flex overflow-x-auto space-x-4 md:space-x-5 pb-3 pt-2 ${navLinkClasses} items-center`}
          >
            {!transparentOnTop && (
              <button
                onClick={handleGoBack}
                className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0 border border-gray-200 shadow-sm"
                aria-label="Go back"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <Link
              href="/new-yachts"
              className="whitespace-nowrap hover:text-gray-300 flex-shrink-0"
            >
              New Yachts
            </Link>
            <Link
              href="/pre-owned"
              className="whitespace-nowrap hover:text-gray-300 flex-shrink-0"
            >
              Pre-owned
            </Link>
            <a
              href="https://www.fairline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap hover:text-gray-300 flex-shrink-0"
            >
              Fairline
            </a>
            <a
              href="https://www.numarine.com"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap hover:text-gray-300 flex-shrink-0"
            >
              Numarine
            </a>
            <Link
              href="/contact"
              className="whitespace-nowrap hover:text-gray-300 flex-shrink-0"
            >
              Contact us
            </Link>
          </nav>
          <div className={dividerClasses} style={{ top: "70px" }}></div>
          {transparentOnTop && (
            <div
              className={`fixed left-0 right-0 md:mt-2 h-px ${
                isScrolled ? "bg-gray-200 hidden" : "bg-white bg-opacity-30"
              }`}
              style={{ top: "122px" }}
            ></div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4">
          <button onClick={toggleSidebar} className="absolute top-4 right-4">
            <X className="w-6 h-6" />
          </button>
          <nav className="mt-8">
            <ul className="space-y-4">
              {!transparentOnTop && (
                <li>
                  <button
                    onClick={handleGoBack}
                    className="flex items-center text-gray-800 hover:text-gray-600"
                  >
                    <ArrowLeft size={20} className="mr-2" /> Go Back
                  </button>
                </li>
              )}
              <li>
                <Link
                  href="/home"
                  className="block text-gray-800 hover:text-gray-600"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/new-yachts"
                  className="block text-gray-800 hover:text-gray-600"
                >
                  New Yachts
                </Link>
              </li>
              <li>
                <Link
                  href="/pre-owned"
                  className="block text-gray-800 hover:text-gray-600"
                >
                  Pre-owned
                </Link>
              </li>
              <li>
                <a
                  href="https://www.fairline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-800 hover:text-gray-600"
                >
                  Fairline
                </a>
              </li>
              <li>
                <a
                  href="https://www.numarine.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-800 hover:text-gray-600"
                >
                  Numarine
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="block text-gray-800 hover:text-gray-600"
                >
                  Contact us
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
