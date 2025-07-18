import React from 'react';
import type { ChatMessage } from '../types';

interface MessageProps {
  message: ChatMessage;
}

// Simple markdown parser for **bold** text.
const renderText = (text: string) => {
    // Splits the string by the bold markdown, capturing the content in between.
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
        // Every second part (odd index) is the one that was inside the asterisks.
        if (i % 2 === 1) {
            return (
                <strong 
                    key={i} 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold"
                >
                    {part}
                </strong>
            );
        }
        return part;
    });
};

const Message: React.FC<MessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  const botStyles = 'bg-slate-700 text-slate-100 self-start';
  const userStyles = 'bg-emerald-600 text-white self-end';

  return (
    <div className={`flex items-start gap-3 my-2 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-2xl">
          <span role="img" aria-label="Recycle Emoji">♻️</span>
        </div>
      )}
      <div
        className={`max-w-md md:max-w-lg rounded-xl px-4 py-3 whitespace-pre-wrap animate-fade-in-up ${
          isBot ? botStyles : userStyles
        }`}
      >
        <p>{renderText(message.text)}</p>
      </div>
    </div>
  );
};

export default Message;
