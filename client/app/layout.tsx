import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Australian Government Data Search Engine',
  description: 'A powerful search engine for Australian government open datasets, APIs, documents, and resources',
  keywords: [
    'Australian government',
    'open data',
    'datasets',
    'APIs',
    'government resources',
    'ABS',
    'DEWR',
    'ATO',
    'search engine'
  ],
  authors: [{ name: 'Australian Gov Search Team' }],
  creator: 'Australian Gov Search Team',
  publisher: 'Australian Gov Search Team',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://australian-gov-search.com',
    title: 'Australian Government Data Search Engine',
    description: 'Search through Australian government open datasets, APIs, and resources',
    siteName: 'Australian Gov Search',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Australian Government Data Search Engine',
    description: 'Search through Australian government open datasets, APIs, and resources',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}