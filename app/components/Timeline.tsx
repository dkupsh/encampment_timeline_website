"use client";

import { useEffect, useState } from "react";
import { TimelineData } from "@/types/timeline";
import TimelineEvent from "./TimelineEvent";

export default function Timeline() {
	const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchTimeline() {
			try {
				const response = await fetch("/api/timeline");
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || "Failed to fetch timeline"
					);
				}
				const data = await response.json();
				setTimelineData(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Unknown error occurred"
				);
			} finally {
				setLoading(false);
			}
		}

		fetchTimeline();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading timeline...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen px-4">
				<div className="max-w-md text-center bg-red-50 border border-red-200 rounded-lg p-6">
					<h2 className="text-xl font-bold text-red-800 mb-2">
						Error Loading Timeline
					</h2>
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (
		!timelineData ||
		!timelineData.events ||
		timelineData.events.length === 0
	) {
		return (
			<div className="flex items-center justify-center min-h-screen px-4">
				<div className="text-center">
					<p className="text-gray-600">
						No events found in the timeline.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Timeline */}
			<div className="max-w-6xl mx-auto px-4 py-20">
				{timelineData.events.map((event, index) => (
					<TimelineEvent
						key={event.id}
						event={event}
						index={index}
						nextEvent={timelineData.events[index + 1]}
						previousEvent={index > 0 ? timelineData.events[index - 1] : undefined}
					/>
				))}

				{/* End marker */}
				<div className="flex justify-center">
					<div className="w-6 h-6 rounded-full bg-linear-to-br from-purple-600 to-blue-600 border-4 border-white shadow-lg" />
				</div>
			</div>
		</div>
	);
}
