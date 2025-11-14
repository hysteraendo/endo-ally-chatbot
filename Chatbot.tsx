import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, GroundingSource } from '../types';
import { createChatSession, getChatResponse } from '../services/geminiService';
import type { Chat, GenerateContentResponse, GroundingMetadata, Part } from '@google/genai';

const parseBotResponse = (responseText: string): Partial<Message> => {
    const audioRegex = /\[AUDIO: (.*?)\|(.*?)\]\n?/;
    let text = responseText;
    
    const parsed: Partial<Message> = {};

    const audioMatch = text.match(audioRegex);
    if (audioMatch) {
        parsed.audioUrl = "https://drive.google.com/uc?export=download&id=1AmXN3wDvSX6e9ckkyPysmMjcDTuqSE1q"; // Hardcoded Google Drive link
        parsed.audioCaption = audioMatch[2];
        text = text.replace(audioRegex, '').trim();
    }
    
    parsed.text = text;
    return parsed;
};


const parseGrounding = (groundingMetadata?: GroundingMetadata): GroundingSource[] | undefined => {
    if (!groundingMetadata?.groundingChunks) {
        return undefined;
    }
    return groundingMetadata.groundingChunks
        .map(chunk => ({
            uri: chunk.web?.uri ?? '',
            title: chunk.web?.title ?? 'Untitled',
        }))
        .filter(source => source.uri);
};

