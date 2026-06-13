import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerContent">
        <div className="footerBrand">
          <h4>Confique Tools</h4>
          <p>Privacy-focused local web utility suites to convert PDFs, compress images, and download media safely.</p>
          <span className="footerTag">🔒 100% Client-Side / Secure Server Files</span>
        </div>

        <div className="footerLinks">
          <div className="footerCol">
            <h5>PDF Tools</h5>
            <Link href="/word-to-pdf">Word to PDF</Link>
            <Link href="/pdf-to-word">PDF to Word</Link>
            <Link href="/edit-pdf">Edit PDF</Link>
            <Link href="/esign-pdf">E-Sign PDF</Link>
          </div>

          <div className="footerCol">
            <h5>Image & Media</h5>
            <Link href="/image-compressor">Image Compressor</Link>
            <Link href="/reel-downloader">Reel Downloader</Link>
            <Link href="/status-downloader">Status Downloader</Link>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        <p>&copy; {new Date().getFullYear()} Confique Tools. All rights reserved.</p>
      </div>
    </footer>
  );
}
