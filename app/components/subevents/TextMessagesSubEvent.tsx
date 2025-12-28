import { TextMessagesSubEvent as TextMessagesSubEventType } from '@/types/investigation';

interface TextMessagesSubEventProps {
  subEvent: TextMessagesSubEventType;
}

export default function TextMessagesSubEvent({ subEvent }: TextMessagesSubEventProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Conversation Container */}
      <div className="bg-gray-50 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200">
        {/* Conversation Title */}
        {subEvent.conversationTitle && (
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700 text-sm">
              {subEvent.conversationTitle}
            </h3>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-3">
          {subEvent.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] md:max-w-[70%] ${
                  message.isSender ? 'items-end' : 'items-start'
                } flex flex-col gap-1`}
              >
                {/* Sender Name (for received messages) */}
                {!message.isSender && (
                  <span className="text-xs text-gray-500 font-medium px-3">
                    {message.sender}
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2 shadow-sm ${
                    message.isSender
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {/* Timestamp */}
                <span
                  className={`text-xs text-gray-500 px-3 ${
                    message.isSender ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        {subEvent.caption && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center italic">
              {subEvent.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
