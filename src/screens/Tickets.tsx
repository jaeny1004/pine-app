import { useMemo } from 'react';
import { ScreenName } from '../types';
import { useSupabase } from '../hooks/useSupabase';
import { TicketCard } from '../components/TicketCard';

interface TicketsProps {
  navigate: (screen: ScreenName) => void;
  isAuthenticated: boolean;
  onOpenRecord: (recordId: string) => void;
}

export function Tickets({
  navigate: _navigate,
  isAuthenticated,
  onOpenRecord,
}: TicketsProps) {
  const { records } = useSupabase();

  const visibleRecords = useMemo(() => {
    // 현장 담당자로 로그인한 경우 전체 민원 표시
    if (isAuthenticated) {
      return records;
    }

    // 비로그인 시민은 이 브라우저에서 신고한 토큰만 확인
    try {
      const storedTokens = localStorage.getItem('myReportTokens');

      const myReportTokens: string[] = storedTokens
        ? JSON.parse(storedTokens)
        : [];

      if (myReportTokens.length === 0) {
        return [];
      }

      return records.filter(record => {
        return (
          typeof record.report_token === 'string' &&
          myReportTokens.includes(record.report_token)
        );
      });
    } catch (error) {
      console.error('내 신고 토큰 조회 실패:', error);
      return [];
    }
  }, [records, isAuthenticated]);

  return (
    <div className="h-full bg-system-bg flex flex-col">
      <div className="bg-card-bg p-4 pt-4 flex items-center border-b border-[rgba(0,0,0,0.04)] shadow-sm sticky top-0 z-10 shrink-0">
        <h1 className="text-xl font-bold text-text-main flex-1 text-center">
          {isAuthenticated ? '전체 민원' : '내 신고 내역'}
        </h1>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1 pb-6">
        {visibleRecords.length === 0 ? (
          <div className="text-center text-text-sub mt-10">
            {isAuthenticated
              ? '등록된 민원이 없습니다.'
              : '이 기기에서 신고한 민원이 없습니다.'}
          </div>
        ) : (
          visibleRecords.map(record => (
            <button
              key={record.id}
              type="button"
              onClick={() => onOpenRecord(record.id)}
              className="block w-full text-left rounded-2xl active:scale-[0.99] transition-transform"
            >
              <TicketCard record={record} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}