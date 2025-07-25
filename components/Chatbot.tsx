import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { INITIAL_GREETING, SUGGESTED_QUESTIONS } from '../constants';
import { startChatSession, generateImageFromPrompt } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SendIcon, TrashIcon } from './Icons';
import Message from './Message';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const playInitialGreeting = useCallback(() => {
    const botMessageId = `bot-initial-${Date.now()}`;
    setMessages([{ id: botMessageId, text: '', sender: 'bot' }]);

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
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setShowSuggestions(false);
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const imageKeywords = ['image', 'picture', 'generate', 'draw', 'show me', 'visualize', 'photo', 'gif', 'video'];
    const isImageRequest = imageKeywords.some((keyword) => text.toLowerCase().includes(keyword));
    const botMessageId = `bot-${Date.now()}`;

    if (isImageRequest) {
      const isGifOrVideo = text.toLowerCase().includes('gif') || text.toLowerCase().includes('video');
      const placeholderText = isGifOrVideo
        ? "I can't create videos or GIFs, but I can make a still image for you! Working on it... 🎨"
        : "Got it! Generating an image for you... 🎨";

      setMessages((prev) => [...prev, { id: botMessageId, text: placeholderText, sender: 'bot' }]);

      try {
        const imageUrl = await generateImageFromPrompt(text);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: "Here is the image you requested:", imageUrl } : msg
          )
        );
      } catch (error) {
        console.error('Image generation error:', error);
        const errorMessage = "Sorry, I couldn't create an image for that. It might be against the safety policy. Please try another idea. 🛠️";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: errorMessage, imageUrl: undefined } : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      setMessages((prev) => [...prev, { id: botMessageId, text: '', sender: 'bot' }]);

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
      }
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleClearChat = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the chat history? This will start a new session.")) {
      chatSession.current = startChatSession();
      setMessages([]);
      setShowSuggestions(true);
      setIsLoading(false);
      setInputValue('');
      playInitialGreeting();
    }
  }, [playInitialGreeting]);

  return (
    <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col h-full w-full overflow-hidden border border-slate-700/50">
      <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center">
          <div className="w-12 h-12 flex items-center justify-center mr-4 text-4xl">
            <span role="img" aria-label="Recycle Emoji">♻️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-emerald-400">BebaPay Assistant</h1>
            <p className="text-sm text-slate-400">Your Web3 Recycling Companion</p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear chat history"
          title="Clear chat history"
          disabled={isLoading}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto" id="chat-window" aria-live="polite" aria-atomic="false">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.sender === 'user' && (
          <div className="flex items-start gap-3 my-2 flex-row" aria-label="BebaBot is typing">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-2xl">
              <span role="img" aria-label="Recycle Emoji">♻️</span>
            </div>
            <div className="bg-slate-700 text-slate-100 self-start rounded-xl px-4 py-3">
              <div className="flex items-center space-x-1" role="status">
                <span className="sr-only">BebaBot is typing...</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <div className="px-4 pb-2 pt-1 border-t border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2 font-semibold" id="suggestions-label">Try asking:</p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="suggestions-label">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestionClick(q)}
                disabled={isLoading}
                className="bg-slate-700 text-slate-200 text-sm px-3 py-1 rounded-full hover:bg-emerald-600 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-900 rounded-lg overflow-hidden">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about BebaPay or ask me to generate an image..."
            className="w-full bg-transparent p-3 text-slate-200 placeholder-slate-500 focus:outline-none"
            disabled={isLoading}
            aria-label="Your message"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
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
