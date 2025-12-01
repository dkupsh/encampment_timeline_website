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
          {event.media && (() => {
            // Check if media is likely an image URL
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
            const isImageUrl = imageExtensions.some(ext =>
              event.media?.toLowerCase().includes(ext)
            );

            if (isImageUrl) {
              return (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <Image
                    src={event.media}
                    alt={event.title}
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover"
                  />
                </div>
              );
            } else {
              // Render as a clickable link
              return (
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-semibold">Media: </span>
                  <a
                    href={event.media}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    {event.mediaText || event.media}
                  </a>
                </div>
              );
            }
          })()}
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

      {/* Empty Side for Balance */}
      <div className="flex-1" />
    </div>
  );
}
