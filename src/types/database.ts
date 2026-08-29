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
          status: string;
          source_question_id: string | null;
          questionnaire_id: string | null;
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
          status?: string;
          source_question_id?: string | null;
          questionnaire_id?: string | null;
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
          status?: string;
          source_question_id?: string | null;
          questionnaire_id?: string | null;
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
      scheduled_calls: {
        Row: {
          id: string;
          tenant_id: string;
          requester_sub: string;
          payment_id: string | null;
          scheduled_at: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          requester_sub: string;
          payment_id?: string | null;
          scheduled_at: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          requester_sub?: string;
          payment_id?: string | null;
          scheduled_at?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string | null;
          recipient_sub: string;
          channel: string;
          title: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          recipient_sub: string;
          channel: string;
          title: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          recipient_sub?: string;
          channel?: string;
          title?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      knowledge_hub_articles: {
        Row: {
          id: string;
          tenant_id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string;
          seo: Json;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body?: string;
          seo?: Json;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          body?: string;
          seo?: Json;
          status?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_sources: {
        Row: {
          id: string;
          corpus_id: string | null;
          source_type: string;
          jurisdiction: string;
          citation_es: string;
          citation_en: string;
          title_es: string;
          title_en: string;
          description_es: string | null;
          description_en: string | null;
          pdf_filename: string | null;
          chunk_count: number;
          status: string;
          founder_visible: boolean;
          extracted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          corpus_id?: string | null;
          source_type: string;
          jurisdiction?: string;
          citation_es: string;
          citation_en: string;
          title_es: string;
          title_en: string;
          description_es?: string | null;
          description_en?: string | null;
          pdf_filename?: string | null;
          chunk_count?: number;
          status?: string;
          founder_visible?: boolean;
          extracted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          corpus_id?: string | null;
          source_type?: string;
          jurisdiction?: string;
          citation_es?: string;
          citation_en?: string;
          title_es?: string;
          title_en?: string;
          description_es?: string | null;
          description_en?: string | null;
          pdf_filename?: string | null;
          chunk_count?: number;
          status?: string;
          founder_visible?: boolean;
          extracted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          clerk_user_id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          clerk_user_id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          clerk_user_id?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_document_globals: {
        Row: {
          id: string;
          draft_payload: Json;
          published_revision: number | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          draft_payload?: Json;
          published_revision?: number | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          draft_payload?: Json;
          published_revision?: number | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_document_global_revisions: {
        Row: {
          id: string;
          revision: number;
          payload: Json;
          published_at: string;
          published_by: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          revision: number;
          payload: Json;
          published_at?: string;
          published_by: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          revision?: number;
          payload?: Json;
          published_at?: string;
          published_by?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      platform_document_packs: {
        Row: {
          id: string;
          title_es: string;
          title_en: string;
          draft_payload: Json;
          status: string;
          published_revision: number | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title_es: string;
          title_en: string;
          draft_payload?: Json;
          status?: string;
          published_revision?: number | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title_es?: string;
          title_en?: string;
          draft_payload?: Json;
          status?: string;
          published_revision?: number | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_document_revisions: {
        Row: {
          id: string;
          pack_id: string;
          revision: number;
          payload: Json;
          published_at: string;
          published_by: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          pack_id: string;
          revision: number;
          payload: Json;
          published_at?: string;
          published_by: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          pack_id?: string;
          revision?: number;
          payload?: Json;
          published_at?: string;
          published_by?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_document_revisions_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "platform_document_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_templates: {
        Row: {
          slug: string;
          locale: string;
          name: string;
          draft_body: string;
          status: string;
          published_revision: number | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          locale: string;
          name: string;
          draft_body?: string;
          status?: string;
          published_revision?: number | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          locale?: string;
          name?: string;
          draft_body?: string;
          status?: string;
          published_revision?: number | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_template_revisions: {
        Row: {
          id: string;
          slug: string;
          locale: string;
          revision: number;
          body: string;
          published_at: string;
          published_by: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          locale: string;
          revision: number;
          body: string;
          published_at?: string;
          published_by: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          locale?: string;
          revision?: number;
          body?: string;
          published_at?: string;
          published_by?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      platform_feature_flag_overrides: {
        Row: {
          flag_key: string;
          enabled: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          flag_key: string;
          enabled: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          flag_key?: string;
          enabled?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      clauses: {
        Row: {
          id: string;
          tenant_id: string;
          slug: string;
          name: string;
          body: string;
          variants: Json;
          conditions: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          slug: string;
          name: string;
          body: string;
          variants?: Json;
          conditions?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          slug?: string;
          name?: string;
          body?: string;
          variants?: Json;
          conditions?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_dd_questions: {
        Row: {
          id: string;
          slug: string;
          section_key: string;
          sort_order: number;
          q_es: string;
          q_en: string;
          hint_es: string | null;
          hint_en: string | null;
          answer_type: string;
          risk_category: string;
          risk_level_if_gap: string;
          finding_es: string;
          finding_en: string;
          action_es: string | null;
          action_en: string | null;
          status: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          section_key: string;
          sort_order?: number;
          q_es: string;
          q_en: string;
          hint_es?: string | null;
          hint_en?: string | null;
          answer_type?: string;
          risk_category: string;
          risk_level_if_gap?: string;
          finding_es: string;
          finding_en: string;
          action_es?: string | null;
          action_en?: string | null;
          status?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          section_key?: string;
          sort_order?: number;
          q_es?: string;
          q_en?: string;
          hint_es?: string | null;
          hint_en?: string | null;
          answer_type?: string;
          risk_category?: string;
          risk_level_if_gap?: string;
          finding_es?: string;
          finding_en?: string;
          action_es?: string | null;
          action_en?: string | null;
          status?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dd_questionnaires: {
        Row: {
          id: string;
          owner_sub: string;
          deal_id: string | null;
          tenant_id: string | null;
          status: string;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_sub: string;
          deal_id?: string | null;
          tenant_id?: string | null;
          status?: string;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_sub?: string;
          deal_id?: string | null;
          tenant_id?: string | null;
          status?: string;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dd_questionnaire_answers: {
        Row: {
          questionnaire_id: string;
          question_id: string;
          value: string;
          note: string | null;
          updated_at: string;
        };
        Insert: {
          questionnaire_id: string;
          question_id: string;
          value?: string;
          note?: string | null;
          updated_at?: string;
        };
        Update: {
          questionnaire_id?: string;
          question_id?: string;
          value?: string;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_source_chunks: {
        Row: {
          id: string;
          source_id: string;
          locale: string;
          chunk_index: number;
          article_ref: string;
          heading: string;
          content: string;
          translation_status: string;
          content_tsv: string | null;
          embedding: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          locale: string;
          chunk_index: number;
          article_ref: string;
          heading: string;
          content: string;
          translation_status?: string;
          content_tsv?: string | null;
          embedding?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          locale?: string;
          chunk_index?: number;
          article_ref?: string;
          heading?: string;
          content?: string;
          translation_status?: string;
          content_tsv?: string | null;
          embedding?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legal_source_chunks_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "legal_sources";
            referencedColumns: ["id"];
          },
        ];
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
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
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
      search_legal_corpus: {
        Args: { p_query: string; p_locale?: string; p_limit?: number };
        Returns: {
          id: string;
          source_id: string;
          locale: string;
          article_ref: string;
          heading: string;
          content: string;
          citation: string;
          title: string;
          rank: number;
        }[];
      };
      increment_rate_limit: {
        Args: {
          p_subject_sub: string;
          p_action_key: string;
          p_window_start: string;
          p_tenant_id?: string;
        };
        Returns: number;
      };
      purge_stale_rate_limits: {
        Args: Record<string, never>;
        Returns: number;
      };
      purge_expired_audit_logs: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
