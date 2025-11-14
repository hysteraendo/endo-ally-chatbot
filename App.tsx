import React, { useState, useEffect } from 'react';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Check for the 'embed=true' query parameter in the URL
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('embed') === 'true') {
      setIsEmbedded(true);
    }
  }, []);

  // Render only the chatbot for a clean embed
  if (isEmbedded) {
    return (
      <div className="w-full h-screen bg-brand-light font-sans text-brand-dark flex items-center justify-center p-1 sm:p-2">
         <Chatbot />
      </div>
    );
  }

  // Render the full standalone page with header and footer
  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <img src="https://assets-global.website-files.com/64639744b742a259c0780447/655e2691b157a41467439396_Endo%20Violence%20Collective_Primary%20Logo_Yellow.png" alt="Endo Violence Collective Logo" className="w-auto h-12"/>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-brand-dark">Endo Ally</h1>
          </div>
          <a href="https://www.endoviolence.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-pink hover:underline font-semibold text-right">
            Endo Violence<br className="hidden sm:block"/> Collective
          </a>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <Chatbot />
        </div>
      </main>

      <footer className="w-full text-center py-6 mt-8 text-xs text-gray-500 border-t border-gray-200">
        <p>This AI chatbot is for informational purposes and does not provide medical advice.</p>
        <div className="mt-3">
            <p className="font-semibold text-gray-600">Connect with the Endo Violence Collective</p>
            <div className="flex justify-center items-center space-x-4 mt-2">
                <a href="https://www.endoviolence.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-pink hover:underline">
                    Website
                </a>
                <span className="text-gray-300">|</span>
                <a href="https://www.instagram.com/endoviolence.collective/" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-pink hover:underline">
                    Instagram
                </a>
            </div>
        </div>
        <p className="mt-3">Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;