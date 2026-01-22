// Lead/CRM Types
export type LeadStatus = 'new' | 'negotiation' | 'sent' | 'closed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventType: string;
  eventDate?: string;
  status: LeadStatus;
  value?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

// Project/Event Types
export type ProjectStatus = 'scheduled' | 'in_progress' | 'editing' | 'delivered';

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  eventType: string;
  eventDate: string;
  location?: string;
  status: ProjectStatus;
  totalPhotos?: number;
  selectedPhotos?: number;
  packageLimit: number;
  createdAt: string;
}

// Album/Gallery Types
export interface Album {
  id: string;
  projectId: string;
  title: string;
  coverUrl?: string;
  photoCount: number;
  isProofing: boolean;
  isDelivery: boolean;
  createdAt: string;
}

// Photo Types
export interface Photo {
  id: string;
  albumId: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  isSelected: boolean;
  isFavorite: boolean;
  comment?: string;
  order: number;
}

// Quote/Budget Types
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  leadId?: string;
  clientName: string;
  clientEmail: string;
  eventType: string;
  eventDate?: string;
  items: QuoteItem[];
  totalValue: number;
  notes?: string;
  validUntil: string;
  createdAt: string;
}

// Calendar Event Types
export interface CalendarEvent {
  id: string;
  projectId?: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'session' | 'meeting' | 'delivery' | 'other';
  location?: string;
  notes?: string;
}
