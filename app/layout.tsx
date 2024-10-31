import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';

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
      <body>{children}</body>
    </html>
  )
}
