import React, { useState, useRef } from 'react';
import { ScreenName } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Upload, MapPin, CheckCircle2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSupabase } from '../hooks/useSupabase';

interface ReportWizardProps {
  navigate: (screen: ScreenName) => void;
  onSuccess: () => void;
}

export function ReportWizard({ navigate, onSuccess }: ReportWizardProps) {
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [q1, setQ1] = useState(false);
  const [q2, setQ2] = useState(false);
  const [q3, setQ3] = useState(false);
  const [q4, setQ4] = useState(false);
  const [phone, setPhone] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { location, loading: geoLoading, error: geoError, getFromImage } = useGeolocation();
  const { addRecord, uploadImage } = useSupabase();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      await getFromImage(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !location) return;
    setSubmitting(true);
    
    const imageUrl = await uploadImage(imageFile);
    
    await addRecord({
      lat: location.lat,
      lng: location.lng,
      image_url: imageUrl || imagePreview || '',
      phone: phone || '010-0000-0000',
      status: 'pending',
      diagnosis_json: { q1, q2, q3, q4 }
    });
    
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-system-bg flex flex-col">
      <div className="bg-card-bg p-4 pt-12 flex items-center border-b border-[rgba(0,0,0,0.04)] sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('home')} className="p-2 -ml-2 text-text-sub active:bg-system-bg rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center font-semibold text-text-main mr-8">
          의심목 신고 (Step {step}/2)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-text-main mb-2">사진 촬영 및 업로드</h2>
                <p className="text-text-sub text-sm">피해를 입은 소나무의 전체 모습과 특징이 잘 보이게 찍어주세요.</p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 bg-card-bg border-2 border-dashed border-[rgba(0,0,0,0.1)] rounded-bento flex flex-col items-center justify-center overflow-hidden relative active:border-primary transition-colors shadow-bento"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-text-sub opacity-70">
                    <Upload size={32} className="mb-2" />
                    <span className="font-medium">탭하여 사진 선택</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
                <MapPin className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm mb-1">위치 정보 추출</h3>
                  {geoLoading ? (
                    <p className="text-blue-700 text-sm">사진에서 위치 정보를 추출하는 중...</p>
                  ) : location ? (
                    <p className="text-blue-700 text-sm font-mono">
                      Lat: {location.lat.toFixed(5)}<br/>Lng: {location.lng.toFixed(5)}
                    </p>
                  ) : geoError ? (
                    <p className="text-red-500 text-sm">{geoError}</p>
                  ) : (
                    <p className="text-blue-700 text-sm">사진을 업로드하면 GPS 정보를 자동 추출합니다.</p>
                  )}
                </div>
              </div>

              <button
                disabled={!imageFile || !location}
                onClick={() => setStep(2)}
                className="w-full bg-primary text-white font-bold py-4 rounded-bento disabled:opacity-50 mt-8 shadow-bento"
              >
                다음 단계로
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-text-main mb-2">자가 진단 및 연락처</h2>
                <p className="text-text-sub text-sm">해당되는 증상을 모두 선택해주세요.</p>
              </div>

              <div className="space-y-3">
                {[
                  { state: q1, set: setQ1, label: '솔잎 처짐 증상이 있나요?' },
                  { state: q2, set: setQ2, label: '잎 전체가 적갈색으로 변색되었나요?' },
                  { state: q3, set: setQ3, label: '수피(나무껍질)에 침입공이나 분비물이 보이나요?' },
                  { state: q4, set: setQ4, label: '송진 흐름이 멈추고 나무가 말라죽었나요?' },
                ].map((q, idx) => (
                  <label key={idx} className="flex items-center gap-3 bento-card p-4 cursor-pointer">
                    <button 
                      onClick={() => q.set(!q.state)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${q.state ? 'bg-primary border-primary' : 'border-[rgba(0,0,0,0.1)]'}`}
                    >
                      {q.state && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                    <span className="text-sm font-medium text-text-main">{q.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-text-main mb-2">연락처 (선택)</label>
                <input 
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-card-bg border border-[rgba(0,0,0,0.1)] rounded-[15px] px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow shadow-sm"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-card-bg text-text-main font-bold py-4 rounded-bento border border-[rgba(0,0,0,0.1)] shadow-sm"
                >
                  이전
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="flex-1 bg-primary text-white font-bold py-4 rounded-bento disabled:opacity-50 shadow-bento"
                >
                  {submitting ? '접수 중...' : '신고 접수하기'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
