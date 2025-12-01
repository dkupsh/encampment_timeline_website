export interface TimelineEvent {
  id: string;
  datetime: string;
  approx?: string;
  title: string;
  description: string;
  category?: string;
  actors?: string;
  source?: string;
  sourceText?: string;
  media?: string;
  mediaText?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  title: string;
  description?: string;
}
