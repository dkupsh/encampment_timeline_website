"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { InvestigationEvent as InvestigationEventType } from "@/types/investigation";
import SubEvents from "./SubEvents";

interface InvestigationEventProps {
	event: InvestigationEventType;
	nextEvent?: { startTime: string; endTime?: string };
	overallStartTime?: string;
	overallEndTime?: string;
	maxWidth?: string;
	onVisibilityChange?: (isVisible: boolean) => void;
	onProgressUpdate?: (progress: number) => void;
	seekTarget?: number; // Percentage to seek to (0-100)
	onSeekComplete?: () => void;
	pauseAllVideos?: boolean;
	autoplayDisabled?: boolean;
	onAutoplayChange?: (disabled: boolean) => void;
}

export default function InvestigationEvent({
	event,
	nextEvent,
	overallStartTime,
	overallEndTime,
	maxWidth,
	onVisibilityChange,
	onProgressUpdate,
	seekTarget,
	onSeekComplete,
	pauseAllVideos,
	autoplayDisabled,
	onAutoplayChange,
}: InvestigationEventProps) {
	const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
	const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const lastStopTimeRef = useRef<number>(0);
	const lastProcessedSeekRef = useRef<number | undefined>(undefined);

	// Use refs for callbacks to avoid recreating IntersectionObserver
	const onVisibilityChangeRef = useRef(onVisibilityChange);
	const onProgressUpdateRef = useRef(onProgressUpdate);

	const [shouldLoad, setShouldLoad] = useState(false);
	const [videoProgress, setVideoProgress] = useState<number[]>(
		new Array(event.clips.length).fill(0)
	);
	const [expandedVideoIndex, setExpandedVideoIndex] = useState<number | null>(
		null
	);
	const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number[]>(
		new Array(event.clips.length).fill(0)
	);
	const [segmentDurations, setSegmentDurations] = useState<number[][]>(
		event.clips.map(() => [])
	);
	const [expandedVideoProgress, setExpandedVideoProgress] = useState(0);
	const [expandedCurrentTime, setExpandedCurrentTime] = useState(0);
	const [expandedTotalDuration, setExpandedTotalDuration] = useState(0);
	const [videoLoading, setVideoLoading] = useState<boolean[]>(
		new Array(event.clips.length).fill(false)
	);

	// Keep refs up to date
	useEffect(() => {
		onVisibilityChangeRef.current = onVisibilityChange;
		onProgressUpdateRef.current = onProgressUpdate;
	});

	// Lazy load videos based on viewport proximity
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Check if already in viewport on mount
		const checkInitialVisibility = () => {
			const rect = container.getBoundingClientRect();
			const windowHeight =
				window.innerHeight || document.documentElement.clientHeight;
			const margin = 300; // Same as rootMargin - reduced for better performance

			if (rect.top <= windowHeight + margin && rect.bottom >= -margin) {
				setShouldLoad(true);
			}
		};

		checkInitialVisibility();

		const loadObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setShouldLoad(true);
					}
				});
			},
			{
				rootMargin: "300px 0px 300px 0px", // Reduced from 1200px - load closer to viewport
				threshold: 0.01, // Trigger even with minimal visibility
			}
		);

		loadObserver.observe(container);

		return () => {
			loadObserver.disconnect();
		};
	}, []);

	// Calculate overall progress for multi-segment videos
	const calculateOverallProgress = useCallback((clipIndex: number): number => {
		const clip = event.clips[clipIndex];
		// Use expanded video ref if this is the expanded video, otherwise use grid video ref
		const video =
			expandedVideoIndex === clipIndex && expandedVideoRef.current
				? expandedVideoRef.current
				: videoRefs.current[clipIndex];

		if (!video || !video.duration) return 0;

		// For single URL, return simple progress
		if (typeof clip.url === "string") {
			return (video.currentTime / video.duration) * 100;
		}

		// For multi-segment, calculate total progress
		const durations = segmentDurations[clipIndex];
		const currentSegment = currentSegmentIndex[clipIndex];

		// Calculate total duration across all segments
		const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
		if (totalDuration === 0)
			return (video.currentTime / video.duration) * 100;

		// Calculate cumulative time: completed segments + current position
		const completedDuration = durations
			.slice(0, currentSegment)
			.reduce((sum, dur) => sum + dur, 0);
		const currentTime = completedDuration + video.currentTime;

		return (currentTime / totalDuration) * 100;
	}, [event.clips, expandedVideoIndex, segmentDurations, currentSegmentIndex]);

	// Track video progress and keep videos in sync
	useEffect(() => {
		// Capture current videos to use in cleanup
		const videos = videoRefs.current;

		const updateProgress = (index: number) => () => {
			const progress = calculateOverallProgress(index);

			setVideoProgress((prev) => {
				const newProgress = [...prev];
				newProgress[index] = progress;
				return newProgress;
			});

			// Report progress of the first video to parent (all videos are synced)
			// Must be outside setState to avoid calling setState during render
			if (index === 0 && onProgressUpdateRef.current) {
				onProgressUpdateRef.current(progress);
			}
		};

		const handleMetadata = (index: number) => () => {
			const video = videos[index];
			const clip = event.clips[index];

			if (video && video.duration && typeof clip.url !== "string") {
				setSegmentDurations((prev) => {
					const newDurations = [...prev];
					const currentSegment = currentSegmentIndex[index];
					if (!newDurations[index]) newDurations[index] = [];
					newDurations[index][currentSegment] = video.duration;
					return newDurations;
				});
			}
		};

		const handleLoadStart = (index: number) => () => {
			setVideoLoading((prev) => {
				const newLoading = [...prev];
				newLoading[index] = true;
				return newLoading;
			});
		};

		const handleLoadedData = (index: number) => () => {
			setVideoLoading((prev) => {
				const newLoading = [...prev];
				newLoading[index] = false;
				return newLoading;
			});
		};

		videos.forEach((video, index) => {
			if (video) {
				const progressHandler = updateProgress(index);
				const metadataHandler = handleMetadata(index);
				const loadStartHandler = handleLoadStart(index);
				const loadedDataHandler = handleLoadedData(index);

				video.addEventListener("timeupdate", progressHandler);
				video.addEventListener("loadedmetadata", metadataHandler);
				video.addEventListener("loadstart", loadStartHandler);
				video.addEventListener("loadeddata", loadedDataHandler);
			}
		});

		// Sync all videos periodically to handle drift
		const syncInterval = setInterval(() => {
			if (videos.length <= 1) return;

			const firstVideo = videos[0];
			if (!firstVideo || !firstVideo.duration) return;

			const targetTime = firstVideo.currentTime;

			videos.forEach((video, index) => {
				if (index === 0 || !video || !video.duration) return;

				// If video has drifted more than 0.3 seconds, resync it
				const timeDiff = Math.abs(video.currentTime - targetTime);
				if (timeDiff > 0.3) {
					video.currentTime = targetTime;
				}
			});
		}, 1000); // Check every second

		return () => {
			clearInterval(syncInterval);
			videos.forEach((video, index) => {
				if (video) {
					const progressHandler = updateProgress(index);
					const metadataHandler = handleMetadata(index);
					const loadStartHandler = handleLoadStart(index);
					const loadedDataHandler = handleLoadedData(index);

					video.removeEventListener("timeupdate", progressHandler);
					video.removeEventListener(
						"loadedmetadata",
						metadataHandler
					);
					video.removeEventListener("loadstart", loadStartHandler);
					video.removeEventListener("loadeddata", loadedDataHandler);
				}
			});
		};
	}, [shouldLoad, currentSegmentIndex, segmentDurations, calculateOverallProgress, event.clips]);

	// Auto-play/pause videos based on visibility
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const playObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const visible = entry.isIntersecting;
					onVisibilityChangeRef.current?.(visible);

					// Auto-play/pause videos based on visibility
					if (visible) {
						// Don't auto-play if globally disabled
						if (autoplayDisabled) {
							return;
						}

						// Check if stop was clicked recently (within 3 seconds)
						const timeSinceStop =
							Date.now() - lastStopTimeRef.current;
						const shouldPreventAutoPlay = timeSinceStop < 3000;

						if (shouldPreventAutoPlay) {
							// Don't auto-play if stop was recently clicked
							return;
						}

						videoRefs.current.forEach((video) => {
							if (video && video.readyState >= 2) {
								// Check if video has loaded enough data
								video.play().catch(() => {
									// Autoplay might be blocked, that's okay
								});
							} else if (video) {
								// If video isn't ready, try playing once it's loaded
								const playWhenReady = () => {
									video.play().catch(() => {
										// Autoplay might be blocked
									});
									video.removeEventListener(
										"loadeddata",
										playWhenReady
									);
								};
								video.addEventListener(
									"loadeddata",
									playWhenReady
								);
							}
						});
					} else {
						videoRefs.current.forEach((video) => {
							if (video) {
								video.pause();
							}
						});
					}
				});
			},
			{
				threshold: 0.3, // Reduced threshold to trigger more easily
				rootMargin: "0px",
			}
		);

		playObserver.observe(container);

		return () => {
			playObserver.disconnect();
		};
	}, [autoplayDisabled]);

	// Handle autoplay re-enable - play videos that are currently in view
	useEffect(() => {
		// Only trigger when autoplay is re-enabled
		if (!autoplayDisabled && containerRef.current) {
			const container = containerRef.current;
			const rect = container.getBoundingClientRect();
			const windowHeight =
				window.innerHeight || document.documentElement.clientHeight;

			// Check if container is in viewport (using same threshold as IntersectionObserver)
			const viewportTop = windowHeight * 0.3;
			const viewportBottom = windowHeight * 0.7;
			const isInView =
				rect.top < viewportBottom && rect.bottom > viewportTop;

			if (isInView) {
				// Container is in view, start playing videos
				videoRefs.current.forEach((video) => {
					if (video && video.readyState >= 2) {
						video.play().catch(() => {
							// Autoplay might be blocked, that's okay
						});
					} else if (video) {
						// If video isn't ready, try playing once it's loaded
						const playWhenReady = () => {
							video.play().catch(() => {
								// Autoplay might be blocked
							});
							video.removeEventListener("loadeddata", playWhenReady);
						};
						video.addEventListener("loadeddata", playWhenReady);
					}
				});
			}
		}
	}, [autoplayDisabled]);

	// Determine grid layout based on number of clips
	const getGridCols = () => {
		const clipCount = event.clips.length;
		if (clipCount === 1) return "md:grid-cols-1"; // Single video, full width
		if (clipCount === 2) return "md:grid-cols-2"; // Two videos side by side
		return "md:grid-cols-2"; // 3+ videos in 2-column grid
	};

	// Helper to determine max width based on clip count
	const getMaxWidth = () => {
		const clipCount = event.clips.length;
		if (clipCount === 1) return "800px"; // Single video, larger
		if (clipCount === 2) return "600px"; // Two videos, medium size
		return "none"; // 3+ videos, no constraint
	};

	// Seek all videos in the event based on progress bar click
	const handleProgressBarClick = (
		e: React.MouseEvent<HTMLDivElement>,
		videoIndex: number
	) => {
		e.stopPropagation(); // Prevent triggering video expand
		const clip = event.clips[videoIndex];

		const progressBar = e.currentTarget;
		const rect = progressBar.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const percentage = clickX / rect.width;

		// Handle multi-segment videos
		if (typeof clip.url !== "string") {
			const durations = segmentDurations[videoIndex];
			const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);

			if (totalDuration === 0) return;

			const targetTime = percentage * totalDuration;
			let accumulatedTime = 0;
			let targetSegment = 0;
			let timeInSegment = 0;

			// Find which segment the target time falls into
			for (let i = 0; i < durations.length; i++) {
				if (targetTime <= accumulatedTime + durations[i]) {
					targetSegment = i;
					timeInSegment = targetTime - accumulatedTime;
					break;
				}
				accumulatedTime += durations[i];
			}

			// If we need to switch segments, do it for all videos
			if (targetSegment !== currentSegmentIndex[videoIndex]) {
				setCurrentSegmentIndex((prev) => prev.map(() => targetSegment));
				// After segment loads, seek to the position
				setTimeout(() => {
					videoRefs.current.forEach((v) => {
						if (v) {
							v.currentTime = timeInSegment;
						}
					});
					// Also seek expanded video if it's open
					if (
						expandedVideoIndex === videoIndex &&
						expandedVideoRef.current
					) {
						expandedVideoRef.current.currentTime = timeInSegment;
					}
				}, 100);
			} else {
				// Same segment, just seek
				videoRefs.current.forEach((v) => {
					if (v) {
						v.currentTime = timeInSegment;
					}
				});
				// Also seek expanded video if it's open
				if (
					expandedVideoIndex === videoIndex &&
					expandedVideoRef.current
				) {
					expandedVideoRef.current.currentTime = timeInSegment;
				}
			}
		} else {
			// Single video - simple seek
			videoRefs.current.forEach((v) => {
				if (v && v.duration) {
					v.currentTime = percentage * v.duration;
				}
			});
			// Also seek expanded video if it's open
			if (expandedVideoIndex === videoIndex && expandedVideoRef.current) {
				expandedVideoRef.current.currentTime =
					percentage * (expandedVideoRef.current.duration || 0);
			}
		}
	};

	// Handle video expand/collapse
	const handleVideoClick = (index: number) => {
		setExpandedVideoIndex(index);
	};

	const closeExpandedVideo = () => {
		setExpandedVideoIndex(null);
	};

	// Sync expanded video time with grid video
	useEffect(() => {
		if (
			expandedVideoIndex !== null &&
			expandedVideoRef.current &&
			videoRefs.current[expandedVideoIndex]
		) {
			const gridVideo = videoRefs.current[expandedVideoIndex];
			const expandedVideo = expandedVideoRef.current;

			// Sync current time when modal opens
			if (gridVideo.currentTime) {
				expandedVideo.currentTime = gridVideo.currentTime;
			}

			// Keep them synced while modal is open
			const syncTime = () => {
				if (gridVideo && expandedVideo) {
					gridVideo.currentTime = expandedVideo.currentTime;
				}
			};

			expandedVideo.addEventListener("timeupdate", syncTime);

			return () => {
				expandedVideo.removeEventListener("timeupdate", syncTime);
			};
		}
	}, [expandedVideoIndex]);

	// Format time in MM:SS or HH:MM:SS format
	const formatTime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
				.toString()
				.padStart(2, "0")}`;
		}
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

	// Get total duration for a multi-segment video
	const getTotalDuration = useCallback((clipIndex: number): number => {
		const clip = event.clips[clipIndex];
		if (typeof clip.url === "string") {
			return videoRefs.current[clipIndex]?.duration || 0;
		}
		return (
			segmentDurations[clipIndex]?.reduce((sum, dur) => sum + dur, 0) || 0
		);
	}, [event.clips, segmentDurations]);

	// Get current time across all segments
	const getCurrentTime = useCallback((clipIndex: number): number => {
		const clip = event.clips[clipIndex];
		// Use expanded video ref if this is the expanded video, otherwise use grid video ref
		const video =
			expandedVideoIndex === clipIndex && expandedVideoRef.current
				? expandedVideoRef.current
				: videoRefs.current[clipIndex];

		if (!video || typeof clip.url === "string") {
			return video?.currentTime || 0;
		}

		const durations = segmentDurations[clipIndex];
		const currentSegment = currentSegmentIndex[clipIndex];
		const completedDuration = durations
			.slice(0, currentSegment)
			.reduce((sum, dur) => sum + dur, 0);

		return completedDuration + (video.currentTime || 0);
	}, [event.clips, expandedVideoIndex, segmentDurations, currentSegmentIndex]);

	// Track expanded video progress and time display
	useEffect(() => {
		if (expandedVideoIndex === null || !expandedVideoRef.current) return;

		const updateExpandedProgress = () => {
			const progress = calculateOverallProgress(expandedVideoIndex);
			setExpandedVideoProgress(progress);

			// Update current time for display
			const currentTime = getCurrentTime(expandedVideoIndex);
			setExpandedCurrentTime(currentTime);

			// Update total duration for display
			const totalDuration = getTotalDuration(expandedVideoIndex);
			setExpandedTotalDuration(totalDuration);
		};

		const video = expandedVideoRef.current;
		video.addEventListener("timeupdate", updateExpandedProgress);

		// Also update on loadedmetadata to get initial duration
		video.addEventListener("loadedmetadata", updateExpandedProgress);

		// Initial update
		updateExpandedProgress();

		return () => {
			video.removeEventListener("timeupdate", updateExpandedProgress);
			video.removeEventListener("loadedmetadata", updateExpandedProgress);
		};
	}, [expandedVideoIndex, currentSegmentIndex, segmentDurations, calculateOverallProgress, getCurrentTime, getTotalDuration]);

	// Close on ESC key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && expandedVideoIndex !== null) {
				closeExpandedVideo();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [expandedVideoIndex]);

	// Handle expanded video pause/play to sync with global autoplay state
	const handleExpandedVideoPause = () => {
		if (onAutoplayChange) {
			onAutoplayChange(true); // Set autoplay disabled to true
		}
	};

	const handleExpandedVideoPlay = () => {
		if (onAutoplayChange) {
			onAutoplayChange(false); // Set autoplay disabled to false
		}
	};

	// Handle pause all videos request from parent
	useEffect(() => {
		if (!pauseAllVideos) return;

		// Record when stop was clicked
		lastStopTimeRef.current = Date.now();

		// Pause all grid videos
		videoRefs.current.forEach((video) => {
			if (video) {
				video.pause();
			}
		});

		// Pause expanded video if open
		if (expandedVideoRef.current) {
			expandedVideoRef.current.pause();
		}
	}, [pauseAllVideos]);

	// Handle seek request from parent (global timeline click)
	useEffect(() => {
		if (seekTarget === undefined || seekTarget === null) return;

		// Skip if we've already processed this exact seek target
		if (seekTarget === lastProcessedSeekRef.current) return;
		lastProcessedSeekRef.current = seekTarget;

		// For single video, seek directly
		const firstClip = event.clips[0];
		if (typeof firstClip.url === "string") {
			videoRefs.current.forEach((video) => {
				if (video && video.duration) {
					video.currentTime = (seekTarget / 100) * video.duration;
				}
			});
			onSeekComplete?.();
			return;
		}

		// For multi-segment videos, calculate which segment and position
		const durations = segmentDurations[0];
		const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);

		if (totalDuration === 0) {
			onSeekComplete?.();
			return;
		}

		const targetTime = (seekTarget / 100) * totalDuration;
		let accumulatedTime = 0;
		let targetSegment = 0;
		let timeInSegment = 0;

		// Find which segment the target time falls into
		for (let i = 0; i < durations.length; i++) {
			if (targetTime <= accumulatedTime + durations[i]) {
				targetSegment = i;
				timeInSegment = targetTime - accumulatedTime;
				break;
			}
			accumulatedTime += durations[i];
		}

		// Get current segment index from state
		const currentSegment = currentSegmentIndex[0];

		// If we need to switch segments, do it for all videos
		if (targetSegment !== currentSegment) {
			// Schedule state update asynchronously to avoid synchronous setState in effect
			setTimeout(() => {
				setCurrentSegmentIndex((prev) => prev.map(() => targetSegment));
			}, 0);

			// After segment loads, seek to the position
			setTimeout(() => {
				videoRefs.current.forEach((v) => {
					if (v) {
						v.currentTime = timeInSegment;
					}
				});
				onSeekComplete?.();
			}, 100);
		} else {
			// Same segment, just seek
			videoRefs.current.forEach((v) => {
				if (v) {
					v.currentTime = timeInSegment;
				}
			});
			onSeekComplete?.();
		}
	}, [seekTarget, segmentDurations, event.clips, onSeekComplete, currentSegmentIndex]);

	// Get current video URL for a clip (handles both string and array)
	const getCurrentVideoUrl = (
		clip: (typeof event.clips)[0],
		segmentIndex: number
	): string | undefined => {
		if (!shouldLoad) return undefined;
		if (typeof clip.url === "string") return clip.url;
		return clip.url[segmentIndex] || clip.url[0];
	};

	// Handle video ended - advance to next segment if available
	const handleVideoEnded = (clipIndex: number) => {
		const clip = event.clips[clipIndex];
		if (typeof clip.url !== "string") {
			const nextSegmentIndex = currentSegmentIndex[clipIndex] + 1;
			if (nextSegmentIndex < clip.url.length) {
				// Advance all videos to next segment to keep them in sync
				setCurrentSegmentIndex((prev) =>
					prev.map(() => nextSegmentIndex)
				);
				// Restart all videos from the new segment
				videoRefs.current.forEach((video) => {
					if (video) {
						video.load();
						video.play().catch(() => {
							// Autoplay might be blocked
						});
					}
				});
			}
		}
	};

	// Determine end time: use explicit endTime, or next event's startTime, or null
	const displayEndTime = event.endTime || nextEvent?.startTime || null;

	// Parse time string to minutes (handles both "HH:MM:SS" and "HH:MM a.m./p.m." formats)
	const parseTimeToMinutes = (timeStr: string): number => {
		if (!timeStr) return 0;

		// Handle "HH:MM a.m./p.m." format
		const amPmMatch = timeStr.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
		if (amPmMatch) {
			let hours = parseInt(amPmMatch[1]);
			const minutes = parseInt(amPmMatch[2]);
			const isPM = amPmMatch[3].toLowerCase().includes("p");

			if (isPM && hours !== 12) hours += 12;
			if (!isPM && hours === 12) hours = 0;

			return hours * 60 + minutes;
		}

		// Handle "HH:MM:SS" or "H:MM:SS" format
		const parts = timeStr.split(":").map((p) => parseInt(p.trim()));
		if (parts.length >= 2) {
			const hours = parts[0];
			const minutes = parts[1];
			return hours * 60 + minutes;
		}

		return 0;
	};

	// Format time to 12-hour format with a.m./p.m.
	const formatTimeTo12Hour = (timeStr: string): string => {
		if (!timeStr) return "";

		// If already in 12-hour format, return as-is
		if (timeStr.match(/a\.m\.|p\.m\.|am|pm/i)) {
			return timeStr;
		}

		// Parse 24-hour format
		const parts = timeStr.split(":").map((p) => parseInt(p.trim()));
		if (parts.length >= 2) {
			let hours = parts[0];
			const minutes = parts[1];

			const isPM = hours >= 12;
			if (hours === 0) hours = 12;
			else if (hours > 12) hours -= 12;

			const period = isPM ? "p.m." : "a.m.";
			return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
		}

		return timeStr;
	};

	// Calculate position and width percentages for the timeline bar
	const calculateTimelinePositions = () => {
		if (!displayEndTime || !overallStartTime || !overallEndTime) {
			return { startPercent: 0, widthPercent: 0 };
		}

		const overallStart = parseTimeToMinutes(overallStartTime);
		const overallEnd = parseTimeToMinutes(overallEndTime);
		const eventStart = parseTimeToMinutes(event.startTime);
		const eventEnd = parseTimeToMinutes(displayEndTime);

		// Handle times that cross midnight
		let totalDuration = overallEnd - overallStart;
		if (totalDuration < 0) totalDuration += 24 * 60;

		let eventStartOffset = eventStart - overallStart;
		if (eventStartOffset < 0) eventStartOffset += 24 * 60;

		let eventDuration = eventEnd - eventStart;
		if (eventDuration < 0) eventDuration += 24 * 60;

		const startPercent = (eventStartOffset / totalDuration) * 100;
		const widthPercent = (eventDuration / totalDuration) * 100;

		return { startPercent, widthPercent };
	};

	const { startPercent, widthPercent } = calculateTimelinePositions();

	return (
		<section
			ref={containerRef}
			className="min-h-screen flex flex-col items-center justify-center py-12 md:py-20 px-8 md:px-16 lg:px-24"
			id={event.id}
		>
			<div className="w-full" style={{ maxWidth: maxWidth || "1200px" }}>
				{/* Title and Timestamp - NYT Style */}
				<div className="text-center mb-6 md:mb-8">
					{/* Time range above title */}
					{displayEndTime && (
						<div className="text-xl md:text-2xl font-sans text-[#e8927c] mb-2 font-normal">
							{formatTimeTo12Hour(event.startTime)} -{" "}
							{formatTimeTo12Hour(displayEndTime)}
						</div>
					)}
					{!displayEndTime && (
						<div className="text-2xl md:text-3xl font-sans text-[#e8927c] mb-3 font-normal">
							{formatTimeTo12Hour(event.startTime)}
						</div>
					)}

					<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight font-serif mb-6">
						{event.title}
					</h2>

					{/* Timeline Bar - NYT Style with progress */}
					{displayEndTime && overallStartTime && overallEndTime && (
						<div className="max-w-2xl mx-auto mt-8">
							<div className="relative">
								{/* Timeline container */}
								<div className="h-1 bg-gray-200 rounded-full relative">
									{/* Colored progress bar - positioned based on actual times */}
									<div
										className="absolute top-0 h-full bg-[#e8927c] rounded-full"
										style={{
											left: `${startPercent}%`,
											width: `${widthPercent}%`,
										}}
									></div>

									{/* Start circle - filled, positioned at event start */}
									<div
										className="absolute -top-1.5 w-4 h-4 bg-[#e8927c] rounded-full border-2 border-white shadow-sm"
										style={{
											left: `calc(${startPercent}% - 0.5rem)`,
										}}
									></div>

									{/* End circle - hollow, positioned at event end */}
									<div
										className="absolute -top-1.5 w-4 h-4 bg-white rounded-full border-2 border-[#e8927c] shadow-sm"
										style={{
											left: `calc(${
												startPercent + widthPercent
											}% - 0.5rem)`,
										}}
									></div>
								</div>

								{/* Time labels - showing overall timeline range */}
								<div className="flex justify-between mt-3 text-sm text-gray-500 font-sans">
									<span>
										{formatTimeTo12Hour(overallStartTime)}
									</span>
									<span>
										{formatTimeTo12Hour(overallEndTime)}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Video Grid - NYT style with side-by-side layout */}
				<div
					className={`grid grid-cols-1 ${getGridCols()} gap-4 md:gap-6 mb-6 md:mb-8 ${
						event.clips.length === 1 ||
						event.clips.length === 5 ||
						event.clips.length === 3
							? "md:justify-items-center"
							: ""
					}`}
				>
					{(() => {
						// Reorder clips for 3 or 5 video layouts if oddVideoFirst is true
						let clips = event.clips;
						if (
							event.clips.length === 3 &&
							event.videoOptions?.oddVideoFirst
						) {
							clips = [
								event.clips[2],
								event.clips[0],
								event.clips[1],
							];
						} else if (
							event.clips.length === 5 &&
							event.videoOptions?.oddVideoFirst
						) {
							clips = [
								event.clips[4],
								event.clips[0],
								event.clips[1],
								event.clips[2],
								event.clips[3],
							];
						}

						return clips.map((clip, displayIndex) => {
							// Find original index for ref purposes
							const originalIndex = event.clips.indexOf(clip);

							// Determine if this is the "special" odd video (3rd or 5th)
							const isOddVideo =
								(event.clips.length === 3 &&
									(event.videoOptions?.oddVideoFirst
										? displayIndex === 0
										: displayIndex === 2)) ||
								(event.clips.length === 5 &&
									(event.videoOptions?.oddVideoFirst
										? displayIndex === 0
										: displayIndex === 4));

							const videoMaxWidth =
								isOddVideo &&
								event.videoOptions?.oddVideoSameSize
									? "600px" // Same size as other videos in multi-video layout
									: getMaxWidth();

							return (
								<div
									key={originalIndex}
									className={`relative bg-black overflow-hidden shadow-lg mx-auto w-full cursor-pointer hover:opacity-90 transition-opacity ${
										isOddVideo &&
										!event.videoOptions?.oddVideoSameSize
											? "md:col-span-2"
											: isOddVideo &&
											  event.videoOptions
													?.oddVideoSameSize
											? "md:col-span-2 md:justify-self-center"
											: ""
									}`}
									style={{
										aspectRatio: clip.cropBlackBars
											? "2.28"
											: "16/9",
										maxWidth: videoMaxWidth,
									}}
									onClick={() =>
										handleVideoClick(originalIndex)
									}
								>
									<video
										ref={(el) => {
											videoRefs.current[originalIndex] =
												el;
										}}
										src={getCurrentVideoUrl(
											clip,
											currentSegmentIndex[originalIndex]
										)}
										className="w-full h-full object-cover"
										loop={typeof clip.url === "string"}
										muted={true}
										playsInline={true}
										preload="metadata"
										aria-label={clip.title || event.title}
										disablePictureInPicture={true}
										onEnded={() =>
											handleVideoEnded(originalIndex)
										}
									>
										Your browser does not support the video
										tag.
									</video>

									{/* Loading placeholder */}
									{!shouldLoad && (
										<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
											<div className="text-gray-400 text-sm">
												Loading...
											</div>
										</div>
									)}

									{/* Video loading indicator */}
									{shouldLoad &&
										videoLoading[originalIndex] && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
												<div className="flex flex-col items-center gap-2">
													<div className="w-8 h-8 border-3 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
													<div className="text-gray-300 text-sm">
														Loading...
													</div>
												</div>
											</div>
										)}

									{/* Video progress bar */}
									<div
										className="absolute bottom-0 left-0 right-0 h-2 bg-gray-600/50 cursor-pointer hover:h-3 transition-all z-10"
										onClick={(e) =>
											handleProgressBarClick(
												e,
												originalIndex
											)
										}
										title="Click to seek"
									>
										<div
											className="h-full bg-gray-400/50 transition-all duration-100 pointer-events-none"
											style={{
												width: `${
													videoProgress[
														originalIndex
													] || 0
												}%`,
											}}
										/>
									</div>

									{/* Optional clip title overlay */}
									{clip.title && (
										<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 pb-4 pointer-events-none">
											<p className="text-white text-xs md:text-sm font-medium">
												{clip.title}
											</p>
										</div>
									)}
								</div>
							);
						});
					})()}
				</div>

				{/* Description - NYT style typography */}
				<div className="max-w-2xl mx-auto">
					<p className="text-base md:text-lg leading-relaxed text-gray-700 font-serif">
						{event.description}
					</p>
				</div>

				{/* Sub-events (text, photos, maps) */}
				{event.subEvents && event.subEvents.length > 0 && (
					<SubEvents
						subEvents={event.subEvents}
						maxWidth={maxWidth}
					/>
				)}
			</div>

			{/* Expanded Video Modal */}
			{expandedVideoIndex !== null && (
				<div
					className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
					onClick={closeExpandedVideo}
				>
					<div
						className="relative w-[70%]"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Close button */}
						<button
							onClick={closeExpandedVideo}
							className="absolute -top-12 right-0 text-white hover:text-gray-300 text-sm font-medium"
						>
							Close (ESC)
						</button>

						{/* Expanded video */}
						<div
							className="relative bg-black overflow-hidden shadow-2xl"
							style={{
								aspectRatio: event.clips[expandedVideoIndex]
									.cropBlackBars
									? "2.28"
									: "16/9",
							}}
						>
							<video
								ref={expandedVideoRef}
								src={getCurrentVideoUrl(
									event.clips[expandedVideoIndex],
									currentSegmentIndex[expandedVideoIndex]
								)}
								className="w-full h-full object-cover"
								controls={
									typeof event.clips[expandedVideoIndex]
										.url === "string"
								}
								autoPlay={true}
								loop={
									typeof event.clips[expandedVideoIndex]
										.url === "string"
								}
								muted={true}
								playsInline={true}
								onEnded={() =>
									handleVideoEnded(expandedVideoIndex)
								}
								onPause={handleExpandedVideoPause}
								onPlay={handleExpandedVideoPlay}
							>
								Your browser does not support the video tag.
							</video>

							{/* Custom controls for multi-segment videos */}
							{typeof event.clips[expandedVideoIndex].url !==
								"string" && (
								<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-4">
									{/* Progress bar */}
									<div
										className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
										onClick={(e) =>
											handleProgressBarClick(
												e,
												expandedVideoIndex
											)
										}
									>
										<div
											className="h-full bg-white rounded-full transition-all duration-100"
											style={{
												width: `${
													expandedVideoProgress || 0
												}%`,
											}}
										/>
									</div>

									{/* Time display */}
									<div className="flex justify-between text-white text-sm">
										<span>
											{formatTime(expandedCurrentTime)}
										</span>
										<span>
											{formatTime(expandedTotalDuration)}
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Video title if available */}
						{event.clips[expandedVideoIndex].title && (
							<div className="mt-4 text-white text-center">
								<p className="text-lg font-medium">
									{event.clips[expandedVideoIndex].title}
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
