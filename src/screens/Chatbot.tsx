import { useState, useRef, useEffect } from 'react';
import { ScreenName } from '../types';
import { ChevronLeft, Send, Bot, User } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatbotProps {
  navigate: (screen: ScreenName) => void;
}

export function Chatbot({ navigate }: ChatbotProps) {
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: '안녕하세요! 산림 보호 및 소나무 재선충병 관련 궁금한 점을 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: '재선충병 의심 증상이 보이면, 즉시 [시민 의심목 신고] 메뉴를 통해 사진과 위치를 제보해주시기 바랍니다. 방제 인력이 출동하여 정밀 진단을 진행합니다.' 
      }]);
    }, 1000);
  };

  return (
    <div className="h-full bg-system-bg flex flex-col">
      <div className="bg-card-bg p-4 pt-12 flex items-center border-b border-[rgba(0,0,0,0.04)] shadow-sm z-10 shrink-0">
        <button onClick={() => navigate('home')} className="p-2 -ml-2 text-text-sub">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 mr-8">
          <div className="w-8 h-8 bg-system-bg rounded-full flex items-center justify-center text-primary">
            <Bot size={18} />
          </div>
          <span className="font-semibold text-text-main">AI 산림 컨설턴트</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-primary text-white' : 'bg-primary text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-[15px] max-w-[75%] text-[13px] ${
              msg.role === 'user' ? 'bg-primary text-white' : 'bg-[#f0f0f0] text-text-main'
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="bg-card-bg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[rgba(0,0,0,0.04)] shrink-0">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="메시지 입력..."
            className="flex-1 bg-system-bg rounded-[10px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-[12px]"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send size={18} className="-ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
