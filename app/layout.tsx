import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { Analytics } from "@vercel/analytics/react";


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
        <script dangerouslySetInnerHTML={{
          __html: `
            fetch('https://ask-whisper-h9d347y3t-leonc8s-projects.vercel.app/chatbot-widget.js', {
              mode: 'no-cors'
            })
              .then(response => response.text())
              .then(code => {
                const script = document.createElement('script');
                script.textContent = code;
                document.body.appendChild(script);
                
                // Initialize after script is loaded
                initChatWidget({
                  welcomeMessage: "👋 Hi there! How can I help you today?",
                  primaryColor: "#2196f3",
                  title: "Chat with us",
                  subtitle: "We typically reply within 5 minutes"
                });
              });
          `
        }} />
      </body>
    </html>
  )
}
