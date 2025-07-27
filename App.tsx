
import React, { useState, useEffect } from 'react';
import Chatbot from './components/Chatbot';
import GlitterBackground from './components/GlitterBackground';

const themes = {
  dark: {
    body: '#121212',
    text: 'text-gray-200',
  },
  light: {
    body: '#f9fafb', // gray-50
    text: 'text-gray-900',
  }
};

export type Theme = 'light' | 'dark';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
    }
    // Default to dark theme if no preference is found or on the server
    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', theme);
    }
    document.body.style.backgroundColor = themes[theme].body;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`min-h-screen ${themes[theme].text} flex flex-col items-center justify-center sm:p-4 font-sans relative transition-colors duration-300`}>
      <GlitterBackground theme={theme} />
      <div className="w-full h-full sm:h-[90vh] max-w-2xl flex flex-col">
         <Chatbot theme={theme} toggleTheme={toggleTheme} />
      </div>
    </div>
  );
}

export default App;
