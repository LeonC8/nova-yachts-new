import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { Analytics } from "@vercel/analytics/react";
import Script from 'next/script';
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";


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
        <FloatingWhatsApp />
        <Analytics />

        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '560671291476914');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=560671291476914&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

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