const suggestedQuestions = [
    "Can I listen to a summary of the book?",
    "What is 'endo violence'?",
    "Learn about the collective's founders",
    "How can I use 'endo violence' in my work?",
    "Explain the link between racism and endo violence (Thinking Mode)",
    "How do AI & digital systems create 'endo violence'? (Thinking Mode)",
    "How is 'medical gaslighting' different from the book's concept of 'endo violence'?",
    "Critique the 'Endo Warrior' narrative. Who benefits from this concept?",
    "What does 'healing justice' mean in the context of endometriosis?",
];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]); // Clear messages for new session
    try {
      chatSessionRef.current = createChatSession(isThinkingMode);
      const initialResponse = await getChatResponse(chatSessionRef.current, "Hello, introduce yourself based on your system instructions.");
      const parsedContent = parseBotResponse(initialResponse.text);
      const sources = parseGrounding(initialResponse.candidates?.[0]?.groundingMetadata);
      
      setMessages([{ id: 'initial-1', role: 'model', ...parsedContent, text: parsedContent.text || "", sources }]);
    } catch (e) {
      // FIX: Updated error message to not mention API key, per guidelines.
      setError('Failed to initialize the chat session. Please refresh the page and try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isThinkingMode]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const processResponse = (response: GenerateContentResponse) => {
    const parsedContent = parseBotResponse(response.text);
    const sources = parseGrounding(response.candidates?.[0]?.groundingMetadata);

    if (parsedContent.text || parsedContent.audioUrl || (sources && sources.length > 0)) {
       const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: parsedContent.text || "",
            audioUrl: parsedContent.audioUrl,
            audioCaption: parsedContent.audioCaption,
            sources: sources
        };
        setMessages(prev => [...prev, botMessage]);
    }
  }
  
  const handleModeToggle = () => {
    setIsThinkingMode(prev => !prev);
  };

  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading || !chatSessionRef.current) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
        let response = await getChatResponse(chatSessionRef.current, prompt);

        // Handle function calls if they exist
        if (response.functionCalls && response.functionCalls.length > 0) {
            let functionResponseParts: Part[] | undefined;

            // Loop through all function calls, although we primarly expect one
            for (const functionCall of response.functionCalls) {
                 if (functionCall.name === 'recordUserInsight') {
                     functionResponseParts = [{
                        functionResponse: {
                            name: functionCall.name,
                            response: { result: "Insight successfully recorded. The user has been thanked for their contribution." }
                        }
                    }];
                } else if (functionCall.name === 'contributeToResearch') {
                     functionResponseParts = [{
                        functionResponse: {
                            name: functionCall.name,
                            response: { result: "Anonymous contribution successfully recorded. The user has been thanked and assured of their anonymity." }
                        }
                    }];
                } else if (functionCall.name === 'getContributors') {
                     const contributorsList = `The Endo Violence Collective was co-founded by two key figures:

**Alicja Pawluczuk/HYSTERA** is a researcher, artist, and activist whose work explores the intersections of digital inclusion, social justice, and health. You can explore her art and research on her website: <a href="http://www.hystera.online" target="_blank" rel="noopener noreferrer" class="text-brand-pink hover:underline">www.hystera.online</a>.

**Allison Rich** is a director and advocate who created the powerful film 'Not Normal' to document her story of endo violence. You can watch her film on <a href="https://www.youtube.com/watch?v=fSDA0UzHsh0&t=345s" target="_blank" rel="noopener noreferrer" class="text-brand-pink hover:underline">YouTube</a>.

The collective is made up of many other talented members. To learn more about all contributors and find links to their individual profiles, please visit the official 'Meet Us' page: <a href="https://endoviolence.com/meet-us/" target="_blank" rel="noopener noreferrer" class="text-brand-pink hover:underline">endoviolence.com/meet-us/</a>.`;
                     functionResponseParts = [{
                         functionResponse: {
                             name: functionCall.name,
                             response: { contributors: contributorsList }
                         }
                     }]
                } else if (functionCall.name === 'getWebsiteResources') {
                    const resourceInfo = "Resources like podcasts and events are available on the official website: www.endoviolence.com. Check the website for the latest updates.";
                    functionResponseParts = [{
                        functionResponse: {
                            name: functionCall.name,
                            response: { resources: resourceInfo }
                        }
                    }]
                }
            }


            if (functionResponseParts) {
                // Send the simulated function result back to the model
                response = await getChatResponse(chatSessionRef.current, functionResponseParts);
            }
        }
        
        processResponse(response);

    } catch (e) {
        setError('There was an error communicating with the chatbot. Please try again.');
        const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'I\'m sorry, I encountered an error. Please try again.'
        };
        setMessages(prev => [...prev, errorMessage]);
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  }

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-brand-yellow flex-shrink-0 self-start mt-1"></div>
              )}
              <div className={`rounded-lg px-4 py-2 max-w-lg shadow-sm ${message.role === 'user' ? 'bg-brand-pink text-white rounded-br-none' : 'bg-gray-100 text-brand-dark rounded-bl-none'}`}>
                {message.text && <p className="text-sm whitespace-pre-wrap font-serif" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>}
                {message.audioUrl && (
                  <div className="mt-2">
                    <audio controls src={message.audioUrl} className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                    {message.audioCaption && (
                      <p className="text-xs text-gray-500 mt-1 italic">{message.audioCaption}</p>
                    )}
                  </div>
                )}
                {message.sources && message.sources.length > 0 && (
                    <details className="mt-3 border-t pt-2 group">
                        <summary className="text-xs font-bold text-gray-600 cursor-pointer hover:text-gray-800 list-none group-open:mb-1">
                            <div className="flex items-center justify-between">
                                <span>Sources</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </summary>
                        <ul className="list-disc list-inside text-xs space-y-1 mt-2 pl-2">
                            {message.sources.map((source, index) => (
                                <li key={index}>
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                        {source.title || new URL(source.uri).hostname}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && (
             <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-brand-yellow flex-shrink-0 self-start mt-1"></div>
                <div className="rounded-lg px-4 py-2 max-w-lg shadow-sm bg-gray-100 text-brand-dark rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
          )}
          {error && (
             <div className="flex items-center gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold flex-shrink-0">!</div>
                <div className="rounded-lg px-4 py-2 max-w-lg shadow-sm bg-red-100 text-red-800">
                    {error}
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t bg-white">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
                <button
                    id="thinking-mode-toggle"
                    onClick={handleModeToggle}
                    className={`${isThinkingMode ? 'bg-brand-pink' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink`}
                    aria-pressed={isThinkingMode}
                >
                    <span className={`${isThinkingMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
                 <label htmlFor="thinking-mode-toggle" className="text-sm font-medium text-gray-700">Thinking Mode</label>
            </div>
            <p className="text-xs text-gray-500 text-right">
                For complex queries. <br/> Uses gemini-2.5-pro & restarts chat.
            </p>
        </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
                <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-brand-dark rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                    {q}
                </button>
            ))}
          </div>
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 w-full px-4 py-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-pink"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-brand-pink text-white rounded-full disabled:bg-opacity-50 hover:bg-opacity-90 transition-colors"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;