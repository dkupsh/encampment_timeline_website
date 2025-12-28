'use client';

import { SubEvent } from '@/types/investigation';
import TextSubEvent from './subevents/TextSubEvent';
import PhotoSubEvent from './subevents/PhotoSubEvent';
import TweetSubEvent from './subevents/TweetSubEvent';
import TextMessagesSubEvent from './subevents/TextMessagesSubEvent';
import MapSubEvent from './subevents/MapSubEvent';
import CollageSubEvent from './subevents/CollageSubEvent';

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
            return <TextSubEvent key={index} subEvent={subEvent} />;

          case 'photo':
            return <PhotoSubEvent key={index} subEvent={subEvent} />;

          case 'tweet':
            return <TweetSubEvent key={index} subEvent={subEvent} />;

          case 'textMessages':
            return <TextMessagesSubEvent key={index} subEvent={subEvent} />;

          case 'map':
            return <MapSubEvent key={index} subEvent={subEvent} />;

          case 'collage':
            return <CollageSubEvent key={index} subEvent={subEvent} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
