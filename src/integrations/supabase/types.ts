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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      event_fighters: {
        Row: {
          card_type: string
          created_at: string
          event_id: string
          fight_order: number
          fighter_id: string
          id: string
          odds: number | null
        }
        Insert: {
          card_type?: string
          created_at?: string
          event_id: string
          fight_order?: number
          fighter_id: string
          id?: string
          odds?: number | null
        }
        Update: {
          card_type?: string
          created_at?: string
          event_id?: string
          fight_order?: number
          fighter_id?: string
          id?: string
          odds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_fighters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fighters_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          fights_count: number
          id: string
          location: string
          main_event: string
          name: string
          predictions_close_at: string | null
          predictions_open_at: string | null
          preview_notes: string
          preview_pdf_url: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          fights_count?: number
          id?: string
          location?: string
          main_event?: string
          name: string
          predictions_close_at?: string | null
          predictions_open_at?: string | null
          preview_notes?: string
          preview_pdf_url?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          fights_count?: number
          id?: string
          location?: string
          main_event?: string
          name?: string
          predictions_close_at?: string | null
          predictions_open_at?: string | null
          preview_notes?: string
          preview_pdf_url?: string | null
          status?: string
        }
        Relationships: []
      }
      fight_results: {
        Row: {
          created_at: string
          fight_id: string
          id: string
          is_fatn: boolean
          is_fotn: boolean
          method: string | null
          potn_fighter_ids: string[] | null
          round: number | null
          winner_fighter_id: string | null
        }
        Insert: {
          created_at?: string
          fight_id: string
          id?: string
          is_fatn?: boolean
          is_fotn?: boolean
          method?: string | null
          potn_fighter_ids?: string[] | null
          round?: number | null
          winner_fighter_id?: string | null
        }
        Update: {
          created_at?: string
          fight_id?: string
          id?: string
          is_fatn?: boolean
          is_fotn?: boolean
          method?: string | null
          potn_fighter_ids?: string[] | null
          round?: number | null
          winner_fighter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_results_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: true
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_results_winner_fighter_id_fkey"
            columns: ["winner_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      fighters: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
          nickname: string
          record: string
          salary: number
          weight_class: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          name: string
          nickname?: string
          record?: string
          salary?: number
          weight_class?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
          nickname?: string
          record?: string
          salary?: number
          weight_class?: string
        }
        Relationships: []
      }
      fights: {
        Row: {
          card_type: string
          created_at: string
          event_id: string
          fight_order: number
          fight_type: string
          fighter_a_id: string
          fighter_b_id: string
          id: string
          odds_fighter_a: number | null
          odds_fighter_b: number | null
        }
        Insert: {
          card_type?: string
          created_at?: string
          event_id: string
          fight_order?: number
          fight_type?: string
          fighter_a_id: string
          fighter_b_id: string
          id?: string
          odds_fighter_a?: number | null
          odds_fighter_b?: number | null
        }
        Update: {
          card_type?: string
          created_at?: string
          event_id?: string
          fight_order?: number
          fight_type?: string
          fighter_a_id?: string
          fighter_b_id?: string
          id?: string
          odds_fighter_a?: number | null
          odds_fighter_b?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          event_id: string | null
          id: string
          points: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          event_id?: string | null
          id?: string
          points?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          event_id?: string | null
          id?: string
          points?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lineup_fighters: {
        Row: {
          fighter_id: string
          id: string
          lineup_id: string
        }
        Insert: {
          fighter_id: string
          id?: string
          lineup_id: string
        }
        Update: {
          fighter_id?: string
          id?: string
          lineup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_fighters_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_fighters_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          captain_fighter_id: string | null
          created_at: string
          event_id: string
          id: string
          total_salary: number
          user_id: string
        }
        Insert: {
          captain_fighter_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          total_salary?: number
          user_id: string
        }
        Update: {
          captain_fighter_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          total_salary?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineups_captain_fighter_id_fkey"
            columns: ["captain_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string
          event_id: string
          fight_id: string
          id: string
          method: string | null
          round: number | null
          updated_at: string
          user_id: string
          winner_fighter_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          fight_id: string
          id?: string
          method?: string | null
          round?: number | null
          updated_at?: string
          user_id: string
          winner_fighter_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          fight_id?: string
          id?: string
          method?: string | null
          round?: number | null
          updated_at?: string
          user_id?: string
          winner_fighter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_winner_fighter_id_fkey"
            columns: ["winner_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          action_name: string
          category: string
          description: string | null
          id: string
          label: string
          points: number
          updated_at: string
        }
        Insert: {
          action_name: string
          category?: string
          description?: string | null
          id?: string
          label: string
          points?: number
          updated_at?: string
        }
        Update: {
          action_name?: string
          category?: string
          description?: string | null
          id?: string
          label?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
