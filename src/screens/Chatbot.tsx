import { useState, useRef, useEffect } from 'react';
import { ScreenName } from '../types';
import { ChevronLeft, Send, Bot, User } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatbotProps {
  navigate: (screen: ScreenName) => void;
}

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
};

type ChatRagResponse = {
  success: boolean;
  answer?: string;
  error?: string;
  sources?: {
    document_title: string | null;
    section_title: string | null;
    page_number: number | null;
    similarity: number | null;
  }[];
};

export function Chatbot({ navigate }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: '안녕하세요! 산림 보호 및 소나무 재선충병 관련 궁금한 점을 물어보세요.',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const userInput = input.trim();

    if (!userInput || isLoading) {
      return;
    }

    /*
     * 질문을 보내기 전까지의 대화 기록입니다.
     * 프론트의 bot 역할을 Edge Function에서 사용하는
     * assistant 역할로 변환합니다.
     */
    const history = messages.map((message) => ({
      role:
        message.role === 'bot'
          ? ('assistant' as const)
          : ('user' as const),
      content: message.text,
    }));

    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        text: userInput,
      },
    ]);

    setInput('');
    setIsLoading(true);

    try {
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL;

      const supabaseKey =
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Supabase 환경변수가 설정되지 않았습니다.',
        );
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/chat-rag`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json; charset=utf-8',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            message: userInput,
            history,
          }),
        },
      );

      const result =
        (await response.json()) as ChatRagResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            `챗봇 호출 실패: HTTP ${response.status}`,
        );
      }

      if (!result.answer) {
        throw new Error(
          '챗봇의 답변 내용이 비어 있습니다.',
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'bot',
          text: result.answer!,
        },
      ]);

      console.log(
        'RAG 검색 출처:',
        result.sources,
      );
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((previous) => [
        ...previous,
        {
          role: 'bot',
          text:
            error instanceof Error
              ? `답변을 불러오지 못했습니다. ${error.message}`
              : '답변을 불러오는 중 오류가 발생했습니다.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-system-bg flex flex-col">
      <div className="bg-card-bg p-4 pt-4 flex items-center border-b border-[rgba(0,0,0,0.04)] shadow-sm z-10 shrink-0">
        <button
          onClick={() => navigate('home')}
          className="p-2 -ml-2 text-text-sub"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2 mr-8">
          <div className="w-8 h-8 bg-system-bg rounded-full flex items-center justify-center text-primary">
            <Bot size={18} />
          </div>

          <span className="font-semibold text-text-main">
            AI 산림 컨설턴트
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={`${message.role}-${index}`}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`flex gap-3 ${
              message.role === 'user'
                ? 'flex-row-reverse'
                : 'flex-row'
            }`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-white">
              {message.role === 'user' ? (
                <User size={16} />
              ) : (
                <Bot size={16} />
              )}
            </div>

            <div
              className={`p-3 rounded-[15px] max-w-[75%] text-[13px] whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-[#f0f0f0] text-text-main'
              }`}
            >
              {message.text}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex gap-3 flex-row"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-white">
              <Bot size={16} />
            </div>

            <div className="p-3 rounded-[15px] max-w-[75%] text-[13px] bg-[#f0f0f0] text-text-main">
              문서를 검색하고 답변을 작성하고 있습니다...
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      <div className="bg-card-bg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[rgba(0,0,0,0.04)] shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.nativeEvent.isComposing
              ) {
                void handleSend();
              }
            }}
            disabled={isLoading}
            placeholder={
              isLoading
                ? '답변 작성 중...'
                : '메시지 입력...'
            }
            className="flex-1 bg-system-bg rounded-[10px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-[12px] disabled:opacity-60"
          />

          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send
              size={18}
              className="-ml-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
}