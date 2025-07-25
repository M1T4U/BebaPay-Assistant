
import React from 'react';
import Chatbot from './components/Chatbot';
import GlitterBackground from './components/GlitterBackground';

function App() {
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 font-sans relative">
      <GlitterBackground />
      <div className="w-full max-w-2xl h-[90vh] flex flex-col">
         <Chatbot />
      </div>
    </div>
  );
}

export default App;