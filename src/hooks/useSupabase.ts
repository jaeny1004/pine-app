import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import { PineRecord } from '../types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://mock-url.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'mock-key';

const hasRealKeys = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    (
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    )
);

export const supabase = hasRealKeys
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function mapSupabaseToPineRecord(
  row: any
): PineRecord {
  return {
    id: row.id,
    created_at: row.created_at,
    latitude: row.latitude,
    longitude: row.longitude,
    image_url: row.image_url,
    phone_number: row.phone_number,
    status: row.status,

    report_token: row.report_token ?? null,

    ai_probability:
      row.ai_probability ?? null,
    ai_label:
      row.ai_label ?? null,
    ai_status:
      row.ai_status ?? null,
  };
}

function mapPineRecordToSupabase(
  record: Omit<
    PineRecord,
    'id' | 'created_at'
  >
) {
  return {
    latitude: record.latitude,
    longitude: record.longitude,
    image_url: record.image_url,
    phone_number: record.phone_number,
    status: record.status,

    report_token:
      record.report_token ?? null,

    ai_probability:
      record.ai_probability ?? null,
    ai_label:
      record.ai_label ?? null,
    ai_status:
      record.ai_status ?? null,
  };
}

/*
 * Supabase Storage의 public URL에서
 * pine-images 내부 파일 경로만 추출합니다.
 */
