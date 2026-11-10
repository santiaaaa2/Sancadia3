export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_content: {
        Row: {
          content_type: 'campaign' | 'daily_challenge' | 'cosmetic_collection' | 'premium_product';
          created_at: string;
          description: string;
          id: string;
          payload: Json;
          slug: string;
          status: 'draft' | 'published' | 'archived';
          title: string;
          updated_at: string;
        };
        Insert: {
          content_type: 'campaign' | 'daily_challenge' | 'cosmetic_collection' | 'premium_product';
          created_at?: string;
          description?: string;
          id?: string;
          payload?: Json;
          slug: string;
          status?: 'draft' | 'published' | 'archived';
          title: string;
          updated_at?: string;
        };
        Update: {
          content_type?: 'campaign' | 'daily_challenge' | 'cosmetic_collection' | 'premium_product';
          created_at?: string;
          description?: string;
          id?: string;
          payload?: Json;
          slug?: string;
          status?: 'draft' | 'published' | 'archived';
          title?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      latrunculi_admin_metrics: {
        Args: { window_days?: number };
        Returns: Json;
      };
      submit_result: {
        Args: {
          p_attempts?: number | null;
          p_client_result_id: string;
          p_difficulty: string;
          p_game_id: string;
          p_hints_used?: number;
          p_match_mode: string;
          p_outcome: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
};
