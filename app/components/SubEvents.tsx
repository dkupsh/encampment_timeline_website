'use client';

import { SubEvent, MapSubEvent as MapSubEventType, MapMarker, MapLabel } from '@/types/investigation';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface SubEventsProps {
  subEvents: SubEvent[];
  maxWidth?: string;
}

export default function SubEvents({ subEvents, maxWidth }: SubEventsProps) {
  return (
    <div className="w-full space-y-8 md:space-y-12 mt-8 md:mt-12" style={{ maxWidth: maxWidth || '1200px' }}>
      {subEvents.map((subEvent, index) => {
        switch (subEvent.type) {
          case 'text':
            return (
              <div key={index} className="max-w-2xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  <p className="text-base md:text-lg leading-relaxed text-gray-700 font-serif whitespace-pre-wrap">
                    {subEvent.content}
                  </p>
                </div>
              </div>
            );

          case 'photo':
            return (
              <div key={index} className="max-w-4xl mx-auto">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={subEvent.imagePath}
                    alt={subEvent.imageAlt || 'Photo'}
                    fill
                    className="object-cover"
                  />
                </div>
                {subEvent.caption && (
                  <p className="text-sm text-gray-600 text-center mt-3 font-sans italic">
                    {subEvent.caption}
                  </p>
                )}
              </div>
            );

          case 'map':
            return <MapSubEvent key={index} subEvent={subEvent} />;

          default:
            return null;
        }
      })}
    </div>
  );
}

