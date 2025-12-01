'use client';

import { useState } from 'react';
import { TimelineEvent as TimelineEventType } from '@/types/timeline';
import { getCategory } from '@/app/themes/categories';
import { calculateEventSpacing } from '@/app/config/timeline';
import Image from 'next/image';

// Helper function to convert Tailwind bg class to actual color
function getCategoryBgColor(bgClass: string): string {
  const colorMap: Record<string, string> = {
    'bg-blue-600': '#2563eb',
    'bg-green-400': '#4ade80',
    'bg-red-600': '#dc2626',
    'bg-red-400': '#f87171',
    'bg-yellow-600': '#ca8a04',
    'bg-purple-600': '#9333ea',
  };
  return colorMap[bgClass] || '#2563eb';
}

interface TimelineEventProps {
  event: TimelineEventType;
  index: number;
  nextEvent?: TimelineEventType;
  previousEvent?: TimelineEventType;
}

export default function TimelineEvent({ event, index, nextEvent, previousEvent }: TimelineEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const isEven = index % 2 === 0;

  // Parse multiple categories (separated by comma or slash)
  const categories = event.category
    ? event.category.split(/[,/]/).map(c => c.trim()).filter(c => c)
    : [];

  const categoryObjects = categories.length > 0
    ? categories.map(cat => getCategory(cat))
    : [getCategory(undefined)];

  // Use first category for text display
  const category = categoryObjects[0];

  // Calculate spacing based on time difference to next event
  const spacing = (() => {
    if (!nextEvent) return 64; // Default spacing for last event

    try {
      const currentTime = new Date(event.datetime).getTime();
      const nextTime = new Date(nextEvent.datetime).getTime();
      return calculateEventSpacing(currentTime, nextTime);
    } catch {
      return 64; // Fallback to default spacing
    }
  })();

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const dateFormatted = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
      const timeFormatted = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
      return { date: dateFormatted, time: timeFormatted };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  // Check if approx is a truthy value (true, yes, 1, etc.)
  const isApprox = event.approx &&
    (event.approx.toLowerCase() === 'true' ||
     event.approx.toLowerCase() === 'yes' ||
     event.approx === '1');

  const { date, time } = formatDateTime(event.datetime);

  // Check if we should show the date (first event or different day from previous)
  const shouldShowDate = (() => {
    if (!previousEvent) return true; // First event always shows date

    try {
      const currentDate = new Date(event.datetime).toDateString();
      const previousDate = new Date(previousEvent.datetime).toDateString();
      return currentDate !== previousDate;
    } catch {
      return true; // Show date if there's an error parsing
    }
  })();

  // Check if description is long enough to need expand/collapse
  // Heuristic: ~80 chars per line, 5 lines = ~400 chars
  const isLongDescription = event.description.length > 400;

  return (
    <div className={`flex gap-8 ${isEven ? 'flex-row' : 'flex-row-reverse'}`} style={{ marginBottom: `${spacing}px` }}>
      {/* Content Side */}
      <div className={`flex-1 ${isEven ? 'text-right' : 'text-left'}`}>
        <div className="inline-block max-w-xl">
          <div className="text-sm font-medium text-gray-500">
            {event.category && (
              <>
                {categoryObjects.length === 2 ? (
                  <>
                    <span className={`font-semibold ${categoryObjects[0].textColor} uppercase tracking-wide`}>
                      {categoryObjects[0].name}
                    </span>
                    <span className="mx-1 normal-case">and</span>
                    <span className={`font-semibold ${categoryObjects[1].textColor} uppercase tracking-wide`}>
                      {categoryObjects[1].name}
                    </span>
                    {event.actors && <span className="normal-case"> ({event.actors})</span>}
                  </>
                ) : (
                  <span className={`font-semibold ${category.textColor} uppercase tracking-wide`}>
                    {category.name}
                    {event.actors && <span className="normal-case"> ({event.actors})</span>}
                  </span>
                )}
                <span className="mx-2">•</span>
              </>
            )}
            {shouldShowDate && <time>{date}</time>}
            {shouldShowDate && time && <span className="mx-2">•</span>}
            {time && <time className="font-semibold text-blue-600">{isApprox ? `~${time}` : time}</time>}
          </div>
          <h3 className="text-2xl font-bold mt-2 mb-3 text-gray-900">
            {event.title}
          </h3>
          <p className={`mt-4 text-base leading-relaxed text-gray-700 whitespace-pre-wrap ${!isExpanded && isLongDescription ? 'line-clamp-5' : ''}`}>
            {event.description}
          </p>
          {isLongDescription && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {event.source && (
            <div className="mt-3 text-xs text-gray-500">
              <span className="font-semibold">Source: </span>
              {(event.sourceText || event.source.startsWith('http')) ? (
                <a href={event.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                  {event.sourceText || event.source}
                </a>
              ) : (
                <span>{event.source}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Line & Dot */}
      <div className="relative flex flex-col items-center" style={{ minHeight: '100%' }}>
        {/* Node dot positioned at top */}
        {categoryObjects.length === 2 ? (
          <div
            className="w-4 h-4 rounded-full border-4 border-white shadow-lg z-10 shrink-0 mt-1"
            style={{
              background: `linear-gradient(90deg, ${getCategoryBgColor(categoryObjects[0].bg)} 50%, ${getCategoryBgColor(categoryObjects[1].bg)} 50%)`
            }}
          />
        ) : (
          <div className={`w-4 h-4 rounded-full ${category.bg} border-4 border-white shadow-lg z-10 shrink-0 mt-1`} />
        )}

        {/* Line extending downward through full height and margin to next event */}
        <div className="w-0.5 bg-gray-300 flex-1 absolute top-5" style={{ left: 'calc(50% - 0.5px)', bottom: `-${spacing}px` }} />
      </div>

      {/* Media Side (or Empty for Balance) */}
      <div className="flex-1">
        {event.photo && (
          imageError ? (
            <div className="mt-1 rounded-lg max-w-xl border-2 border-dashed border-gray-400 shadow-sm bg-gray-50 p-8 flex items-center justify-center" style={{ width: '400px', height: '300px' }}>
              <div className="text-center text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          ) : (
            <div className="mt-1 rounded-lg overflow-hidden max-w-xl inline-block border border-gray-300 shadow-sm">
              <Image
                src={event.photo}
                alt={event.title}
                width={400}
                height={300}
                className="w-full h-auto object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )
        )}
        {event.video && (() => {
          // If video error, show placeholder
          if (videoError) {
            return (
              <div className="mt-1 rounded-lg max-w-xl border-2 border-dashed border-gray-400 shadow-sm bg-gray-50 p-8 flex items-center justify-center" style={{ width: '400px', height: '225px' }}>
                <div className="text-center text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Video unavailable</p>
                </div>
              </div>
            );
          }

          // Extract video ID and platform
          const videoUrl = event.video;
          let embedUrl: string | null = null;
          let isDirectVideo = false;

          // Check for YouTube
          const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
          if (youtubeMatch) {
            embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
          }

          // Check for Vimeo
          const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
          if (vimeoMatch) {
            embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          }

          // Check for direct video files
          const videoExtensions = ['.mp4', '.webm', '.ogg'];
          if (videoExtensions.some(ext => videoUrl.toLowerCase().includes(ext))) {
            isDirectVideo = true;
          }

          if (embedUrl) {
            // Embed YouTube or Vimeo
            return (
              <div className="mt-1 rounded-lg overflow-hidden max-w-xl inline-block border border-gray-300 shadow-sm">
                <iframe
                  src={embedUrl}
                  width="400"
                  height="225"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-auto aspect-video"
                  onError={() => setVideoError(true)}
                />
              </div>
            );
          } else if (isDirectVideo) {
            // Embed direct video file
            return (
              <div className="mt-1 rounded-lg overflow-hidden max-w-xl inline-block border border-gray-300 shadow-sm">
                <video
                  src={videoUrl}
                  controls
                  width="400"
                  height="225"
                  className="w-full h-auto"
                  onError={() => setVideoError(true)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          } else {
            // Unsupported video format - show placeholder
            return (
              <div className="mt-1 rounded-lg max-w-xl border-2 border-dashed border-gray-400 shadow-sm bg-gray-50 p-8 flex items-center justify-center" style={{ width: '400px', height: '225px' }}>
                <div className="text-center text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Video unavailable</p>
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
