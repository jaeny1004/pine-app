import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PineRecord } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

const hasRealKeys = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
export const supabase = hasRealKeys ? createClient(supabaseUrl, supabaseAnonKey) : null;


function mapSupabaseToPineRecord(row: any): PineRecord {
  return {
    id: row.id,
    created_at: row.created_at,
    latitude: row.latitude,
    longitude: row.longitude,
    image_url: row.image_url,
    phone_number: row.phone_number,
    status: row.status,
  };
}

function mapPineRecordToSupabase(record: Omit<PineRecord, 'id' | 'created_at'>) {
  return {
    latitude: record.latitude,
    longitude: record.longitude,
    image_url: record.image_url,
    phone_number: record.phone_number,
    status: record.status
  };
}
let mockRecords: PineRecord[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    latitude: 37.5665,
    longitude: 126.9780,
    image_url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=400',
    phone_number: '010-1234-5678',
    status: 'pending',
    ai_probability: null,
    ai_label: null,
    ai_status: 'pending'
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    latitude: 37.5700,
    longitude: 126.9800,
    image_url: 'https://images.unsplash.com/photo-1611082531980-0a75d50ba95a?auto=format&fit=crop&q=80&w=400',
    phone_number: '010-9876-5432',
    status: 'completed',
    ai_probability: 87,
    ai_label: 'pine_disease_suspected',
    ai_status: 'completed'
  }
];

interface SupabaseContextType {
  records: PineRecord[];
  loading: boolean;
  fetchRecords: () => Promise<void>;
  addRecord: (record: Omit<PineRecord, 'id' | 'created_at'>) => Promise<PineRecord | null>;
  updateStatus: (id: string, status: PineRecord['status']) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PineRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    if (supabase) {
      const { data, error } = await supabase.from('pine_records').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setRecords(data.map(mapSupabaseToPineRecord));
      }
    } else {
      setRecords([...mockRecords]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const addRecord = async (record: Omit<PineRecord, 'id' | 'created_at'>) => {
    if (supabase) {
      const supabaseRecord = mapPineRecordToSupabase(record);

      const { data, error } = await supabase
        .from('pine_records')
        .insert([supabaseRecord])
        .select();
      if (!error && data) {
        const newRecord = mapSupabaseToPineRecord(data[0]);
        setRecords(prev => [newRecord, ...prev]);
        return newRecord;
      }
    } else {
      const newRecord: PineRecord = {
        ...record,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      mockRecords = [newRecord, ...mockRecords];
      setRecords([...mockRecords]);
      return newRecord;
    }
    return null;
  };

  const updateStatus = async (id: string, status: PineRecord['status']) => {
    if (supabase) {
      const { error } = await supabase.from('pine_records').update({ status }).eq('id', id);
      if (!error) fetchRecords();
    } else {
      mockRecords = mockRecords.map(r => r.id === id ? { ...r, status } : r);
      setRecords([...mockRecords]);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (supabase) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('pine-images').upload(fileName, file);
      if (data) {
        const { data: publicData } = supabase.storage.from('pine-images').getPublicUrl(fileName);
        return publicData.publicUrl;
      }
      console.error('Upload error', error);
      return null;
    } else {
      return URL.createObjectURL(file);
    }
  };

  return React.createElement(SupabaseContext.Provider, {
    value: { records, loading, fetchRecords, addRecord, updateStatus, uploadImage }
  }, children);
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
