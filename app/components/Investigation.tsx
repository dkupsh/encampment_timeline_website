'use client';

import { useState, useCallback, useEffect } from 'react';
import { InvestigationData } from '@/types/investigation';
import InvestigationEvent from './InvestigationEvent';

interface InvestigationProps {
  data: InvestigationData;
}

export default function Investigation({ data }: InvestigationProps) {
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentEventProgress, setCurrentEventProgress] = useState<number>(0);
  const [seekTarget, setSeekTarget] = useState<{ eventId: string; percentage: number } | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [autoplayDisabled, setAutoplayDisabled] = useState(false);
  const [pauseAllVideos, setPauseAllVideos] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleToggleAutoplay = () => {
    const newState = !autoplayDisabled;
    setAutoplayDisabled(newState);

    if (newState) {
      // Pause all videos when disabling autoplay
      setPauseAllVideos(true);
      setTimeout(() => setPauseAllVideos(false), 100);
    }
  };

  // Use global timeline bounds from data
  const overallStartTime = data.startTime;
  const overallEndTime = data.endTime;

  // Handle scroll to show/hide timeline
  useEffect(() => {
    const handleScroll = () => {
      // Show timeline when scrolled down more than 100px
      setShowTimeline(window.scrollY > 100);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle visibility changes from events
  const handleVisibilityChange = useCallback((eventId: string, isVisible: boolean) => {
    if (isVisible) {
      setCurrentEventId(eventId);
    }
  }, []);

  // Handle progress updates from events
  const handleProgressUpdate = useCallback((eventId: string, progress: number) => {
    setCurrentEventId(eventId);
    setCurrentEventProgress(progress);
  }, []);

  // Parse time string to minutes (handles both "HH:MM:SS" and "HH:MM a.m./p.m." formats)
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;

    // Handle "HH:MM a.m./p.m." format
    const amPmMatch = timeStr.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1]);
      const minutes = parseInt(amPmMatch[2]);
      const isPM = amPmMatch[3].toLowerCase().includes('p');

      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      return hours * 60 + minutes;
    }

    // Handle "HH:MM:SS" or "H:MM:SS" format
    const parts = timeStr.split(':').map(p => parseInt(p.trim()));
    if (parts.length >= 2) {
      const hours = parts[0];
      const minutes = parts[1];
      return hours * 60 + minutes;
    }

    return 0;
  };

  // Format time to 12-hour format with a.m./p.m.
  const formatTimeTo12Hour = (timeStr: string, includeSeconds: boolean = false): string => {
    if (!timeStr) return '';

    // If already in 12-hour format, return as-is
    if (timeStr.match(/a\.m\.|p\.m\.|am|pm/i)) {
      return timeStr;
    }

    // Parse 24-hour format
    const parts = timeStr.split(':').map(p => parseInt(p.trim()));
    if (parts.length >= 2) {
      let hours = parts[0];
      const minutes = parts[1];
      const seconds = parts[2] || 0;

      const isPM = hours >= 12;
      if (hours === 0) hours = 12;
      else if (hours > 12) hours -= 12;

      const period = isPM ? 'p.m.' : 'a.m.';

      if (includeSeconds || parts.length >= 3) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
      }

      return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    return timeStr;
  };

  // Calculate current time based on event and progress
  const calculateCurrentTime = (): string => {
    if (!currentEventId) return formatTimeTo12Hour(overallStartTime);

    const currentEvent = data.events.find(e => e.id === currentEventId);
    if (!currentEvent) return formatTimeTo12Hour(overallStartTime);

    const eventStartMinutes = parseTimeToMinutes(currentEvent.startTime);
    const eventEndMinutes = currentEvent.endTime
      ? parseTimeToMinutes(currentEvent.endTime)
      : parseTimeToMinutes(data.events[data.events.findIndex(e => e.id === currentEventId) + 1]?.startTime || currentEvent.startTime);

    // Handle times that cross midnight
    let eventDuration = eventEndMinutes - eventStartMinutes;
    if (eventDuration < 0) eventDuration += 24 * 60;

    const progressMinutes = (currentEventProgress / 100) * eventDuration;
    const totalSeconds = (eventStartMinutes * 60) + (progressMinutes * 60);
    const normalizedSeconds = totalSeconds % (24 * 60 * 60);

    const hours = Math.floor(normalizedSeconds / 3600);
    const minutes = Math.floor((normalizedSeconds % 3600) / 60);
    const seconds = Math.floor(normalizedSeconds % 60);

    // Format as HH:MM:SS for conversion
    return formatTimeTo12Hour(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  // Calculate overall progress percentage
  const calculateOverallProgress = (): number => {
    if (!currentEventId) return 0;

    const currentEventIndex = data.events.findIndex(e => e.id === currentEventId);
    if (currentEventIndex === -1) return 0;

    const overallStart = parseTimeToMinutes(overallStartTime);
    const overallEnd = parseTimeToMinutes(overallEndTime);
    let totalDuration = overallEnd - overallStart;
    if (totalDuration < 0) totalDuration += 24 * 60;

    const currentEvent = data.events[currentEventIndex];
    const eventStart = parseTimeToMinutes(currentEvent.startTime);
    let eventStartOffset = eventStart - overallStart;
    if (eventStartOffset < 0) eventStartOffset += 24 * 60;

    const eventEnd = currentEvent.endTime
      ? parseTimeToMinutes(currentEvent.endTime)
      : parseTimeToMinutes(data.events[currentEventIndex + 1]?.startTime || currentEvent.startTime);

    let eventDuration = eventEnd - eventStart;
    if (eventDuration < 0) eventDuration += 24 * 60;

    const progressWithinEvent = (currentEventProgress / 100) * eventDuration;
    const totalProgress = eventStartOffset + progressWithinEvent;

    return (totalProgress / totalDuration) * 100;
  };

  const currentTime = calculateCurrentTime();
  const overallProgress = calculateOverallProgress();

  // Handle timeline bar click to jump to position
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timelineBar = e.currentTarget;
    const rect = timelineBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    // Calculate which event this percentage corresponds to
    const overallStart = parseTimeToMinutes(overallStartTime);
    const overallEnd = parseTimeToMinutes(overallEndTime);
    let totalDuration = overallEnd - overallStart;
    if (totalDuration < 0) totalDuration += 24 * 60;

    const targetMinutes = overallStart + (percentage * totalDuration);

    // Find the event that contains this time
    let targetEventIndex = -1;
    let targetEventStartMinutes = 0;
    let targetEventEndMinutes = 0;

    for (let i = 0; i < data.events.length; i++) {
      const event = data.events[i];
      const eventStart = parseTimeToMinutes(event.startTime);
      const eventEnd = event.endTime
        ? parseTimeToMinutes(event.endTime)
        : parseTimeToMinutes(data.events[i + 1]?.startTime || event.startTime);

      let eventStartAdjusted = eventStart;
      let eventEndAdjusted = eventEnd;

      // Handle midnight crossing
      if (eventStart < overallStart) eventStartAdjusted += 24 * 60;
      if (eventEnd < overallStart) eventEndAdjusted += 24 * 60;

      const targetAdjusted = targetMinutes >= overallStart ? targetMinutes : targetMinutes + 24 * 60;

      if (targetAdjusted >= eventStartAdjusted && targetAdjusted <= eventEndAdjusted) {
        targetEventIndex = i;
        targetEventStartMinutes = eventStartAdjusted;
        targetEventEndMinutes = eventEndAdjusted;
        break;
      }
    }

    // Scroll to the target event and seek to position
    if (targetEventIndex !== -1) {
      const targetEvent = data.events[targetEventIndex];

      // Calculate percentage within the event
      const targetAdjusted = targetMinutes >= overallStart ? targetMinutes : targetMinutes + 24 * 60;
      const eventDuration = targetEventEndMinutes - targetEventStartMinutes;
      const positionInEvent = targetAdjusted - targetEventStartMinutes;
      const percentageInEvent = eventDuration > 0 ? (positionInEvent / eventDuration) * 100 : 0;

      // Set seek target for the event to pick up
      setSeekTarget({ eventId: targetEvent.id, percentage: percentageInEvent });

      // Scroll to the target event
      const element = document.getElementById(targetEvent.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Global Timeline Bar - Sticky at top */}
      <div className={`fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40 shadow-sm transition-transform duration-300 ${
        showTimeline ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-4">
          <div className="flex items-center gap-6">
            {/* Timeline bar */}
            <div className="flex-1">
              <div className="relative">
                {/* Timeline container */}
                <div
                  className="h-1 bg-gray-200 rounded-full relative cursor-pointer hover:h-1.5 transition-all"
                  onClick={handleTimelineClick}
                  title="Click to jump to position"
                >
                  {/* Progress indicator */}
                  <div
                    className="absolute top-0 left-0 h-full bg-[#e8927c] rounded-full transition-all duration-300 pointer-events-none"
                    style={{ width: `${overallProgress}%` }}
                  ></div>

                  {/* Current position circle */}
                  <div
                    className="absolute -top-1.5 w-4 h-4 bg-[#e8927c] rounded-full border-2 border-white shadow-md transition-all duration-300 pointer-events-none"
                    style={{ left: `calc(${overallProgress}% - 0.5rem)` }}
                  ></div>
                </div>

                {/* Time labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-500 font-sans">
                  <span>{formatTimeTo12Hour(overallStartTime, false)}</span>
                  <span>{formatTimeTo12Hour(overallEndTime, false)}</span>
                </div>
              </div>
            </div>

            {/* Current time display with autoplay toggle button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleAutoplay}
                className={`px-3 py-1.5 text-sm font-sans rounded transition-colors ${
                  autoplayDisabled
                    ? 'bg-[#e8927c] hover:bg-[#d67e6c] text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={autoplayDisabled ? "Resume autoplay" : "Pause autoplay"}
              >
                {autoplayDisabled ? 'Play' : 'Pause'}
              </button>
              <div className="text-right min-w-[120px]">
                <div className="text-lg font-sans text-[#e8927c] font-medium">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - NYT Style */}
      <header className="min-h-screen flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 py-20">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight font-serif">
            {data.title}
          </h1>
          {data.description && (
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed font-serif max-w-3xl mx-auto">
              {data.description}
            </p>
          )}
          <div className="mt-16">
            <div className="animate-bounce">
              <svg
                className="w-6 h-6 mx-auto text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
            <p className="text-sm text-gray-400 mt-4 uppercase tracking-wide">Scroll to explore</p>
          </div>
        </div>
      </header>

      {/* Events - Clean separation without heavy borders */}
      <div>
        {data.events.map((event, index) => (
          <div key={event.id}>
            <InvestigationEvent
              event={event}
              nextEvent={data.events[index + 1]}
              overallStartTime={overallStartTime}
              overallEndTime={overallEndTime}
              maxWidth={data.maxWidth}
              onVisibilityChange={(isVisible) => handleVisibilityChange(event.id, isVisible)}
              onProgressUpdate={(progress) => handleProgressUpdate(event.id, progress)}
              seekTarget={seekTarget?.eventId === event.id ? seekTarget.percentage : undefined}
              onSeekComplete={() => setSeekTarget(null)}
              pauseAllVideos={pauseAllVideos}
              autoplayDisabled={autoplayDisabled}
              onAutoplayChange={setAutoplayDisabled}
            />
            {index < data.events.length - 1 && (
              <div className="mx-auto px-8 md:px-16 lg:px-24" style={{ maxWidth: data.maxWidth || '1200px' }}>
                <div className="border-t border-gray-200" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer - Minimal and clean */}
      <footer className="py-20 px-8 md:px-16 lg:px-24 text-center border-t border-gray-200 mt-20">
        <p className="text-gray-500 text-sm font-sans">
          Timeline of Pro-Palestine Demonstrations at UCLA
        </p>
        <button
          onClick={scrollToTop}
          className="text-gray-400 hover:text-gray-600 text-xs mt-2 font-sans uppercase tracking-wide transition-colors cursor-pointer underline"
        >
          Scroll back to top
        </button>
      </footer>
    </div>
  );
}
