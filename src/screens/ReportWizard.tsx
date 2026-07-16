import React, { useEffect, useRef, useState } from 'react';
import { ScreenName } from '../types';
import {
  Camera,
  ChevronLeft,
  ImagePlus,
  Send,
  X,
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';

interface ReportWizardProps {
  navigate: (screen: ScreenName) => void;
  onSuccess: () => void;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function ReportWizard({
  navigate,
  onSuccess,
}: ReportWizardProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { addRecord, uploadImage } = useSupabase();

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const startCamera = async () => {
    try {
      setCameraError('');
      setSubmitError('');

      stopCamera();
      setCameraOpen(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment',
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(error => {
            console.error('Video play error:', error);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Camera start error:', error);

      setCameraOpen(false);
      setCameraError(
        '카메라를 실행할 수 없습니다. 브라우저의 카메라 권한을 허용해주세요.'
      );
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('카메라 화면이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('사진을 처리할 수 없습니다.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        if (!blob) {
          setCameraError('사진 생성에 실패했습니다.');
          return;
        }

        if (imagePreview?.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview);
        }

        const capturedFile = new File(
          [blob],
          `pine-report-${Date.now()}.jpg`,
          {
            type: 'image/jpeg',
          }
        );

        const previewUrl = URL.createObjectURL(capturedFile);

        setImageFile(capturedFile);
        setImagePreview(previewUrl);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const handleGallerySelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setCameraError('');
    setSubmitError('');

    event.target.value = '';
  };

  const removeImage = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 3) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const getCurrentCoordinates = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('이 기기에서는 위치정보를 사용할 수 없습니다.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error('Geolocation error:', error);
          reject(
            new Error(
              '위치정보를 가져올 수 없습니다. 브라우저의 위치 권한을 허용해주세요.'
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    });
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setSubmitError('신고할 사진을 촬영하거나 갤러리에서 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      // 화면에는 표시하지 않고 제출 시 위치정보만 수집
      const coordinates = await getCurrentCoordinates();

      // Supabase Storage에 사진 업로드
      const imageUrl = await uploadImage(imageFile);

      if (!imageUrl) {
        throw new Error('사진 업로드에 실패했습니다.');
      }

      // Supabase pine_records 테이블에 신고 데이터 저장
      const savedRecord = await addRecord({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        image_url: imageUrl,
        phone_number: phone || '미입력',
        status: 'pending',
        ai_probability: null,
        ai_label: null,
        ai_status: 'pending',
      });

      if (!savedRecord) {
        throw new Error('신고 정보를 저장하지 못했습니다.');
      }

      onSuccess();
    } catch (error) {
      console.error('Report submit error:', error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : '신고 접수 중 오류가 발생했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-system-bg flex flex-col">
      {/* 상단 헤더 */}
      <div className="bg-card-bg p-4 pt-12 flex items-center border-b border-[rgba(0,0,0,0.04)] sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate('home')}
          className="p-2 -ml-2 text-text-sub active:bg-system-bg rounded-full transition-colors"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="flex-1 text-center font-semibold text-text-main mr-8">
          의심목 신고
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-main mb-2">
              의심목 사진 등록
            </h2>

            <p className="text-text-sub text-sm leading-6">
              피해를 입은 소나무의 전체 모습과 특징이 잘 보이도록
              촬영하거나 갤러리에서 사진을 선택해주세요.
            </p>
          </div>

          {/* 사진 촬영 / 미리보기 통합 영역 */}
          <div className="relative w-full h-72 bg-card-bg border-2 border-dashed border-[rgba(0,0,0,0.1)] rounded-bento overflow-hidden shadow-bento">
            {cameraOpen ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-black"
                />

                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center z-10"
                  aria-label="카메라 닫기"
                >
                  <X size={21} />
                </button>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white bg-white/30 flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="사진 촬영"
                  >
                    <div className="w-12 h-12 rounded-full bg-white" />
                  </button>
                </div>
              </>
            ) : imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="신고 사진 미리보기"
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center"
                  aria-label="사진 삭제"
                >
                  <X size={21} />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-sub">
                <Camera size={38} className="mb-3 opacity-60" />
                <span className="font-semibold">신고 사진을 등록해주세요</span>
              </div>
            )}
          </div>






          {/* 촬영/갤러리 버튼 */}
          {!cameraOpen && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="bg-primary text-white font-bold py-4 rounded-bento flex items-center justify-center gap-2 shadow-bento active:scale-[0.98] transition-transform"
              >
                <Camera size={20} />
                사진 촬영
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-card-bg text-text-main font-bold py-4 rounded-bento border border-[rgba(0,0,0,0.08)] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
              >
                <ImagePlus size={20} />
                갤러리 업로드
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGallerySelect}
              />
            </div>
          )}


          {cameraError && (
            <div className="bg-red-50 text-red-500 text-sm rounded-2xl p-4">
              {cameraError}
            </div>
          )}

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              연락처
            </label>

            <input
              type="tel"
              inputMode="numeric"
              placeholder="010-1234-5678"
              value={phone}
              onChange={event =>
                setPhone(formatPhoneNumber(event.target.value))
              }
              className="w-full bg-card-bg border border-[rgba(0,0,0,0.1)] rounded-[15px] px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow shadow-sm"
            />

            <p className="text-xs text-text-sub mt-2">
              처리 결과 안내를 받을 전화번호를 입력해주세요.
            </p>
          </div>

          {submitError && (
            <div className="bg-red-50 text-red-500 text-sm rounded-2xl p-4">
              {submitError}
            </div>
          )}

          {/* 신고하기 */}
          <button
            type="button"
            disabled={!imageFile || submitting || cameraOpen}
            onClick={handleSubmit}
            className="w-full bg-primary text-white font-bold py-4 rounded-bento disabled:opacity-50 shadow-bento flex items-center justify-center gap-2"
          >
            <Send size={20} />

            {submitting ? '신고 접수 중...' : '신고하기'}
          </button>
        </div>
      </div>

      {/* 카메라 캡처용 숨김 canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}