function MapSubEvent({ subEvent }: { subEvent: MapSubEventType }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imageTransform, setImageTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Calculate how object-cover crops the image
  useEffect(() => {
    const calculateImageTransform = () => {
      if (!stickyRef.current) return;

      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const containerRatio = containerWidth / containerHeight;

      // Load image to get natural dimensions
      const img = new window.Image();
      img.src = subEvent.imagePath;
      img.onload = () => {
        const imageRatio = img.naturalWidth / img.naturalHeight;

        let scale, offsetX, offsetY;

        if (imageRatio > containerRatio) {
          // Image is wider - will crop left/right
          scale = containerHeight / img.naturalHeight;
          const renderedWidth = img.naturalWidth * scale;
          offsetX = (renderedWidth - containerWidth) / 2 / renderedWidth * 100;
          offsetY = 0;
        } else {
          // Image is taller - will crop top/bottom
          scale = containerWidth / img.naturalWidth;
          const renderedHeight = img.naturalHeight * scale;
          offsetX = 0;
          offsetY = (renderedHeight - containerHeight) / 2 / renderedHeight * 100;
        }

        setImageTransform({ scale, offsetX, offsetY });
      };
    };

    calculateImageTransform();
    window.addEventListener('resize', calculateImageTransform);

    return () => {
      window.removeEventListener('resize', calculateImageTransform);
    };
  }, [subEvent.imagePath]);

  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate scroll progress through the container
      // 0 = top of container enters viewport
      // 1 = bottom of container leaves viewport
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

  // Map stays at full opacity - gradient handles the transition
  const mapOpacity = 1;
  const isSticky = scrollProgress > 0.05 && scrollProgress < 0.95;
  const duration = subEvent.duration ?? 150; // Default to 150vh if not specified

  // Darkening peaks in the middle and lightens toward both ends
  const darknessProgress = scrollProgress < 0.5
    ? scrollProgress * 2  // 0 to 1 (first half)
    : (1 - scrollProgress) * 2; // 1 to 0 (second half)
  const darknessOpacity = darknessProgress * 0.5; // Max 50% dark at peak

  return (
    <div
      ref={containerRef}
      className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
      style={{ minHeight: `${duration}vh` }} // Configurable duration for map viewing
    >
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 md:h-48 bg-linear-to-b from-white via-white/60 to-transparent z-20 pointer-events-none" />

      {/* Smooth gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 bg-linear-to-t from-white via-white/60 to-transparent z-20 pointer-events-none" />

      {/* Sticky map background */}
      <div
        ref={stickyRef}
        className={`${isSticky ? 'fixed' : 'absolute'} inset-0 w-full h-screen`}
        style={{
          opacity: mapOpacity,
          top: isSticky ? 0 : scrollProgress < 0.5 ? 0 : 'auto',
          bottom: !isSticky && scrollProgress >= 0.5 ? 0 : 'auto',
        }}
      >
        <Image
          src={subEvent.imagePath}
          alt={subEvent.imageAlt || 'Map'}
          fill
          className="object-cover grayscale"
          style={{ opacity: 0.3 }}
        />
        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-white/40 via-transparent to-white/20"></div>

        {/* Progressive darkening overlay - peaks in middle, lightens at ends */}
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: darknessOpacity }}
        ></div>

        {/* Map labels */}
        {subEvent.labels?.map((label: MapLabel, index: number) => {
          const labelOpacity =
            scrollProgress >= label.appearAt &&
            scrollProgress <= (label.disappearAt ?? 1)
              ? 1
              : 0;

          // Adjust label positions based on image cropping
          const adjustedX = imageTransform.offsetX === 0
            ? label.x
            : (label.x - imageTransform.offsetX) * (100 / (100 - 2 * imageTransform.offsetX));
          const adjustedY = imageTransform.offsetY === 0
            ? label.y
            : (label.y - imageTransform.offsetY) * (100 / (100 - 2 * imageTransform.offsetY));

          return (
            <div
              key={`label-${index}`}
              className="absolute transition-all duration-700 ease-in-out"
              style={{
                left: `${adjustedX}%`,
                top: `${adjustedY}%`,
                transform: `translate(-50%, -50%) translateY(${labelOpacity === 1 ? 0 : 20}px)`,
                opacity: labelOpacity,
              }}
            >
              <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-lg shadow-2xl max-w-sm">
                <p className="text-base md:text-lg leading-relaxed text-gray-800 font-serif">
                  {label.text}
                </p>
              </div>
            </div>
          );
        })}

        {/* Map markers */}
        {subEvent.markers?.map((marker: MapMarker, index: number) => {
          const markerOpacity =
            scrollProgress >= marker.appearAt &&
            scrollProgress <= (marker.disappearAt ?? 1)
              ? 1
              : 0;
          const size = marker.size ?? 24;

          // Adjust marker positions based on image cropping
          const adjustedX = imageTransform.offsetX === 0
            ? marker.x
            : (marker.x - imageTransform.offsetX) * (100 / (100 - 2 * imageTransform.offsetX));
          const adjustedY = imageTransform.offsetY === 0
            ? marker.y
            : (marker.y - imageTransform.offsetY) * (100 / (100 - 2 * imageTransform.offsetY));

          const shape = marker.shape || 'square';
          const colorName = marker.color || 'yellow';
          const direction = marker.direction || 0;

          // Scale size and radius based on image scale to maintain proportions
          const scaleFactor = imageTransform.scale;
          const scaledSize = size * scaleFactor;
          const scaledRadius = (marker.radius || size * 3) * scaleFactor;
          const fieldOfView = marker.fieldOfView || 90;

          // Color mapping for common Tailwind colors
          const colorMap: Record<string, { fill: string; stroke: string; fillDark: string }> = {
            yellow: { fill: '#FBBF24', stroke: '#D97706', fillDark: '#F59E0B' },
            red: { fill: '#F87171', stroke: '#DC2626', fillDark: '#EF4444' },
            blue: { fill: '#60A5FA', stroke: '#2563EB', fillDark: '#3B82F6' },
            green: { fill: '#34D399', stroke: '#059669', fillDark: '#10B981' },
            purple: { fill: '#A78BFA', stroke: '#7C3AED', fillDark: '#8B5CF6' },
            orange: { fill: '#FB923C', stroke: '#EA580C', fillDark: '#F97316' },
            pink: { fill: '#F472B6', stroke: '#DB2777', fillDark: '#EC4899' },
          };

          const colors = colorMap[colorName] || colorMap.yellow;

          return (
            <div
              key={index}
              className="absolute transition-all duration-500 ease-in-out"
              style={{
                left: `${adjustedX}%`,
                top: `${adjustedY}%`,
                transform: 'translate(-50%, -50%)',
                opacity: markerOpacity,
              }}
            >
              {/* Render shape based on type */}
              {shape === 'square' && (
                <div
                  className="shadow-lg"
                  style={{
                    width: `${scaledSize}px`,
                    height: `${scaledSize}px`,
                    backgroundColor: colors.fill,
                    border: `2px solid ${colors.stroke}`,
                  }}
                />
              )}

              {shape === 'triangle' && (
                <svg width={scaledSize} height={scaledSize} style={{ transform: `rotate(${direction}deg)` }}>
                  <polygon
                    points={`${scaledSize/2},0 ${scaledSize},${scaledSize} 0,${scaledSize}`}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="2"
                  />
                </svg>
              )}

              {shape === 'arrow' && (
                <svg width={scaledSize * 1.5} height={scaledSize} style={{ transform: `rotate(${direction}deg)` }}>
                  <path
                    d={`M 0,${scaledSize/2} L ${scaledSize},${scaledSize/2} L ${scaledSize},${scaledSize*0.2} L ${scaledSize*1.5},${scaledSize/2} L ${scaledSize},${scaledSize*0.8} L ${scaledSize},${scaledSize/2} Z`}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="2"
                  />
                </svg>
              )}

              {shape === 'semicircle' && (
                <svg width={scaledRadius * 2} height={scaledRadius * 2} style={{ transform: `rotate(${direction - 90}deg)` }}>
                  {/* CCTV vision cone */}
                  <path
                    d={(() => {
                      const startAngle = -fieldOfView / 2;
                      const endAngle = fieldOfView / 2;
                      const start = {
                        x: scaledRadius + scaledRadius * Math.cos((startAngle * Math.PI) / 180),
                        y: scaledRadius + scaledRadius * Math.sin((startAngle * Math.PI) / 180),
                      };
                      const end = {
                        x: scaledRadius + scaledRadius * Math.cos((endAngle * Math.PI) / 180),
                        y: scaledRadius + scaledRadius * Math.sin((endAngle * Math.PI) / 180),
                      };
                      return `M ${scaledRadius},${scaledRadius} L ${start.x},${start.y} A ${scaledRadius},${scaledRadius} 0 0,1 ${end.x},${end.y} Z`;
                    })()}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  {/* Camera center point */}
                  <circle
                    cx={scaledRadius}
                    cy={scaledRadius}
                    r={scaledSize / 2}
                    fill={colors.fillDark}
                    stroke={colors.stroke}
                    strokeWidth="2"
                  />
                </svg>
              )}

              {/* Optional label */}
              {marker.label && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  <div
                    className="backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md"
                    style={{
                      backgroundColor: `${colors.fill}E6`, // E6 = 90% opacity in hex
                      border: `1px solid ${colors.stroke}`,
                    }}
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {marker.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll-triggered effects overlay */}
      <div className="relative z-10 h-full flex items-center justify-center pt-20 pb-4">
        {/* Caption appears early in scroll */}
        {subEvent.caption && (
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
        )}
      </div>
    </div>
  );
}
