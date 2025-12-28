import { TextSubEvent as TextSubEventType } from '@/types/investigation';

interface TextSubEventProps {
  subEvent: TextSubEventType;
}

export default function TextSubEvent({ subEvent }: TextSubEventProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="prose prose-lg max-w-none">
        <p className="text-base md:text-lg leading-relaxed text-gray-700 font-serif whitespace-pre-wrap">
          {subEvent.content}
        </p>
      </div>
    </div>
  );
}
