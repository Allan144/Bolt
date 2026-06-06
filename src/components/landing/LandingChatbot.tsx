import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ChatAnswer } from '../../types';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const FALLBACK_ANSWERS: ChatAnswer[] = [
  {
    id: '1', question: 'What are your lesson rates?',
    answer: 'Lesson rates vary: 30-min lessons start at $35, 45-min at $50, and 60-min at $65. Contact us for a personalized quote.',
    keywords: ['rate', 'price', 'cost', 'fee', 'how much'], is_active: true, display_order: 1,
    created_at: '', updated_at: ''
  },
  {
    id: '2', question: 'What ages do you teach?',
    answer: 'I teach students of all ages — from beginners as young as 5 to adult learners. Every student gets a tailored curriculum.',
    keywords: ['age', 'children', 'adult', 'beginner', 'young'], is_active: true, display_order: 2,
    created_at: '', updated_at: ''
  },
  {
    id: '3', question: 'How do I schedule a lesson?',
    answer: 'You can schedule a free trial lesson by contacting me through this website. Once enrolled, we set up a consistent weekly slot.',
    keywords: ['schedule', 'book', 'enroll', 'sign up', 'trial'], is_active: true, display_order: 3,
    created_at: '', updated_at: ''
  },
  {
    id: '4', question: 'Where are lessons held?',
    answer: 'Lessons are held at my home studio with two quality pianos. Virtual lessons via Zoom are also available.',
    keywords: ['where', 'location', 'studio', 'virtual', 'online', 'zoom'], is_active: true, display_order: 4,
    created_at: '', updated_at: ''
  },
];

const findAnswer = (query: string, answers: ChatAnswer[]): string | null => {
  const q = query.toLowerCase();
  let best: { answer: string; score: number } | null = null;
  for (const a of answers) {
    if (!a.is_active) continue;
    const score = a.keywords.reduce((acc, kw) => acc + (q.includes(kw.toLowerCase()) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { answer: a.answer, score };
    }
  }
  if (!best) {
    // Fuzzy fallback: check against question text
    for (const a of answers) {
      if (!a.is_active) continue;
      const words = q.split(' ').filter(w => w.length > 3);
      const score = words.reduce((acc, w) => acc + (a.question.toLowerCase().includes(w) ? 1 : 0), 0);
      if (score > 0 && (!best || score > best.score)) {
        best = { answer: a.answer, score };
      }
    }
  }
  return best?.answer ?? null;
};

const LandingChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: "Hello! I'm here to answer your questions about piano lessons. What would you like to know?", isUser: false, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<ChatAnswer[]>(FALLBACK_ANSWERS);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('chat_answers').select('*').eq('is_active', true).order('display_order')
      .then(({ data }) => { if (data && data.length > 0) setAnswers(data as ChatAnswer[]); });
  }, []);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const answer = findAnswer(text, answers);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: answer ?? "I'm not sure about that! Please contact me directly for more information.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        {open ? <ChevronDown className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat window */}
      <div className={`fixed bottom-24 right-6 z-50 w-80 bg-stone-900 border border-amber-900/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ maxHeight: 480 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-900/80 border-b border-amber-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-serif">♪</div>
            <div>
              <p className="text-white text-sm font-medium font-serif">Ask a Question</p>
              <p className="text-amber-300 text-xs">LCE Lessons</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 320 }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.isUser
                ? 'bg-amber-700 text-white rounded-br-none'
                : 'bg-stone-800 text-amber-100 border border-stone-700 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-800 border border-stone-700 px-4 py-2 rounded-xl rounded-bl-none">
                <span className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-stone-800 flex gap-2">
          <input
            className="flex-1 bg-stone-800 border border-stone-700 text-white placeholder-stone-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-600"
            placeholder="Type your question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-9 h-9 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </>
  );
};

export default LandingChatbot;
