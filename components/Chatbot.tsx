
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { INITIAL_GREETING, SUGGESTED_QUESTIONS } from '../constants';
import { startChatSession } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SendIcon } from './Icons';
import Message from './Message';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSession.current = startChatSession();
    const botMessageId = `bot-initial-${Date.now()}`;
    
    // Set an initial empty message from the bot to show the container
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
    }, 25); // Typing speed in milliseconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

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

    const botMessageId = `bot-${Date.now()}`;
    // Add a placeholder for the bot's response
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
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };
  
  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col h-full w-full overflow-hidden border border-slate-700/50">
      <header className="flex items-center p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="w-12 h-12 flex items-center justify-center mr-4 text-4xl">
          <span role="img" aria-label="Recycle Emoji">♻️</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-emerald-400">BebaPay Assistant</h1>
          <p className="text-sm text-slate-400">Your Web3 Recycling Companion</p>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto" id="chat-window">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length-1]?.sender === 'user' && (
           <div className="flex items-start gap-3 my-2 flex-row">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-2xl">
              <span role="img" aria-label="Recycle Emoji">♻️</span>
            </div>
            <div className="bg-slate-700 text-slate-100 self-start rounded-xl px-4 py-3">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-200"></span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-400"></span>
              </div>
            </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

       {showSuggestions && (
          <div className="px-4 pb-2 pt-1 border-t border-slate-700/50">
             <p className="text-xs text-slate-400 mb-2 font-semibold">Try asking:</p>
            <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                        key={q}
                        onClick={() => handleSuggestionClick(q)}
                        className="bg-slate-700 text-slate-200 text-sm px-3 py-1 rounded-full hover:bg-emerald-600 transition-colors duration-200"
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
            placeholder="Ask me anything about BebaPay..."
            className="w-full bg-transparent p-3 text-slate-200 placeholder-slate-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;