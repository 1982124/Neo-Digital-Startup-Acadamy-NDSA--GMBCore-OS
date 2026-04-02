import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, onSnapshot, orderBy, limit } from '../firebase';
import { Bot, Send, Mic, User, Loader2, MessageSquare, Sparkles, Volume2, VolumeX, Share2, Layout as LayoutIcon, Clock, Zap, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse, getSpeechResponse, getChatStream } from '../lib/gemini';
import { cn } from '../lib/utils';

export default function CoachJose() {
  const [searchParams] = useSearchParams();
  const [distributor, setDistributor] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId] = useState(() => {
    const saved = localStorage.getItem('jose_visitor_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem('jose_visitor_id', newId);
    return newId;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const QUICK_PROMPTS = [
    { label: "SANTÉ", text: "Comment booster mon immunité ?", icon: <Sparkles className="w-4 h-4" /> },
    { label: "POIDS", text: "Perdre du poids sainement", icon: <Sparkles className="w-4 h-4" /> },
    { label: "ÉNERGIE", text: "Plus d'énergie au quotidien", icon: <Sparkles className="w-4 h-4" /> },
    { label: "BUSINESS", text: "Devenir distributeur NeoLife", icon: <Sparkles className="w-4 h-4" /> }
  ];

  const ref = searchParams.get('ref');

  useEffect(() => {
    const fetchDistributor = async () => {
      if (!ref) return;
      try {
        const q = query(collection(db, 'distributors'), where('smartCode', '==', ref));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setDistributor(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching distributor:", error);
      }
    };
    fetchDistributor();

    // Initial greeting
    const initialMessage = {
      role: 'model',
      text: "Bonjour 👋 Je suis Coach José, conseiller NeoLife. Je vais vous aider à optimiser votre vitalité. Comment vous sentez-vous aujourd'hui ?",
      timestamp: new Date().toISOString(),
      id: 'initial'
    };
    setMessages([initialMessage]);
  }, [ref]);

  // Auto-save conversation to Firestore
  const saveConversation = async (updatedMessages: any[]) => {
    if (updatedMessages.length <= 1) return; // Don't save if it's just the greeting

    try {
      const data = {
        distributorId: distributor?.uid || 'founder',
        visitorId,
        messages: updatedMessages,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        smartCode: ref || 'direct'
      };

      if (conversationId) {
        await updateDoc(doc(db, 'conversations', conversationId), data);
      } else {
        const docRef = await addDoc(collection(db, 'conversations'), {
          ...data,
          createdAt: serverTimestamp()
        });
        setConversationId(docRef.id);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // Silent feedback is better than alert
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || loading) return;

    setShowPrompts(false);
    const userMessage = {
      role: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textOverride) setInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      const context = distributor 
        ? `Distributeur: ${distributor.name}, WhatsApp: ${distributor.whatsapp}, Boutique: ${distributor.shopUrl}`
        : "Orphelin (Fondateur: https://shopneolife.com/startupforworld, WhatsApp: https://wa.me/2290195388292)";

      // Use streaming for faster response perception
      let fullResponse = "";
      const stream = getChatStream(messageText, context);
      
      const modelMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        role: 'model',
        text: "",
        timestamp: new Date().toISOString(),
        id: modelMessageId
      }]);

      for await (const chunk of stream) {
        if (chunk) {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: fullResponse } : msg
          ));
          setIsTyping(false); // Stop bounce as soon as we get first chunk
        }
      }

      // If no response was received, throw an error
      if (!fullResponse) {
        throw new Error("Empty response from Gemini");
      }

      const finalMessages = [...messages, userMessage, { 
        role: 'model', 
        text: fullResponse, 
        timestamp: new Date().toISOString(),
        id: modelMessageId
      }];

      // Save lead if it's the first interaction
      if (messages.length <= 1) {
        await addDoc(collection(db, 'leads'), {
          distributorId: distributor?.uid || 'founder',
          name: 'Anonyme',
          needs: messageText,
          status: 'NEW',
          createdAt: serverTimestamp(),
          visitorId
        });
      }

      // Log conversation
      await saveConversation(finalMessages);

      // If it's a long conversation, generate a summary for the distributor
      if (finalMessages.length % 6 === 0) {
        const summaryPrompt = `Résume cette conversation entre un prospect et Coach José en une phrase courte pour le distributeur NeoLife. 
        Messages: ${JSON.stringify(finalMessages.slice(-6))}`;
        const summary = await getChatResponse(summaryPrompt, "Générateur de résumé");
        if (conversationId) {
          await updateDoc(doc(db, 'conversations', conversationId), {
            summary,
            updatedAt: serverTimestamp()
          });
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Désolé, j'ai rencontré une petite erreur technique. Pouvez-vous reformuler ?",
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  const handleClearHistory = () => {
    if (window.confirm("Voulez-vous effacer l'historique de cette conversation ?")) {
      setMessages([{
        role: 'model',
        text: "Bonjour 👋 Je suis Coach José, conseiller NeoLife. Je vais vous aider à optimiser votre vitalité. Comment vous sentez-vous aujourd'hui ?",
        timestamp: new Date().toISOString(),
        id: 'initial'
      }]);
      setConversationId(null);
      setShowPrompts(true);
    }
  };

  const handleVoice = async (text: string, messageId: string) => {
    if (isPlaying === messageId) {
      audioRef.current?.pause();
      setIsPlaying(null);
      return;
    }

    try {
      setIsPlaying(messageId);
      const audioData = await getSpeechResponse(text);
      const blob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => setIsPlaying(null);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-slate-200 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-primary/20 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-secondary/20 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 mix-blend-overlay" />
        
        {/* Scanner Line (Visible when loading) */}
        {loading && (
          <motion.div 
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent z-10 shadow-[0_0_20px_rgba(0,242,255,0.8)]"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto h-screen flex flex-col relative z-10 p-4 md:p-6">
        {/* Header - Premium Glassmorphism */}
        <header className="flex items-center justify-between p-5 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl group-hover:bg-primary/50 transition-all animate-pulse" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg shadow-primary/20 relative z-10">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://picsum.photos/seed/jose/200/200" 
                    alt="Coach José" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                Coach José <span className="text-xs font-normal text-primary/80 ml-2 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">IA EXPERT</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                {isTyping ? (
                  <span className="flex items-center gap-1 text-primary animate-pulse">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    José analyse votre demande...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    Prêt à vous propulser
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleClearHistory}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all group"
              title="Effacer l'historique"
            >
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all group"
              title="Tableau de bord"
            >
              <LayoutIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group shadow-lg shadow-primary/5"
              title="Partager"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {/* Chat Area - Immersive & Readable */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide space-y-6 px-2">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex w-full",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] md:max-w-[75%] p-5 rounded-3xl shadow-xl relative group",
                  msg.role === 'user' 
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-white rounded-tr-none" 
                    : "bg-slate-900/60 backdrop-blur-md border border-slate-800/80 text-slate-200 rounded-tl-none"
                )}>
                  {msg.role === 'model' && (
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none leading-relaxed font-medium">
                    {msg.text || (msg.role === 'model' && idx === messages.length - 1 && loading ? (
                      <div className="flex gap-1.5 py-2">
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : msg.text)}
                  </div>
                  <div className={cn(
                    "text-[10px] mt-3 opacity-40 font-mono flex items-center gap-1",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    <Clock className="w-3 h-3" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Loading / Charging State */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 flex flex-col items-center gap-3"
          >
            <div className="w-full max-w-md h-1.5 bg-slate-800/50 rounded-full overflow-hidden relative border border-slate-700/30">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute inset-0 bg-primary/20"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black animate-pulse">
                Chargement de l'intelligence José...
              </span>
            </div>
          </motion.div>
        )}

        {/* Quick Prompts - Interactive & Visual */}
        {showPrompts && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSend(prompt.text)}
                className="p-4 text-left bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    {prompt.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">
                    {prompt.label}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2 leading-snug">
                  {prompt.text}
                </p>
              </motion.button>
            ))}
          </div>
        )}

        {/* Input Area - High Tech & Functional */}
        <div className="relative group">
          {/* Input Area Lighting Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity" />
          
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-[28px] blur opacity-0 group-focus-within:opacity-100 transition duration-500 animate-glow-pulse" />
          <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-slate-800/50 rounded-[24px] p-2 flex items-center gap-2 shadow-2xl">
            <button 
              onClick={toggleListening}
              className={cn(
                "p-3.5 rounded-2xl transition-all relative overflow-hidden group/mic",
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              {isListening && (
                <div className="absolute inset-0 bg-white/20 animate-ping" />
              )}
              <Mic className="w-5 h-5 relative z-10" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question à Coach José..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-600 text-lg py-4 px-4 font-bold tracking-tight"
              disabled={loading}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className={cn(
                "p-3.5 rounded-2xl transition-all flex items-center justify-center min-w-[52px] relative overflow-hidden group/send",
                input.trim() && !loading
                  ? "bg-primary text-slate-900 shadow-[0_0_25px_rgba(0,242,255,0.5)] hover:scale-105 active:scale-95"
                  : "bg-slate-800 text-slate-600"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
              )}
            </button>
          </div>
        </div>
        
        <p className="text-[10px] text-center mt-4 text-slate-600 font-medium uppercase tracking-[0.2em]">
          Propulsé par <span className="text-primary/60">NeoLife AI Intelligence</span>
        </p>
      </div>
    </div>
  );
}
