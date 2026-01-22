export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      albums: {
        Row: {
          cover_url: string | null
          created_at: string | null
          id: string
          is_delivery: boolean | null
          is_proofing: boolean | null
          photo_count: number | null
          project_id: string | null
          title: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          id?: string
          is_delivery?: boolean | null
          is_proofing?: boolean | null
          photo_count?: number | null
          project_id?: string | null
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          id?: string
          is_delivery?: boolean | null
          is_proofing?: boolean | null
          photo_count?: number | null
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          location: string | null
          notes: string | null
          project_id: string | null
          start_time: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          event_date: string | null
          event_type: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_date?: string | null
          event_type: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_date?: string | null
          event_type?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          album_id: string | null
          comment: string | null
          created_at: string | null
          filename: string
          id: string
          is_favorite: boolean | null
          is_selected: boolean | null
          sort_order: number | null
          thumbnail_url: string
          url: string
        }
        Insert: {
          album_id?: string | null
          comment?: string | null
          created_at?: string | null
          filename: string
          id?: string
          is_favorite?: boolean | null
          is_selected?: boolean | null
          sort_order?: number | null
          thumbnail_url: string
          url: string
        }
        Update: {
          album_id?: string | null
          comment?: string | null
          created_at?: string | null
          filename?: string
          id?: string
          is_favorite?: boolean | null
          is_selected?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          package_limit: number
          selected_photos: number | null
          status: string
          title: string
          total_photos: number | null
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string | null
          event_date: string
          event_type: string
          id?: string
          location?: string | null
          package_limit?: number
          selected_photos?: number | null
          status?: string
          title: string
          total_photos?: number | null
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          package_limit?: number
          selected_photos?: number | null
          status?: string
          title?: string
          total_photos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          description: string
          id: string
          quantity: number
          quote_id: string | null
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          quantity?: number
          quote_id?: string | null
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          quantity?: number
          quote_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_email: string
          client_name: string
          created_at: string | null
          event_date: string | null
          event_type: string
          id: string
          lead_id: string | null
          notes: string | null
          total_value: number
          valid_until: string
        }
        Insert: {
          client_email: string
          client_name: string
          created_at?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          total_value?: number
          valid_until: string
        }
        Update: {
          client_email?: string
          client_name?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          total_value?: number
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          id: string
          name: string
          type: string
          color: string | null
          icon: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          color?: string | null
          icon?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          color?: string | null
          icon?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          description: string
          amount: number
          type: string
          category_id: string | null
          project_id: string | null
          client_id: string | null
          date: string
          payment_method: string | null
          status: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          description: string
          amount: number
          type: string
          category_id?: string | null
          project_id?: string | null
          client_id?: string | null
          date?: string
          payment_method?: string | null
          status?: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          type?: string
          category_id?: string | null
          project_id?: string | null
          client_id?: string | null
          date?: string
          payment_method?: string | null
          status?: string
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Entity types
export type Lead = Tables<'leads'>
export type Client = Tables<'clients'>
export type Project = Tables<'projects'>
export type Album = Tables<'albums'>
export type Photo = Tables<'photos'>
export type Quote = Tables<'quotes'>
export type QuoteItem = Tables<'quote_items'>
export type CalendarEvent = Tables<'calendar_events'>
export type ProfileRow = Tables<'profiles'>
export type FinanceCategoryRow = Tables<'finance_categories'>
export type TransactionRow = Tables<'transactions'>

// Status types
export type LeadStatus = 'new' | 'negotiation' | 'sent' | 'closed'
export type ProjectStatus = 'scheduled' | 'in_progress' | 'editing' | 'delivered'
export type EventType = 'session' | 'meeting' | 'delivery' | 'other'
export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'paid' | 'cancelled'
export type UserRole = 'admin' | 'atendente' | 'cliente'

// Profile type
export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string | null
  updated_at: string | null
}

// Finance types
export interface FinanceCategory {
  id: string
  name: string
  type: TransactionType
  color: string | null
  icon: string | null
  created_at: string | null
}

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category_id: string | null
  project_id: string | null
  client_id: string | null
  date: string
  payment_method: string | null
  status: TransactionStatus
  notes: string | null
  created_at: string | null
}

export interface TransactionWithCategory extends Transaction {
  category?: FinanceCategory | null
}

