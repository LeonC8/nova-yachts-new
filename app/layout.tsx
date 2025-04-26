import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { Analytics } from "@vercel/analytics/react";
import Script from 'next/script';


export const metadata: Metadata = {
  title: "Nova Yachts",
  description: "Premium yacht dealer in Croatia - Fairline and Numarine",
  icons: {
    icon: 'https://res.cloudinary.com/dsgx9xiva/image/upload/v1660039653/nova-yachts/logo/Nova_Yachts_3_uqn6wk.png',
    shortcut: 'https://res.cloudinary.com/dsgx9xiva/image/upload/v1660039653/nova-yachts/logo/Nova_Yachts_3_uqn6wk.png',
    apple: 'https://res.cloudinary.com/dsgx9xiva/image/upload/v1660039653/nova-yachts/logo/Nova_Yachts_3_uqn6wk.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://res.cloudinary.com/dsgx9xiva/image/upload/v1660039653/nova-yachts/logo/Nova_Yachts_3_uqn6wk.png" />
      </head>
      <body className={`${GeistSans.className} antialiased`}>
        {children}
        <Analytics />

        {/* Google Tag Manager scripts */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17036502791"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17036502791');
          `}
        </Script>
      </body>
    </html>
  )
}
