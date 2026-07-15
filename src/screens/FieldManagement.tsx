import { SampleQrPanel } from '../components/SampleQrPanel';
import { useState } from 'react';
import { PineRecord, ScreenName } from '../types';
import {
  Mic,
  QrCode,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { BottomSheet } from '../components/BottomSheet';
import { useSupabase } from '../hooks/useSupabase';
import { motion } from 'motion/react';
import { FieldSttPanel } from '../components/FieldSttPanel';
import { ChemicalQrPanel } from '../components/ChemicalQrPanel';

interface FieldManagementProps {
  navigate: (screen: ScreenName) => void;
}

type FieldPanelMode = 'menu' | 'stt' | 'chemical' | 'sample';

export function FieldManagement({ navigate: _navigate }: FieldManagementProps) {
  const [activeTab, setActiveTab] = useState<'surveillance' | 'control'>('surveillance');
  const { records, updateStatus } = useSupabase();
  const [selectedRecord, setSelectedRecord] = useState<PineRecord | null>(null);

  const [controlPanelMode, setControlPanelMode] = useState<FieldPanelMode>('menu');

  // Mock STT
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLog, setVoiceLog] = useState('');

  const closeBottomSheet = () => {
    setSelectedRecord(null);
    setControlPanelMode('menu');
  };

  const openRecordSheet = (record: PineRecord) => {
    setSelectedRecord(record);
    setControlPanelMode('menu');
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);

      setTimeout(() => {
        setVoiceLog(prev =>
          prev +
          (prev ? ' ' : '') +
          '현장 확인 결과, 잣나무 잎마름병으로 추정되며 추가 방제가 필요합니다.'
        );
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleComplete = () => {
    if (!selectedRecord) return;

    updateStatus(selectedRecord.id, 'completed');
    closeBottomSheet();
  };

  const handleLocationCheck = () => {
    closeBottomSheet();
  };

  const handleSampleQrRegister = () => {
    console.log('시료 QR 등록 완료');
  };

  const handleChemicalQrScan = () => {
    console.log('약제 QR 인식 완료');
  };
  return (
    <div className="h-full bg-system-bg flex flex-col overflow-hidden">
      {/* Header Tabs */}
      <div className="bg-card-bg pt-12 pb-4 px-4 shadow-sm z-10 border-b border-[rgba(0,0,0,0.04)] shrink-0">
        <h1 className="text-xl font-bold text-text-main mb-4">현장 업무 관리</h1>

        <div className="flex bg-system-bg p-1 rounded-xl">
          {[
            { id: 'surveillance', label: '예찰·조사' },
            { id: 'control', label: '방제·시공' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as 'surveillance' | 'control');
                closeBottomSheet();
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors relative ${activeTab === tab.id ? 'text-text-main' : 'text-text-sub'
                }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-card-bg shadow-sm rounded-lg"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content: 지도만 표시 */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'surveillance' && (
          <div className="absolute inset-0 p-4 pb-4">
            <div className="w-full h-full">
              <LeafletMap
                records={records}
                onMarkerClick={openRecordSheet}
              />
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="absolute inset-0 p-4 pb-4">
            <div className="w-full h-full">
              <LeafletMap
                records={records.filter(record => record.status !== 'completed')}
                onMarkerClick={openRecordSheet}
              />
            </div>
          </div>
        )}
      </div>

      <BottomSheet isOpen={!!selectedRecord} onClose={closeBottomSheet}>
        {/* 예찰·조사 모드 BottomSheet */}
        {selectedRecord && activeTab === 'surveillance' && controlPanelMode === 'menu' && (

          <div className="space-y-4">
            {selectedRecord.image_url && (
              <img
                src={selectedRecord.image_url}
                className="w-full h-44 object-cover rounded-2xl bg-system-bg"
                alt="의심목 신고 이미지"
              />
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-xl text-text-main">의심목 신고건</h3>
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 text-xs font-bold">
                  대기
                </span>
              </div>
              <p className="text-text-sub text-sm">
                신고자 연락망 {selectedRecord.phone_number || '정보 없음'}
              </p>
            </div>

            <div className="bg-system-bg rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-text-sub">GPS 정밀좌표</span>
                <span className="font-bold text-text-main text-right">
                  {selectedRecord.latitude && selectedRecord.longitude
                    ? `${selectedRecord.latitude}, ${selectedRecord.longitude}`
                    : '좌표 정보 없음'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-text-sub">AI 의심 확률</span>
                <span className="font-bold text-primary">
                  분석 대기
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleLocationCheck}
                className="bg-card-bg border border-[rgba(0,0,0,0.08)] text-text-main font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs"
              >
                <MapPin size={18} className="text-red-500" />
                의심목 위치 확인
              </button>

              <button
                onClick={() => setControlPanelMode('sample')}
                className="bg-card-bg border border-[rgba(0,0,0,0.08)] text-text-main font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs"
              >
                <QrCode size={18} className="text-accent" />
                시료 채취 QR 등록
              </button>

              <button
                onClick={handleComplete}
                className="bg-primary text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs"
              >
                <CheckCircle2 size={18} />
                조치완료
              </button>
            </div>
          </div>
        )}

        {/* 예찰·조사 모드: 시료 채취 QR 등록 화면 */}
        {selectedRecord && activeTab === 'surveillance' && controlPanelMode === 'sample' && (
          <SampleQrPanel
            onBack={() => setControlPanelMode('menu')}
            onScan={handleSampleQrRegister}
            onComplete={handleComplete}
          />
        )}

        {/* 방제·시공 모드: 기본 작은 메뉴 */}
        {selectedRecord && activeTab === 'control' && controlPanelMode === 'menu' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-xl text-text-main">방제·시공 대상지</h3>
                <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-500 text-xs font-bold">
                  방제 대기
                </span>
              </div>
              <p className="text-text-sub text-sm">
                신고자 연락망 {selectedRecord.phone_number || '정보 없음'}
              </p>
            </div>

            <div className="bg-system-bg rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-text-sub">GPS 정밀좌표</span>
                <span className="font-bold text-text-main text-right">
                  {selectedRecord.latitude && selectedRecord.longitude
                    ? `${selectedRecord.latitude}, ${selectedRecord.longitude}`
                    : '좌표 정보 없음'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-text-sub">작업 상태</span>
                <span className="font-bold text-primary">
                  방제 대기
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setControlPanelMode('stt')}
                className="bg-card-bg border border-[rgba(0,0,0,0.08)] text-text-main font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 text-xs"
              >
                <Mic size={18} className="text-ios-blue" />
                작업 일지 STT 녹음
              </button>

              <button
                onClick={() => setControlPanelMode('chemical')}
                className="bg-card-bg border border-[rgba(0,0,0,0.08)] text-text-main font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 text-xs"
              >
                <QrCode size={18} className="text-accent" />
                자재·약제 QR 인증
              </button>

              <button
                onClick={handleComplete}
                className="bg-primary text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 text-xs"
              >
                <CheckCircle2 size={18} />
                조치완료
              </button>
            </div>
          </div>
        )}

        {/* 방제·시공 모드: STT 화면 */}
        {selectedRecord && activeTab === 'control' && controlPanelMode === 'stt' && (
          <FieldSttPanel
            voiceLog={voiceLog}
            isRecording={isRecording}
            onBack={() => setControlPanelMode('menu')}
            onRecord={toggleRecording}
            onComplete={handleComplete}
          />
        )}

        {/* 방제·시공 모드: 약제 QR 화면 */}
        {selectedRecord && activeTab === 'control' && controlPanelMode === 'chemical' && (
          <ChemicalQrPanel
            onBack={() => setControlPanelMode('menu')}
            onScan={handleChemicalQrScan}
            onComplete={handleComplete}
          />
        )}
      </BottomSheet>
    </div>
  );
}