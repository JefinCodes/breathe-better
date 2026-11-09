import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  MapPin,
  Sparkles,
  ChevronDown,
  Wind,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, clearChatSession } from '../../api/chatbot';

const STARTER_PROMPTS = [
  "How's the AQI today?",
  "How's the AQI at Mumbai?",
  "Can I go today for cycling?",
  "What will be the AQI tomorrow?",
  "Compare AQI of Delhi and Chennai?",
  "What is PM10?",
  "Issues caused by ground-level ozone?",
  "AQI is Very Poor, what precautions to take?",
];

/**
 * Generates an ephemeral session ID for this browser tab/page load.
 * Resets whenever the page is refreshed.
 */
function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'conv-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(createSessionId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCity, setLastCity] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Request browser geolocation if user clicks locate button
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationNotice('Detecting coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          city: 'My Location',
        };
        setUserLocation(coords);
        setIsLocating(false);
        setLocationNotice(`Location set (${coords.latitude}, ${coords.longitude})`);
        setTimeout(() => setLocationNotice(''), 4000);
      },
      (_err) => {
        setIsLocating(false);
        setLocationNotice('Location access denied. Please type your city name.');
        setTimeout(() => setLocationNotice(''), 4000);
      },
      { timeout: 8000 }
    );
  };

  // Start new conversation / clear session
  const handleResetSession = async () => {
    try {
      await clearChatSession(conversationId);
    } catch {
      // Ignore background reset errors
    }
    const newId = createSessionId();
    setConversationId(newId);
    setMessages([]);
    setLastCity(null);
    setInput('');
  };

  // Submit message
  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMsgId = 'msg-' + Date.now();
    const newUserMsg = {
      id: userMsgId,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        conversationId,
        message: messageText,
        userLocation: userLocation || undefined,
      });

      if (response && response.reply) {
        const botMsg = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
          toolsUsed: response.toolsUsed,
          source: response.source,
        };
        setMessages((prev) => [...prev, botMsg]);

        if (response.lastCity) {
          setLastCity(response.lastCity);
        }
      }
    } catch (err) {
      const errorMsg = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          err.response?.data?.error?.message ||
          'Sorry, I could not connect to the air quality service. Please check your backend connection.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside aria-label="Breathe Better AI Assistant" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Expanded Chatbot Modal / Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Air Quality Chat Interface"
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[410px] h-[560px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight truncate">
                    Breathe Better Assistant
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-100 truncate">
                  {lastCity ? (
                    <span className="inline-flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate">
                      <MapPin className="w-2.5 h-2.5" />
                      Discussing: {lastCity}
                    </span>
                  ) : (
                    <span>Real-time Google AQI & CPCB Standards</span>
                  )}
                </div>
              </div>
            </div>

            {/* Header action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleResetSession}
                title="New Chat / Clear Memory"
                aria-label="Start new chat session"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                aria-label="Minimize chat window"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context / Geolocation Banner */}
          {(userLocation || locationNotice) && (
            <div className="bg-emerald-50/90 border-b border-emerald-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-800">
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="truncate">
                  {locationNotice || `Current GPS: ${userLocation?.latitude}, ${userLocation?.longitude}`}
                </span>
              </div>
              {userLocation && (
                <button
                  type="button"
                  onClick={() => setUserLocation(null)}
                  className="text-[10px] text-emerald-600 hover:text-emerald-900 font-semibold ml-2 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-gray-50/50 text-xs sm:text-sm">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-2 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">
                    How can I help you breathe easier?
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[280px]">
                    Ask about live city air quality, cycling & outdoor safety, tomorrow's forecast, or CPCB guidelines.
                  </p>
                </div>

                {/* Quick starter chips */}
                <div className="w-full pt-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center max-h-48 overflow-y-auto pr-1">
                    {STARTER_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left text-xs bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                            : msg.isError
                            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-xs'
                            : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 text-xs sm:text-sm text-gray-800">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}

                        {/* Timestamp & Tool badges */}
                        <div
                          className={`mt-1 text-[10px] flex items-center justify-between gap-2 ${
                            isUser ? 'text-emerald-100' : 'text-gray-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                            <span className="font-mono text-[9px] text-gray-400">
                              Grounded in API
                            </span>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-xs shadow-xs mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2 justify-start items-center">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-2xs flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      <span className="text-xs text-gray-500 font-medium">
                        Fetching air quality insights...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick chip bar when conversation is active */}
          {messages.length > 0 && !isLoading && (
            <div className="px-3 py-1.5 bg-gray-100/70 border-t border-gray-200/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
              <span className="text-gray-400 font-bold whitespace-nowrap text-[10px]">
                Suggest:
              </span>
              <button
                type="button"
                onClick={() => handleSendMessage('Can I go today for cycling?')}
                className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 whitespace-nowrap text-[11px]"
              >
                🚴 Safe for cycling?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('What will be the aqi index tomorrow?')}
                className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 whitespace-nowrap text-[11px]"
              >
                📅 Tomorrow's forecast
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('What do you understand from aqi values seen in the last 1 month?')}
                className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 whitespace-nowrap text-[11px]"
              >
                📈 Last 1 month trend
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating || isLoading}
                title="Use my current GPS coordinates"
                aria-label="Use current GPS coordinates"
                className={`p-2 rounded-xl border transition-colors flex-shrink-0 ${
                  userLocation
                    ? 'bg-blue-50 border-blue-300 text-blue-600'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300'
                }`}
              >
                <MapPin className={`w-4 h-4 ${isLocating ? 'animate-bounce' : ''}`} />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  lastCity
                    ? `Ask about ${lastCity} or any other question...`
                    : "Ask about AQI, cycling, pollutants, or cities..."
                }
                disabled={isLoading}
                className="flex-1 text-xs sm:text-sm bg-gray-50 hover:bg-gray-50/80 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none transition-all placeholder:text-gray-400"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-[10px] text-gray-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <span>Answers limited to 1–4 sentences based on facts & CPCB standards.</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
        aria-label={isOpen ? 'Close Breathe Better Assistant' : 'Open Breathe Better Assistant'}
        aria-expanded={isOpen}
      >
        <span className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <MessageCircle className="w-5 h-5 text-white animate-wiggle" />
          )}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          )}
        </span>
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          {isOpen ? 'Close' : 'Ask AQI AI'}
        </span>
      </button>
    </aside>
  );
}
