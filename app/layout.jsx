import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Confique Multi-Tool Suite",
  description: "A fast, privacy-focused toolset for PDF conversions, image compression, and media downloads.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6320781006360526"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <div className="wrapper">
          <Header />
          <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}