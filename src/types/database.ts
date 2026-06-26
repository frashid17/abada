export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserContext = "founder" | "investor" | "firm";

export type FirmRole = "partner" | "associate" | "of_counsel" | "admin";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          clerk_org_id: string | null;
          name: string;
          brand_config: Json;
          default_locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_org_id: string | null;
          name: string;
          brand_config?: Json;
          default_locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_org_id?: string;
          name?: string;
          brand_config?: Json;
          default_locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          clerk_user_id: string;
          context: UserContext;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          context: UserContext;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          context?: UserContext;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          tenant_id: string;
          clerk_user_id: string;
          role: FirmRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          clerk_user_id: string;
          role: FirmRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          clerk_user_id?: string;
          role?: FirmRole;
          created_at?: string;
        };
        Relationships: [];
      };
      firm_invitations: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          role: FirmRole;
          token: string;
          invited_by_sub: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by_sub: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email: string;
          role: FirmRole;
          token: string;
          invited_by_sub: string;
          expires_at: string;
          accepted_at?: string | null;
          accepted_by_sub?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          email?: string;
          role?: FirmRole;
          token?: string;
          invited_by_sub?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by_sub?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          owner_sub: string;
          tenant_id: string | null;
          document_type: string;
          title: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_sub: string;
          tenant_id?: string | null;
          document_type: string;
          title: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_sub?: string;
          tenant_id?: string | null;
          document_type?: string;
          title?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_field_values: {
        Row: {
          id: string;
          document_id: string;
          field_key: string;
          field_value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          field_key: string;
          field_value?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          field_key?: string;
          field_value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          storage_path: string | null;
          fingerprint: string | null;
          created_by_sub: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          version_number: number;
          storage_path?: string | null;
          fingerprint?: string | null;
          created_by_sub: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          version_number?: number;
          storage_path?: string | null;
          fingerprint?: string | null;
          created_by_sub?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      intake_submissions: {
        Row: {
          id: string;
          document_id: string;
          owner_sub: string;
          tenant_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          owner_sub: string;
          tenant_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          owner_sub?: string;
          tenant_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          tenant_id: string;
          document_id: string;
          requester_sub: string;
          assigned_clerk_user_id: string | null;
          status: string;
          markup: Json;
          executive_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          document_id: string;
          requester_sub: string;
          assigned_clerk_user_id?: string | null;
          status?: string;
          markup?: Json;
          executive_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          document_id?: string;
          requester_sub?: string;
          assigned_clerk_user_id?: string | null;
          status?: string;
          markup?: Json;
          executive_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          actor_sub: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          ip_address: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          actor_sub?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          ip_address?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          actor_sub?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          ip_address?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      firm_templates: {
        Row: {
          id: string;
          tenant_id: string;
          slug: string;
          name: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          slug: string;
          name: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          slug?: string;
          name?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deal_participants: {
        Row: {
          id: string;
          deal_id: string;
          participant_sub: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          participant_sub: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          participant_sub?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      data_room_documents: {
        Row: {
          id: string;
          deal_id: string;
          tenant_id: string;
          taxonomy_category: string;
          title: string;
          storage_path: string;
          version_number: number;
          fingerprint: string | null;
          watermark_policy: Json;
          nda_gate_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          tenant_id: string;
          taxonomy_category: string;
          title: string;
          storage_path: string;
          version_number?: number;
          fingerprint?: string | null;
          watermark_policy?: Json;
          nda_gate_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          tenant_id?: string;
          taxonomy_category?: string;
          title?: string;
          storage_path?: string;
          version_number?: number;
          fingerprint?: string | null;
          watermark_policy?: Json;
          nda_gate_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      findings: {
        Row: {
          id: string;
          deal_id: string;
          tenant_id: string;
          risk_category: string;
          risk_level: string;
          source_document_id: string | null;
          source_page: number | null;
          description: string;
          recommended_action: string | null;
          legal_citation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          tenant_id: string;
          risk_category: string;
          risk_level: string;
          source_document_id?: string | null;
          source_page?: number | null;
          description: string;
          recommended_action?: string | null;
          legal_citation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          tenant_id?: string;
          risk_category?: string;
          risk_level?: string;
          source_document_id?: string | null;
          source_page?: number | null;
          description?: string;
          recommended_action?: string | null;
          legal_citation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          deal_id: string;
          tenant_id: string;
          summary: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          tenant_id: string;
          summary?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          tenant_id?: string;
          summary?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          payer_sub: string;
          provider: string;
          provider_reference: string | null;
          amount_cents: number;
          currency: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          payer_sub: string;
          provider: string;
          provider_reference?: string | null;
          amount_cents: number;
          currency?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          payer_sub?: string;
          provider?: string;
          provider_reference?: string | null;
          amount_cents?: number;
          currency?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      revenue_splits: {
        Row: {
          id: string;
          payment_id: string;
          tenant_id: string;
          party: string;
          amount_cents: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          tenant_id: string;
          party: string;
          amount_cents: number;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          tenant_id?: string;
          party?: string;
          amount_cents?: number;
          currency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_call_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          caller_sub: string;
          task: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          caller_sub: string;
          task: string;
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          caller_sub?: string;
          task?: string;
          model?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      requesting_user_sub: { Args: Record<string, never>; Returns: string };
      requesting_org_id: { Args: Record<string, never>; Returns: string | null };
      active_tenant_id: { Args: Record<string, never>; Returns: string | null };
      search_firm_knowledge: {
        Args: { p_tenant_id: string; p_query: string; p_limit?: number };
        Returns: {
          id: string;
          topic_key: string;
          title: string;
          content: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
