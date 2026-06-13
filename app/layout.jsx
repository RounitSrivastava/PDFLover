import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";

export const metadata = {
  title: "Confique Multi-Tool Suite",
  description: "A fast, privacy-focused toolset for PDF conversions, image compression, and media downloads.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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