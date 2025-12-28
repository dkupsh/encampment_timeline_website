import { PhotoSubEvent as PhotoSubEventType } from '@/types/investigation';
import Image from 'next/image';

interface PhotoSubEventProps {
  subEvent: PhotoSubEventType;
}

export default function PhotoSubEvent({ subEvent }: PhotoSubEventProps) {
  return (
    <div className="max-w-4xl mx-auto">
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
      {subEvent.attribution && (
        <p className="text-xs text-gray-500 text-center mt-1 font-sans">
          {subEvent.attribution}
        </p>
      )}
    </div>
  );
}
