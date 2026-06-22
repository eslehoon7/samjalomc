export interface Reservation {
  id?: string;
  name: string;
  phone: string;
  branch: string;
  subject: string;
  date: string;
  time: string;
  memo: string;
  status?: string;
  createdAt?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isPinned?: boolean;
  views: number;
}

export interface DiagnoseRequest {
  sleep: string;
  eat: string;
  poop: string;
  age: string;
  gender: string;
  symptoms: string;
}

export interface DiagnoseResponse {
  analysis: string;
  isDemo?: boolean;
}

export interface DiagnoseItem {
  id: string;
  sleep: string;
  eat: string;
  poop: string;
  age: string;
  gender: string;
  symptoms: string;
  createdAt: string;
  analysis: string;
  doctorNotes?: string;
}