function getStorageObjectPath(
  imageUrl: string
): string | null {
  const marker =
    '/storage/v1/object/public/pine-images/';

  const markerIndex =
    imageUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const pathWithQuery = imageUrl.slice(
    markerIndex + marker.length
  );

  const path =
    pathWithQuery.split('?')[0];

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

let mockRecords: PineRecord[] = [
  {
    id: 'mock-1',
    created_at: new Date(
      Date.now() - 1000 * 60 * 60
    ).toISOString(),
    latitude: 37.5665,
    longitude: 126.978,
    image_url:
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=400',
    phone_number: '010-1234-5678',
    status: 'pending',
    ai_probability: null,
    ai_label: null,
    ai_status: 'pending',
  },
  {
    id: 'mock-2',
    created_at: new Date(
      Date.now() - 1000 * 60 * 60 * 24
    ).toISOString(),
    latitude: 37.57,
    longitude: 126.98,
    image_url:
      'https://images.unsplash.com/photo-1611082531980-0a75d50ba95a?auto=format&fit=crop&q=80&w=400',
    phone_number: '010-9876-5432',
    status: 'completed',
    ai_probability: 87,
    ai_label:
      'pine_disease_suspected',
    ai_status: 'completed',
  },
];

interface SupabaseContextType {
  records: PineRecord[];
  loading: boolean;

  fetchRecords:
    () => Promise<void>;

  addRecord: (
    record: Omit<
      PineRecord,
      'id' | 'created_at'
    >
  ) => Promise<PineRecord | null>;

  updateStatus: (
    id: string,
    status: PineRecord['status']
  ) => Promise<boolean>;

  deleteRecord: (
    id: string
  ) => Promise<boolean>;

  uploadImage: (
    file: File
  ) => Promise<string | null>;
}

const SupabaseContext =
  createContext<
    SupabaseContextType | undefined
  >(undefined);

export function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [records, setRecords] =
    useState<PineRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const fetchRecords = async () => {
    setLoading(true);

    if (supabase) {
      const { data, error } =
        await supabase
          .from('pine_records')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

      if (error) {
        console.error(
          '민원 목록 조회 실패:',
          error
        );
      } else if (data) {
        setRecords(
          data.map(
            mapSupabaseToPineRecord
          )
        );
      }
    } else {
      setRecords([...mockRecords]);
    }

    setLoading(false);
  };

  /*
   * 앱이 처음 실행될 때 목록 조회
   */
  useEffect(() => {
    void fetchRecords();
  }, []);

  /*
   * Supabase pine_records 실시간 구독
   *
   * 다른 화면이나 다른 기기에서
   * 신고 추가·상태 변경·삭제가 발생하면
   * records 상태를 즉시 변경합니다.
   */
  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('pine-records-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pine_records',
        },
        payload => {
          if (
            payload.eventType === 'INSERT'
          ) {
            const newRecord =
              mapSupabaseToPineRecord(
                payload.new
              );

            setRecords(previous => {
              const alreadyExists =
                previous.some(
                  record =>
                    record.id ===
                    newRecord.id
                );

              if (alreadyExists) {
                return previous;
              }

              return [
                newRecord,
                ...previous,
              ];
            });

            return;
          }

          if (
            payload.eventType === 'UPDATE'
          ) {
            const updatedRecord =
              mapSupabaseToPineRecord(
                payload.new
              );

            setRecords(previous =>
              previous.map(record =>
                record.id ===
                updatedRecord.id
                  ? updatedRecord
                  : record
              )
            );

            return;
          }

          if (
            payload.eventType === 'DELETE'
          ) {
            const deletedId =
              (
                payload.old as {
                  id?: string;
                }
              ).id;

            if (!deletedId) {
              return;
            }

            setRecords(previous =>
              previous.filter(
                record =>
                  record.id !== deletedId
              )
            );
          }
        }
      )
      .subscribe(status => {
        console.log(
          'pine_records Realtime:',
          status
        );
      });

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, []);

  const addRecord = async (
    record: Omit<
      PineRecord,
      'id' | 'created_at'
    >
  ): Promise<PineRecord | null> => {
    if (supabase) {
      const insertData =
        mapPineRecordToSupabase(record);

      const { data, error } =
        await supabase
          .from('pine_records')
          .insert([insertData])
          .select()
          .single();

      if (error) {
        console.error(
          '민원 등록 실패:',
          error
        );

        return null;
      }

      const newRecord =
        mapSupabaseToPineRecord(data);

      /*
       * Realtime 수신 전에도
       * 현재 화면에서 즉시 반영
       */
      setRecords(previous => {
        const alreadyExists =
          previous.some(
            item =>
              item.id === newRecord.id
          );

        if (alreadyExists) {
          return previous;
        }

        return [
          newRecord,
          ...previous,
        ];
      });

      return newRecord;
    }

    const newRecord: PineRecord = {
      ...record,
      id: `mock-${Date.now()}`,
      created_at:
        new Date().toISOString(),
    };

    mockRecords = [
      newRecord,
      ...mockRecords,
    ];

    setRecords([...mockRecords]);

    return newRecord;
  };

  const updateStatus = async (
    id: string,
    status: PineRecord['status']
  ): Promise<boolean> => {
    const previousRecord =
      records.find(
        record => record.id === id
      );

    /*
     * DB 응답을 기다리지 않고
     * 화면부터 즉시 갱신
     */
    setRecords(previous =>
      previous.map(record =>
        record.id === id
          ? {
              ...record,
              status,
            }
          : record
      )
    );

    if (supabase) {
      const { error } =
        await supabase
          .from('pine_records')
          .update({ status })
          .eq('id', id);

      if (error) {
        console.error(
          '민원 상태 변경 실패:',
          error
        );

        /*
         * DB 변경 실패 시
         * 이전 상태로 복구
         */
        if (previousRecord) {
          setRecords(previous =>
            previous.map(record =>
              record.id === id
                ? previousRecord
                : record
            )
          );
        }

        return false;
      }

      return true;
    }

    mockRecords =
      mockRecords.map(record =>
        record.id === id
          ? {
              ...record,
              status,
            }
          : record
      );

    setRecords([...mockRecords]);

    return true;
  };

  const deleteRecord = async (
    id: string
  ): Promise<boolean> => {
    const targetRecord =
      records.find(
        record => record.id === id
      );

    if (!targetRecord) {
      return false;
    }

    /*
     * 화면에서 먼저 제거
     */
    setRecords(previous =>
      previous.filter(
        record => record.id !== id
      )
    );

    if (supabase) {
      const { error } =
        await supabase
          .from('pine_records')
          .delete()
          .eq('id', id);

      if (error) {
        console.error(
          '민원 삭제 실패:',
          error
        );

        /*
         * 삭제 실패 시 목록 복구
         */
        setRecords(previous => {
          const alreadyExists =
            previous.some(
              record =>
                record.id === id
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            targetRecord,
            ...previous,
          ];
        });

        return false;
      }

      /*
       * DB 삭제가 성공한 경우
       * 연결된 Storage 사진도 정리 시도
       */
      if (targetRecord.image_url) {
        const objectPath =
          getStorageObjectPath(
            targetRecord.image_url
          );

        if (objectPath) {
          const {
            error: storageError,
          } = await supabase.storage
            .from('pine-images')
            .remove([objectPath]);

          if (storageError) {
            console.warn(
              '민원은 삭제됐지만 사진 삭제는 실패했습니다:',
              storageError
            );
          }
        }
      }

      return true;
    }

    mockRecords =
      mockRecords.filter(
        record => record.id !== id
      );

    setRecords([...mockRecords]);

    return true;
  };

  const uploadImage = async (
    file: File
  ): Promise<string | null> => {
    if (supabase) {
      const fileName =
        `${Date.now()}-${file.name}`;

      const { data, error } =
        await supabase.storage
          .from('pine-images')
          .upload(fileName, file);

      if (error || !data) {
        console.error(
          '사진 업로드 실패:',
          error
        );

        return null;
      }

      const { data: publicData } =
        supabase.storage
          .from('pine-images')
          .getPublicUrl(fileName);

      return publicData.publicUrl;
    }

    return URL.createObjectURL(file);
  };

  return React.createElement(
    SupabaseContext.Provider,
    {
      value: {
        records,
        loading,
        fetchRecords,
        addRecord,
        updateStatus,
        deleteRecord,
        uploadImage,
      },
    },
    children
  );
}

export function useSupabase() {
  const context =
    useContext(SupabaseContext);

  if (!context) {
    throw new Error(
      'useSupabase must be used within a SupabaseProvider'
    );
  }

  return context;
}