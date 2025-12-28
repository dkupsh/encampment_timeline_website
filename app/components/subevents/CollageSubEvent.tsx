'use client';

import { CollageSubEvent as CollageSubEventType, CollagePhoto } from '@/types/investigation';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface CollageSubEventProps {
  subEvent: CollageSubEventType;
}

// Auto-assign positions and sizes to photos if not specified
function assignPhotoProperties(photos: CollagePhoto[]): CollagePhoto[] {
  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
  const usedPositions = new Set<string>();

  return photos.map((photo, index) => {
    // Auto-assign size if not specified
    const size = photo.size || sizes[index % sizes.length];

    // Auto-calculate appearAt if not specified (stagger appearance)
    const appearAt = photo.appearAt ?? 0.2 + (index * 0.15);

    // Auto-position if not specified
    let x = photo.x;
    let y = photo.y;

    if (x === undefined || y === undefined) {
      // Generate random position that doesn't overlap too much
      let attempts = 0;
      do {
        x = 10 + Math.random() * 80; // Keep within 10-90% range
        y = 10 + Math.random() * 80;
        const posKey = `${Math.floor(x / 20)}-${Math.floor(y / 20)}`;
        if (!usedPositions.has(posKey)) {
          usedPositions.add(posKey);
          break;
        }
        attempts++;
      } while (attempts < 50);
    }

    return {
      ...photo,
      size,
      x,
      y,
      appearAt,
      disappearAt: photo.disappearAt ?? 1
    };
  });
}

export default function CollageSubEvent({ subEvent }: CollageSubEventProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const duration = subEvent.duration ?? 200; // Default to 200vh
  const photosWithProps = assignPhotoProperties(subEvent.photos);

  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate scroll progress through the container
      const scrollStart = rect.top;
      const progress = Math.max(0, Math.min(1, -scrollStart / (containerHeight - viewportHeight)));

      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isSticky = scrollProgress > 0.05 && scrollProgress < 0.95;

  // Size mapping
  const sizeMap = {
    small: { width: 250, height: 200 },
    medium: { width: 350, height: 280 },
    large: { width: 500, height: 400 }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
      style={{ minHeight: `${duration}vh` }}
    >
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 md:h-48 bg-linear-to-b from-white via-white/60 to-transparent z-20 pointer-events-none" />

      {/* Smooth gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 bg-linear-to-t from-white via-white/60 to-transparent z-20 pointer-events-none" />

      {/* Sticky collage background */}
      <div
        ref={stickyRef}
        className={`${isSticky ? 'fixed' : 'absolute'} inset-0 w-full h-screen bg-white`}
        style={{
          top: isSticky ? 0 : scrollProgress < 0.5 ? 0 : 'auto',
          bottom: !isSticky && scrollProgress >= 0.5 ? 0 : 'auto',
        }}
      >
        {/* Photos scattered across the page */}
        {photosWithProps.map((photo, index) => {
          const photoOpacity =
            scrollProgress >= (photo.appearAt ?? 0) &&
            scrollProgress <= (photo.disappearAt ?? 1)
              ? 1
              : 0;

          const dimensions = sizeMap[photo.size as keyof typeof sizeMap] || sizeMap.medium;
          const scale = photoOpacity === 1 ? 1 : 0.8;

          return (
            <div
              key={index}
              className="absolute transition-all duration-700 ease-out"
              style={{
                left: `${photo.x}%`,
                top: `${photo.y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity: photoOpacity,
                width: `${dimensions.width}px`,
              }}
            >
              <div className="relative w-full rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={photo.imagePath}
                  alt={photo.imageAlt || 'Collage photo'}
                  width={dimensions.width}
                  height={dimensions.height}
                  className="w-full h-auto object-cover"
                />
              </div>
              {photo.caption && (
                <p className="text-sm text-gray-700 mt-2 font-sans italic bg-white/90 backdrop-blur-sm px-2 py-1 rounded">
                  {photo.caption}
                </p>
              )}
              {photo.attribution && (
                <p className="text-xs text-gray-600 mt-1 font-sans bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded">
                  {photo.attribution}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall caption */}
      {subEvent.caption && (
        <div className="relative z-10 h-full flex items-center justify-center pt-20 pb-4">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div
              className="bg-white/95 backdrop-blur-md p-6 md:p-10 rounded-lg shadow-2xl transition-all duration-700 ease-in-out"
              style={{
                opacity: scrollProgress > 0.1 && scrollProgress < 0.6 ? 1 : 0,
                transform: `translateY(${scrollProgress > 0.1 && scrollProgress < 0.6 ? 0 : 20}px)`,
              }}
            >
              <p className="text-lg md:text-xl leading-relaxed text-gray-800 font-serif">
                {subEvent.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
