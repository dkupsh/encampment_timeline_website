/**
 * Timeline Configuration
 * Adjust these values to control the timeline spacing and appearance
 */

export const timelineConfig = {
  spacing: {
    // Minimum spacing between events (in pixels)
    minSpacing: 64,

    // Maximum spacing between events (in pixels)
    maxSpacing: 400,

    // Base spacing before time-based calculation (in pixels)
    baseSpacing: 64,

    // Pixels per hour of time difference
    // Higher value = more vertical space per hour
    pixelsPerHour: 16,

    // Pixels per day (alternative calculation)
    // Uncomment and modify calculateSpacing to use this instead
    // pixelsPerDay: 384,
  },

  // Visual settings
  visual: {
    // Timeline line width (in pixels)
    lineWidth: 0.5,

    // Node/dot size (in pixels)
    nodeSize: 16,

    // Node border width (in pixels)
    nodeBorderWidth: 4,
  },
};

/**
 * Calculate spacing between two events
 * @param currentTime - Timestamp of current event
 * @param nextTime - Timestamp of next event
 * @returns Spacing in pixels
 */
export function calculateEventSpacing(currentTime: number, nextTime: number): number {
  const diffInMs = nextTime - currentTime;

  // Convert to hours
  const diffInHours = diffInMs / (1000 * 60 * 60);

  // Calculate spacing: base + (hours * pixels per hour)
  const spacing = timelineConfig.spacing.baseSpacing +
                  (diffInHours * timelineConfig.spacing.pixelsPerHour);

  // Clamp between min and max
  return Math.max(
    timelineConfig.spacing.minSpacing,
    Math.min(timelineConfig.spacing.maxSpacing, spacing)
  );
}
