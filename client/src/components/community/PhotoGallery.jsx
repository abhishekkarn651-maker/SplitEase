import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import {
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";

/**
 * PhotoGallery — Reusable photo gallery with lightbox.
 *
 * Features:
 *  - Responsive grid of thumbnails
 *  - Click to expand in lightbox overlay
 *  - Left/right navigation arrows
 *  - Keyboard navigation (arrows, Escape)
 */
export default function PhotoGallery({ photos = [] }) {
  const { darkMode } = useApp();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, goNext, goPrev]);

  if (photos.length === 0) return null;

  // Determine grid layout based on photo count
  const getGridClass = () => {
    switch (photos.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2 sm:grid-cols-3";
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-2 sm:grid-cols-3";
    }
  };

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={`grid ${getGridClass()} gap-2 rounded-xl overflow-hidden`}>
        {photos.map((photo, index) => (
          <div
            key={index}
            onClick={() => openLightbox(index)}
            className={`relative cursor-pointer overflow-hidden group ${
              photos.length === 1 ? "aspect-video" :
              photos.length === 3 && index === 0 ? "row-span-2 aspect-auto h-full" :
              "aspect-[4/3]"
            }`}
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        ))}
      </div>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer z-10"
          >
            <HiOutlineXMark className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full">
            {activeIndex + 1} / {photos.length}
          </div>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
            >
              <HiOutlineChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main image */}
          <img
            src={photos[activeIndex]}
            alt={`Photo ${activeIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
            >
              <HiOutlineChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip at bottom */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 flex gap-2 px-4" onClick={(e) => e.stopPropagation()}>
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    index === activeIndex
                      ? "border-white scale-110 shadow-lg"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumb ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
