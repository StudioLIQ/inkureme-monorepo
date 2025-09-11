import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: "Inkureme - Flight Delay Insurance",
  description: "Decentralized flight delay insurance on Kaia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`antialiased`}>
        <Providers>
          <Navigation />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
