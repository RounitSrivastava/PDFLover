"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [showTools, setShowTools] = useState(false);
  const toolsRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setShowTools(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on navigation change
  useEffect(() => {
    setShowTools(false);
  }, [pathname]);

  return (
    <nav className="navbar">
      <Link href="/" className="logoLink">
        <h3>
          <span className="logoGlow"></span>
          Confique Tools
        </h3>
      </Link>

      <div className="navPopularLinks">
        <Link href="/pdf-to-word" className={`navLink ${pathname === "/pdf-to-word" ? "active" : ""}`}>
          PDF to Word
        </Link>
        <Link href="/esign-pdf" className={`navLink ${pathname === "/esign-pdf" ? "active" : ""}`}>
          E-Sign PDF
        </Link>
        <Link href="/image-compressor" className={`navLink ${pathname === "/image-compressor" ? "active" : ""}`}>
          Image Compressor
        </Link>
      </div>

      <div className="toolsWrapper" ref={toolsRef}>
        <button
          className={`toolsBtn ${showTools ? "active" : ""}`}
          onClick={() => setShowTools(!showTools)}
        >
          All Tools {showTools ? "▴" : "▾"}
        </button>

        {showTools && (
          <div className="megaMenu">
            <div className="menuColumn">
              <h4>PDF Tools</h4>
              <Link href="/word-to-pdf" className={`toolItem activePdf ${pathname === "/word-to-pdf" ? "active" : ""}`}>
                📄 Word to PDF
              </Link>
              <Link href="/pdf-to-word" className={`toolItem activePdf ${pathname === "/pdf-to-word" ? "active" : ""}`}>
                📝 PDF to Word
              </Link>
              <Link href="/edit-pdf" className={`toolItem activePdf ${pathname === "/edit-pdf" ? "active" : ""}`}>
                ✏️ Edit PDF
              </Link>
              <Link href="/esign-pdf" className={`toolItem activePdf ${pathname === "/esign-pdf" ? "active" : ""}`}>
                ✍️ E-Sign PDF
              </Link>
            </div>

            <div className="menuColumn">
              <h4>Image Tools</h4>
              <Link href="/image-compressor" className={`toolItem activeImage ${pathname === "/image-compressor" ? "active" : ""}`}>
                🖼️ Image Compressor
              </Link>
            </div>

            <div className="menuColumn">
              <h4>Media Tools</h4>
              <Link href="/reel-downloader" className={`toolItem activeMedia ${pathname === "/reel-downloader" ? "active" : ""}`}>
                🎥 Reel Downloader
              </Link>
              <Link href="/status-downloader" className={`toolItem activeMedia ${pathname === "/status-downloader" ? "active" : ""}`}>
                📥 Status Downloader
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
