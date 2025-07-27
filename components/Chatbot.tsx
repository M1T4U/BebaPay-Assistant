

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { INITIAL_GREETING, SUGGESTED_QUESTIONS } from '../constants';
import { startChatSession, generateImageFromPrompt } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SendIcon, SunIcon, MoonIcon, RestartIcon } from './Icons';
import Message from './Message';
import type { Theme } from '../App';

interface ChatbotProps {
    theme: Theme;
    toggleTheme: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ theme, toggleTheme }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const playInitialGreeting = useCallback(() => {
    const botMessageId = `bot-initial-${Date.now()}`;
    setMessages([{ id: botMessageId, text: '', sender: 'bot', isLoading: true }]);

    let index = 0;
    const intervalId = setInterval(() => {
      if (index < INITIAL_GREETING.length) {
        const newText = INITIAL_GREETING.substring(0, index + 1);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: newText } : msg
          )
        );
        index++;
      } else {
        clearInterval(intervalId);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, isLoading: false } : msg
          )
        );
      }
    }, 25); 

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    chatSession.current = startChatSession();
    const cleanup = playInitialGreeting();
    return cleanup;
  }, [playInitialGreeting]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setShowSuggestions(false);
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const imageKeywords = ['image', 'picture', 'generate', 'draw', 'show me', 'visualize', 'photo', 'gif', 'video'];
    const isImageRequest = imageKeywords.some(keyword => text.toLowerCase().includes(keyword));
    const botMessageId = `bot-${Date.now()}`;
    let botMessagePlaceholder: ChatMessage = { id: botMessageId, text: '', sender: 'bot', isLoading: true };

    if (isImageRequest) {
        const isGifOrVideo = text.toLowerCase().includes('gif') || text.toLowerCase().includes('video');
        const placeholderText = isGifOrVideo
            ? "I can't create videos or GIFs, but I can make a still image for you! Working on it... 🎨"
            : "Got it! Generating an image for you... 🎨";

        botMessagePlaceholder.text = placeholderText;
        setMessages((prev) => [...prev, botMessagePlaceholder]);

        try {
            const imageUrl = await generateImageFromPrompt(text);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, text: "Here is the image you requested:", imageUrl, isLoading: false } : msg
                )
            );
        } catch (error) {
            console.error('Image generation error:', error);
            const errorMessage = "Sorry, I couldn't create an image for that. It might be against the safety policy. Please try another idea. 🛠️";
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, text: errorMessage, imageUrl: undefined, isLoading: false } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    } else {
        setMessages((prev) => [...prev, botMessagePlaceholder]);
        
        try {
          if (chatSession.current) {
            const stream = await chatSession.current.sendMessageStream({ message: text });
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
                  )
                );
            }
          }
        } catch (error) {
          console.error('Error sending message:', error);
          const errorMessage = 'Sorry, I encountered an error. Please try again. 🛠️';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId ? { ...msg, text: errorMessage } : msg
            )
          );
        } finally {
          setIsLoading(false);
           setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId ? { ...msg, isLoading: false } : msg
            )
          );
        }
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };
  
  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleClearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the chat and start a new conversation?')) {
        chatSession.current = startChatSession();
        setMessages([]);
        setShowSuggestions(true);
        // Use a timeout to ensure the state update has been processed before starting the animation
        setTimeout(() => {
            playInitialGreeting();
        }, 0);
    }
  }, [playInitialGreeting]);

  // Dynamic Styles based on Theme
  const chatbotContainerStyles = theme === 'dark'
    ? 'bg-black/60 border-gray-800/50'
    : 'bg-white/60 border-gray-200/50';
  const headerStyles = theme === 'dark'
    ? 'border-gray-800 bg-black/50'
    : 'border-gray-200 bg-white/50';
  const headerTextStyles = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subheaderTextStyles = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const iconButtonStyles = theme === 'dark'
    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200';
  const suggestionButtonStyles = theme === 'dark'
    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:bg-gray-900'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100';
  const formStyles = theme === 'dark'
    ? 'border-gray-800'
    : 'border-gray-200';
  const inputContainerStyles = theme === 'dark'
    ? 'bg-gray-900'
    : 'bg-gray-100';
  const inputTextStyles = theme === 'dark'
    ? 'text-gray-200 placeholder-gray-500'
    : 'text-gray-900 placeholder-gray-400';
  const sendButtonStyles = theme === 'dark'
    ? 'bg-gray-200 text-black hover:bg-white disabled:bg-gray-700 disabled:text-gray-400'
    : 'bg-gray-800 text-white hover:bg-black disabled:bg-gray-300 disabled:text-gray-500';

  return (
    <div className={`backdrop-blur-lg sm:rounded-2xl shadow-2xl flex flex-col h-full w-full overflow-hidden sm:border transition-colors duration-300 ${chatbotContainerStyles}`}>
      <header className={`flex items-center justify-between p-4 landscape:py-2 border-b transition-colors duration-300 ${headerStyles}`}>
        <div className="flex items-center">
            <div className="w-12 h-12 landscape:w-10 landscape:h-10 flex items-center justify-center mr-4 landscape:mr-2 text-4xl landscape:text-3xl">
              <span role="img" aria-label="Recycle Emoji">♻️</span>
            </div>
            <div>
              <h1 className={`text-xl landscape:text-lg font-bold ${headerTextStyles}`}>BebaPay Assistant</h1>
              <p className={`text-sm ${subheaderTextStyles} landscape:hidden`}>Your Web3 Recycling Companion</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={handleClearChat}
                className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${iconButtonStyles}`}
                aria-label="Start new chat"
                title="Start new chat"
            >
                <RestartIcon className="w-5 h-5" />
            </button>
            <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${iconButtonStyles}`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto" id="chat-window" aria-live="polite" aria-atomic="false">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} theme={theme} />
        ))}
        <div ref={messagesEndRef} />
      </div>

       {showSuggestions && (
          <div className={`px-4 pb-2 pt-1 border-t transition-colors duration-300 ${formStyles}`}>
             <p className={`text-xs ${subheaderTextStyles} mb-2 font-semibold`} id="suggestions-label">Try asking:</p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="suggestions-label">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                        key={q}
                        onClick={() => handleSuggestionClick(q)}
                        disabled={isLoading}
                        className={`text-sm px-3 py-1 rounded-full transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed animate-fade-in-up ${suggestionButtonStyles}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        {q}
                    </button>
                ))}
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className={`p-4 border-t transition-colors duration-300 ${formStyles}`}>
        <div className={`flex items-center rounded-lg overflow-hidden transition-all duration-300 ring-green-500/50 focus-within:ring-4 ${inputContainerStyles}`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about BebaPay..."
            className={`w-full bg-transparent p-3 focus:outline-none ${inputTextStyles}`}
            disabled={isLoading}
            aria-label="Your message"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`p-3 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 ${sendButtonStyles}`}
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;