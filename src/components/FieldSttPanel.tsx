import { Mic, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface FieldSttPanelProps {
  voiceLog: string;
  isRecording: boolean;
  onBack: () => void;
  onRecord: () => void;
  onComplete: () => void;
}

export function FieldSttPanel({
  voiceLog,
  isRecording,
  onBack,
  onRecord,
  onComplete
}: FieldSttPanelProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-sub text-sm font-bold"
      >
        <ArrowLeft size={18} />
        방제·시공 메뉴로 돌아가기
      </button>

      <div>
        <h3 className="font-bold text-xl text-text-main mb-1">
          작업 일지 STT 녹음
        </h3>
        <p className="text-text-sub text-sm">
          현장 상황을 음성으로 기록합니다.
        </p>
      </div>

      <div className="bento-card">
        <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
          <Mic size={20} className="text-ios-blue" />
          음성 현장 로그 (STT)
        </h3>

        <div className="bg-system-bg rounded-2xl p-4 min-h-[90px] mb-4 text-text-main text-sm border border-[rgba(0,0,0,0.04)]">
          {voiceLog || '녹음 버튼을 눌러 현장 상황을 기록하세요.'}
        </div>

        <button
          onClick={onRecord}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
            isRecording ? 'bg-red-50 text-red-600' : 'bg-ios-blue text-white'
          }`}
        >
          {isRecording ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 bg-red-600 rounded-full"
              />
              녹음 중...
            </>
          ) : (
            <>
              <Mic size={20} />
              음성 기록 시작
            </>
          )}
        </button>
      </div>

      <button
        onClick={onComplete}
        className="w-full bg-primary text-white font-bold py-4 rounded-xl"
      >
        조치완료
      </button>
    </div>
  );
}