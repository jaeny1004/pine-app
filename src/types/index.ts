export type RecordStatus = 'pending' | 'in_progress' | 'completed';

export interface PineRecord {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  image_url: string;
  phone: string;
  status: RecordStatus;
  diagnosis_json: {
    q1: boolean;
    q2: boolean;
    q3: boolean;
    q4: boolean;
  };
  
}

export type ScreenName = 'home' | 'login' | 'report' | 'field' | 'tracking' | 'chatbot' | 'settings' | 'tickets';
