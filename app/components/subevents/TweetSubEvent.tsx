import { TweetSubEvent as TweetSubEventType } from '@/types/investigation';
import Image from 'next/image';

interface TweetSubEventProps {
  subEvent: TweetSubEventType;
}

export default function TweetSubEvent({ subEvent }: TweetSubEventProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {subEvent.profileImage ? (
              <Image
                src={subEvent.profileImage}
                alt={`${subEvent.author} profile`}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 font-semibold text-lg">
                  {subEvent.author.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-gray-900 truncate">
                {subEvent.author}
              </span>
              {subEvent.verified && (
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.52 3.59c.88-1.22 2.88-1.22 3.76 0l1.45 2.01c.26.36.67.61 1.12.68l2.49.38c1.49.23 2.09 2.04.99 3.02l-1.81 1.63c-.32.29-.47.71-.4 1.13l.43 2.48c.26 1.48-1.3 2.61-2.61 1.89l-2.21-1.21c-.39-.21-.86-.21-1.25 0l-2.21 1.21c-1.31.72-2.87-.41-2.61-1.89l.43-2.48c.07-.42-.08-.84-.4-1.13L2.88 9.68c-1.1-.98-.5-2.79.99-3.02l2.49-.38c.45-.07.86-.32 1.12-.68l1.45-2.01z"/>
                </svg>
              )}
              <span className="text-gray-500 truncate">
                {subEvent.handle}
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              {subEvent.timestamp}
            </div>
          </div>
        </div>

        {/* Tweet Content */}
        <div className="mb-3">
          <p className="text-gray-900 text-base whitespace-pre-wrap leading-relaxed">
            {subEvent.content}
          </p>
        </div>

        {/* Engagement Stats */}
        {(subEvent.retweets !== undefined || subEvent.likes !== undefined) && (
          <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
            {subEvent.retweets !== undefined && (
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                </svg>
                <span className="text-sm font-medium">{subEvent.retweets.toLocaleString()}</span>
              </div>
            )}
            {subEvent.likes !== undefined && (
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                </svg>
                <span className="text-sm font-medium">{subEvent.likes.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Link to original tweet */}
        {subEvent.link && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <a
              href={subEvent.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium inline-flex items-center gap-1"
            >
              View original tweet
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
