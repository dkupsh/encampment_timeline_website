export interface VideoClip {
  url: string | string[]; // Single video or array of videos to play in sequence
  title?: string;
  thumbnail?: string;
  cropBlackBars?: boolean; // Set true for videos with letterbox black bars
}

export interface VideoOptions {
  oddVideoFirst?: boolean; // For 3 or 5 video layouts: show odd video (3rd/5th) on top
  oddVideoSameSize?: boolean; // For 3 or 5 video layouts: odd video same size as others
}

// Sub-event types that appear below videos in a timeline event
export interface TextSubEvent {
  type: 'text';
  content: string; // Text content to display
}

export interface PhotoSubEvent {
  type: 'photo';
  imagePath: string; // Path to image in public folder
  imageAlt?: string; // Alt text for accessibility
  caption?: string; // Optional caption for the photo
  attribution?: string; // Optional photo credit/attribution (e.g., "Photo by Jane Doe")
}

export interface TweetSubEvent {
  type: 'tweet';
  author: string; // Display name
  handle: string; // Twitter handle (e.g., "@username")
  content: string; // Tweet text content
  timestamp: string; // Tweet timestamp (e.g., "3:24 PM · Apr 25, 2024")
  profileImage?: string; // URL to profile image
  verified?: boolean; // Blue check badge
  likes?: number; // Number of likes
  retweets?: number; // Number of retweets
  link?: string; // Link to original tweet
}

export interface TextMessage {
  sender: string; // Sender name
  content: string; // Message text
  timestamp: string; // Message time (e.g., "3:24 PM")
  isSender?: boolean; // If true, appears on right (sent), if false on left (received)
}

export interface TextMessagesSubEvent {
  type: 'textMessages';
  messages: TextMessage[]; // Array of text messages
  caption?: string; // Optional caption for the conversation
  conversationTitle?: string; // Optional title (e.g., "Group Chat")
}

export interface MapMarker {
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  label?: string; // Optional text label next to marker
  appearAt: number; // Scroll progress when it appears (0-1)
  disappearAt?: number; // Scroll progress when it disappears (0-1), defaults to 1
  size?: number; // Size in pixels, default 24
  color?: string; // Tailwind color (e.g., 'yellow', 'red', 'blue'), default 'yellow'
  shape?: 'square' | 'arrow' | 'semicircle' | 'triangle'; // Marker shape, default 'square'
  direction?: number; // Direction in degrees for arrow/triangle/semicircle (0=right, 90=down, 180=left, 270=up)
  radius?: number; // Radius in pixels for semicircle CCTV vision cone
  fieldOfView?: number; // Arc angle in degrees for semicircle (default 90)
}

export interface MapLabel {
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  text: string; // Label text content
  appearAt: number; // Scroll progress when it appears (0-1)
  disappearAt?: number; // Scroll progress when it disappears (0-1), defaults to 1
}

export interface MapSubEvent {
  type: 'map';
  imagePath: string; // Path to map image in public folder
  imageAlt?: string; // Alt text for accessibility
  caption?: string; // Optional caption for the map
  markers?: MapMarker[]; // Optional markers/annotations to display on the map
  labels?: MapLabel[]; // Optional text labels positioned on the map
  duration?: number; // Container height in viewport units (vh), default 150
}

export interface CollagePhoto {
  imagePath: string; // Path to image in public folder
  imageAlt?: string; // Alt text for accessibility
  caption?: string; // Optional caption for individual photo
  attribution?: string; // Optional photo credit/attribution (e.g., "Photo by Jane Doe")
  appearAt?: number; // Scroll progress when it appears (0-1), auto-calculated if not provided
  disappearAt?: number; // Scroll progress when it disappears (0-1), defaults to 1
  size?: 'small' | 'medium' | 'large'; // Photo size (auto-assigned if not specified)
  x?: number; // Percentage from left (0-100), auto-positioned if not specified
  y?: number; // Percentage from top (0-100), auto-positioned if not specified
}

export interface CollageSubEvent {
  type: 'collage';
  photos: CollagePhoto[]; // Array of photos to display in collage
  caption?: string; // Optional overall caption for the collage
  duration?: number; // Container height in viewport units (vh), default 200
  columns?: number; // [DEPRECATED] Use full-page mosaic layout instead
}

export type SubEvent = TextSubEvent | PhotoSubEvent | TweetSubEvent | TextMessagesSubEvent | MapSubEvent | CollageSubEvent;

export interface TimelineEvent {
  id: string;
  startTime: string; // Format: "H:MM:SS" or "HH:MM:SS"
  endTime?: string; // Optional end time for timeline bar
  title: string;
  description: string;
  clips: VideoClip[]; // 1-5 clips per event (typically 5-view)
  videoOptions?: VideoOptions; // Layout options for video display
  subEvents?: SubEvent[]; // Optional sub-events displayed below videos
}

// Backwards compatibility
export type InvestigationEvent = TimelineEvent;

export interface InvestigationData {
  title: string;
  description?: string;
  maxWidth?: string; // Max width for content (e.g., '1200px', '80rem')
  startTime: string; // Global timeline start time (e.g., '10:00:00' or '10:00 p.m.')
  endTime: string; // Global timeline end time
  events: TimelineEvent[];
}
