"use client";

import { useState } from "react";
import { MdArrowBackIosNew, MdArrowForwardIos, MdClose, MdZoomIn } from "react-icons/md";

type Props = {
  images: string[];
  setZoomImage: (v: boolean) => void;
};

export default function ZoomImage({ images, setZoomImage }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images.length) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
  };

  return (
    <div className="relative w-full max-w-4xl max-h-full overflow-hidden rounded-lg">
      <div
        className={`flex transition-transform duration-500 ease-in-out ${
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onClick={toggleZoom}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`Product ${i + 1}`}
            className={`w-full min-w-full h-auto max-h-[85vh] object-contain shrink-0 transition-transform duration-500 ${
              isZoomed ? "scale-125" : "scale-100"
            }`}
          />
        ))}
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          type="button"
          className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
          title="Zoom"
        >
          <MdZoomIn size={22} />
        </button>
        <button
          type="button"
          onClick={() => setZoomImage(false)}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <MdClose size={22} />
        </button>
      </div>
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20"
      >
        <MdArrowBackIosNew size={20} />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20"
      >
        <MdArrowForwardIos size={20} />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/20 backdrop-blur-sm p-2 rounded-full z-20">
        {images.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "bg-white scale-110" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
