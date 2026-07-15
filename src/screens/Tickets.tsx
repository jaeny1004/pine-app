import { ScreenName } from '../types';
import { useSupabase } from '../hooks/useSupabase';
import { TicketCard } from '../components/TicketCard';

export function Tickets({ navigate }: { navigate: (s: ScreenName) => void }) {
  const { records } = useSupabase();

  return (
    <div className="h-full bg-system-bg flex flex-col">
      <div className="bg-card-bg p-4 pt-12 flex items-center border-b border-[rgba(0,0,0,0.04)] shadow-sm sticky top-0 z-10 shrink-0">
        <h1 className="text-xl font-bold text-text-main flex-1 text-center">전체 민원</h1>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto flex-1 pb-6">
        {records.length === 0 ? (
           <div className="text-center text-text-sub mt-10">등록된 민원이 없습니다.</div>
        ) : (
          records.map(r => <TicketCard key={r.id} record={r} />)
        )}
      </div>
    </div>
  );
}
