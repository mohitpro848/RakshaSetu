export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      buddy_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          sender_id: string
          sender_name: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          sender_id: string
          sender_name?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          sender_id?: string
          sender_name?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "buddy_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_sessions: {
        Row: {
          buddy_id: string | null
          buddy_lat: number | null
          buddy_lng: number | null
          buddy_name: string | null
          check_in_interval: number
          created_at: string
          creator_id: string
          creator_lat: number | null
          creator_lng: number | null
          creator_name: string | null
          destination: string | null
          ended_at: string | null
          id: string
          last_check_in: string | null
          session_code: string
          status: string
        }
        Insert: {
          buddy_id?: string | null
          buddy_lat?: number | null
          buddy_lng?: number | null
          buddy_name?: string | null
          check_in_interval?: number
          created_at?: string
          creator_id: string
          creator_lat?: number | null
          creator_lng?: number | null
          creator_name?: string | null
          destination?: string | null
          ended_at?: string | null
          id?: string
          last_check_in?: string | null
          session_code: string
          status?: string
        }
        Update: {
          buddy_id?: string | null
          buddy_lat?: number | null
          buddy_lng?: number | null
          buddy_name?: string | null
          check_in_interval?: number
          created_at?: string
          creator_id?: string
          creator_lat?: number | null
          creator_lng?: number | null
          creator_name?: string | null
          destination?: string | null
          ended_at?: string | null
          id?: string
          last_check_in?: string | null
          session_code?: string
          status?: string
        }
        Relationships: []
      }
      cctv_locations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          downvotes: number
          id: string
          is_verified: boolean
          latitude: number
          longitude: number
          photo_url: string | null
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          downvotes?: number
          id?: string
          is_verified?: boolean
          latitude: number
          longitude: number
          photo_url?: string | null
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          downvotes?: number
          id?: string
          is_verified?: boolean
          latitude?: number
          longitude?: number
          photo_url?: string | null
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      evidence_files: {
        Row: {
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          latitude: number | null
          longitude: number | null
          mime_type: string | null
          session_code: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type?: string | null
          session_code?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type?: string | null
          session_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_name: string | null
          category: string
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          category?: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          category?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["incident_category"]
          created_at: string
          description: string
          id: string
          is_anonymous: boolean
          latitude: number
          longitude: number
          photo_url: string | null
          reporter_name: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          description: string
          id?: string
          is_anonymous?: boolean
          latitude: number
          longitude: number
          photo_url?: string | null
          reporter_name?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          description?: string
          id?: string
          is_anonymous?: boolean
          latitude?: number
          longitude?: number
          photo_url?: string | null
          reporter_name?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      live_location_updates: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          session_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          session_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_location_updates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_tracking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_tracking_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          session_code: string
          started_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          session_code: string
          started_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          session_code?: string
          started_at?: string
        }
        Relationships: []
      }
      location_ratings: {
        Row: {
          address: string | null
          author_name: string | null
          created_at: string
          crowd_rating: number | null
          id: string
          latitude: number | null
          lighting_rating: number | null
          longitude: number | null
          place_name: string
          review: string | null
          safety_rating: number
          user_id: string
          visit_time: string | null
        }
        Insert: {
          address?: string | null
          author_name?: string | null
          created_at?: string
          crowd_rating?: number | null
          id?: string
          latitude?: number | null
          lighting_rating?: number | null
          longitude?: number | null
          place_name: string
          review?: string | null
          safety_rating: number
          user_id: string
          visit_time?: string | null
        }
        Update: {
          address?: string | null
          author_name?: string | null
          created_at?: string
          crowd_rating?: number | null
          id?: string
          latitude?: number | null
          lighting_rating?: number | null
          longitude?: number | null
          place_name?: string
          review?: string | null
          safety_rating?: number
          user_id?: string
          visit_time?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_zones: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          notify_contacts: boolean
          radius_meters: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          notify_contacts?: boolean
          radius_meters?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          notify_contacts?: boolean
          radius_meters?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          accuracy: number | null
          alert_type: string
          contacts_notified_count: number
          created_at: string
          ended_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          message: string
          status: string
          tracking_session_code: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          alert_type?: string
          contacts_notified_count?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string
          status?: string
          tracking_session_code?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          alert_type?: string
          contacts_notified_count?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string
          status?: string
          tracking_session_code?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tutorial_progress: {
        Row: {
          completed_at: string
          id: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      incident_reports_safe: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["incident_category"] | null
          created_at: string | null
          description: string | null
          id: string | null
          is_anonymous: boolean | null
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          reporter_name: string | null
          severity: Database["public"]["Enums"]["incident_severity"] | null
          status: Database["public"]["Enums"]["incident_status"] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["incident_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          reporter_name?: never
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          status?: Database["public"]["Enums"]["incident_status"] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["incident_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          reporter_name?: never
          severity?: Database["public"]["Enums"]["incident_severity"] | null
          status?: Database["public"]["Enums"]["incident_status"] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_tracking_session: {
        Args: { _code: string }
        Returns: {
          created_at: string
          ended_at: string
          id: string
          is_active: boolean
          session_code: string
          started_at: string
        }[]
      }
      end_tracking_session_by_code: {
        Args: { _code: string }
        Returns: undefined
      }
      get_buddy_session_by_code: {
        Args: { _code: string }
        Returns: {
          buddy_id: string | null
          buddy_lat: number | null
          buddy_lng: number | null
          buddy_name: string | null
          check_in_interval: number
          created_at: string
          creator_id: string
          creator_lat: number | null
          creator_lng: number | null
          creator_name: string | null
          destination: string | null
          ended_at: string | null
          id: string
          last_check_in: string | null
          session_code: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "buddy_sessions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_location_updates_by_code: {
        Args: { _code: string }
        Returns: {
          accuracy: number
          created_at: string
          id: string
          latitude: number
          longitude: number
          session_id: string
        }[]
      }
      get_tracking_session_by_code: {
        Args: { _code: string }
        Returns: {
          created_at: string
          ended_at: string
          id: string
          is_active: boolean
          session_code: string
          started_at: string
        }[]
      }
      post_location_update: {
        Args: { _accuracy?: number; _code: string; _lat: number; _lng: number }
        Returns: undefined
      }
    }
    Enums: {
      incident_category:
        | "harassment"
        | "theft"
        | "unsafe_area"
        | "stalking"
        | "assault"
        | "other"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_status: "pending" | "verified" | "resolved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      incident_category: [
        "harassment",
        "theft",
        "unsafe_area",
        "stalking",
        "assault",
        "other",
      ],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: ["pending", "verified", "resolved"],
    },
  },
} as const
