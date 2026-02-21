"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }) {
  const [showTools, setShowTools] = useState(false);
  const toolsRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setShowTools(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <html lang="en">
      <body>
        <div className="wrapper">
          <nav className="navbar">
            <h3>Confique Tools</h3>

            <div className="toolsWrapper" ref={toolsRef}>
              <button
                className="toolsBtn"
                onClick={() => setShowTools(!showTools)}
              >
                All Tools ▾
              </button>

              {showTools && (
                <div className="megaMenu">
                  <div className="menuColumn">
                    <h4>IMAGE</h4>
                    <Link href="/" className="toolItem">
                      Image Compressor
                    </Link>
                  </div>

                  <div className="menuColumn">
                    <h4>MEDIA</h4>
                    <Link href="/reel-downloader" className="toolItem">
                      Reel Downloader
                    </Link>
                  </div>

                  <div className="menuColumn">
                    <h4>PDF</h4>
                    <Link href="/word-to-pdf" className="toolItem">
                      Word to PDF
                    </Link>
                    <Link href="/pdf-to-word" className="toolItem">
                      PDF to Word
                    </Link>
                    <Link href="/edit-pdf" className="toolItem">
                      Edit PDF
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {children}
        </div>
      </body>
    </html>
  );
}