import Link from "next/link";

export default function Home() {
  return (
    <div className="dashboardContainer">
      <div className="dashboardHeader">
        <h1>Supercharge Your Workflow</h1>
        <p>
          Fast, privacy-focused web utilities for everyday file tasks. Files are processed locally or on your own server, keeping your data secure.
        </p>
      </div>

      <div className="toolsGrid">
        <Link href="/pdf-to-word" className="dashboardCard pdfCard">
          <div className="cardIcon pdfIcon">📝</div>
          <h3>PDF to Word</h3>
          <p>Convert PDF documents into editable Microsoft Word (.docx) files accurately.</p>
        </Link>

        <Link href="/word-to-pdf" className="dashboardCard pdfCard">
          <div className="cardIcon pdfIcon">📄</div>
          <h3>Word to PDF</h3>
          <p>Turn Word files (.doc, .docx) into high-quality standardized PDF files instantly.</p>
        </Link>

        <Link href="/edit-pdf" className="dashboardCard pdfCard">
          <div className="cardIcon pdfIcon">✏️</div>
          <h3>Edit PDF</h3>
          <p>Easily prepare your PDF documents to be edited in Microsoft Word format.</p>
        </Link>

        <Link href="/esign-pdf" className="dashboardCard pdfCard">
          <div className="cardIcon pdfIcon">✍️</div>
          <h3>E-Sign PDF</h3>
          <p>Draw and embed your digital signature securely onto any PDF document locally.</p>
        </Link>

        <Link href="/image-compressor" className="dashboardCard imageCard">
          <div className="cardIcon imageIcon">🖼️</div>
          <h3>Image Compressor</h3>
          <p>Reduce image file size with advanced settings while maintaining original quality.</p>
        </Link>

        <Link href="/reel-downloader" className="dashboardCard mediaCard">
          <div className="cardIcon mediaIcon">🎥</div>
          <h3>Reel Downloader</h3>
          <p>Save Instagram Reel videos locally in MP4 format by pasting their video links.</p>
        </Link>

        <Link href="/status-downloader" className="dashboardCard mediaCard">
          <div className="cardIcon mediaIcon">📥</div>
          <h3>Status Downloader</h3>
          <p>Download status videos and photos from TikTok, WhatsApp, Twitter, and Facebook.</p>
        </Link>
      </div>
    </div>
  );
}