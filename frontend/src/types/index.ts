export type Language = 'en' | 'hi';

export type ScreenTab =
  | 'welcome'
  | 'dashboard'
  | 'form_workspace'
  | 'eligibility'
  | 'document_review'
  | 'form_readiness'
  | 'vault'
  | 'standalone_showcase';

export interface ProfileFieldValue {
  value: any;
  source: string;
  source_document_id?: string;
  confidence?: number;
  confirmed_by_user?: boolean;
  masked_value?: string;
}

export interface CitizenProfile {
  full_name?: ProfileFieldValue;
  date_of_birth?: ProfileFieldValue;
  age?: ProfileFieldValue;
  gender?: ProfileFieldValue;
  father_or_spouse_name?: ProfileFieldValue;
  aadhaar_number?: ProfileFieldValue;
  pan_number?: ProfileFieldValue;
  phone_number?: ProfileFieldValue;
  email?: ProfileFieldValue;
  annual_income?: ProfileFieldValue;
  occupation?: ProfileFieldValue;
  category?: ProfileFieldValue;
  state?: ProfileFieldValue;
  district?: ProfileFieldValue;
  pincode?: ProfileFieldValue;
  full_address?: ProfileFieldValue;
  landholding_acres?: ProfileFieldValue;
  bank_account_number?: ProfileFieldValue;
  bank_ifsc_code?: ProfileFieldValue;
  custom_fields?: Record<string, ProfileFieldValue>;
}

export interface ExtractedField {
  field_key: string;
  label_en: string;
  label_hi: string;
  value: any;
  masked_value?: string;
  source_text?: string;
  confidence: number;
  category: string;
  is_sensitive?: boolean;
  user_edited?: boolean;
}

export interface DocumentExtractionResponse {
  document_id: string;
  detected_document_type: string;
  raw_ocr_text: string;
  fields: ExtractedField[];
  quality_flags: string[];
  warnings: string[];
  requires_user_confirmation: boolean;
}

export interface CriterionEvaluation {
  criterion_id: string;
  label_en: string;
  label_hi: string;
  status: 'met' | 'not_met' | 'needs_information';
  reason_en: string;
  reason_hi: string;
  rule_source_citation: string;
  actual_value?: any;
}

export interface EligibilityEvaluationResponse {
  scheme_id: string;
  scheme_name: string;
  status: 'likely_match' | 'not_a_match' | 'needs_information';
  summary_explanation_en: string;
  summary_explanation_hi: string;
  criteria_evaluations: CriterionEvaluation[];
  missing_fields: Array<{ field_key: string; label_en: string; label_hi: string }>;
  missing_documents: Array<{ doc_type: string; name_en: string; name_hi: string; reason_en?: string; reason_hi?: string }>;
  next_actions_en: string[];
  next_actions_hi: string[];
  official_source_url: string;
}

export interface SchemeRule {
  id: string;
  version: string;
  name_en: string;
  name_hi: string;
  category_en: string;
  category_hi: string;
  description_en: string;
  description_hi: string;
  official_source_url: string;
  criteria: Array<{
    id: string;
    field_key: string;
    label_en: string;
    label_hi: string;
    rule_type: string;
    threshold?: number;
    min_value?: number;
    max_value?: number;
    citation?: string;
  }>;
  required_documents: Array<{
    doc_type: string;
    name_en: string;
    name_hi: string;
    reason_en: string;
    reason_hi: string;
  }>;
}

export interface FormFieldGuidance {
  field_id: string;
  label_en: string;
  label_hi: string;
  explanation_en: string;
  explanation_hi: string;
  field_type: string;
  is_required: boolean;
  proposed_value?: any;
  value_source: string;
  source_description_en?: string;
  source_description_hi?: string;
  confidence?: number;
  completion_state: 'ready' | 'needs_attention' | 'missing';
  manual_instruction_en: string;
  manual_instruction_hi: string;
  validation_regex?: string;
}

export interface FormTemplate {
  id: string;
  name_en: string;
  name_hi: string;
  category: string;
  form_type: 'manual' | 'fillable_pdf';
  description_en: string;
  description_hi: string;
  fields: Array<{
    field_id: string;
    profile_mapping?: string;
    label_en: string;
    label_hi: string;
    explanation_en: string;
    explanation_hi: string;
    field_type: string;
    is_required: boolean;
  }>;
  checklist_en: string[];
  checklist_hi: string[];
  supported_fillable: boolean;
}

export interface FormReadinessResponse {
  form_id: string;
  form_name_en: string;
  form_name_hi: string;
  form_type: string;
  total_fields: number;
  completed_fields: number;
  missing_fields_count: number;
  field_guidance_list: FormFieldGuidance[];
  checklist_en: string[];
  checklist_hi: string[];
  can_generate_pdf_draft: boolean;
  draft_download_url?: string;
  disclaimer: string;
}

export interface ExplainResponse {
  original_text: string;
  simplified_en: string;
  simplified_hi: string;
  key_takeaways_en: string[];
  key_takeaways_hi: string[];
  official_source_citation?: string;
}

export interface AssistantMessageResponse {
  response_text_en: string;
  response_text_hi: string;
  suggested_action?: string;
  audio_base64?: string;
  audio_format?: string;
}

export interface VaultDocumentItem {
  id: string;
  doc_type: string;
  name_en: string;
  name_hi: string;
  file_name?: string;
  extracted_fields_count: number;
  saved_at: string;
  expiry_date?: string;
  next_action_en?: string;
  next_action_hi?: string;
  is_synthetic_verified: boolean;
  tags: string[];
}

export interface ActionReminder {
  id: string;
  title_en: string;
  title_hi: string;
  description_en: string;
  description_hi: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  action_url?: string;
  is_completed: boolean;
}

export interface VoiceGuideRequest {
  user_message: string;
  language: 'en' | 'hi';
  current_screen: string;
  agent_stage?: string;
  active_form_id?: string | null;
  active_field_id?: string | null;
  profile_data?: Record<string, any>;
  form_fields?: Array<{ field_id: string; profile_mapping?: string; label_en: string; label_hi: string }>;
  conversation_history?: Array<{ role: string; content: string }>;
  synthesize_audio?: boolean;
}

export interface VoiceGuideResponse {
  spoken_text_en: string;
  spoken_text_hi: string;
  action_type: 'NAVIGATE' | 'SELECT_FORM' | 'SELECT_FIELD' | 'UPDATE_FIELD' | 'SPEAK';
  agent_stage: string;
  target_screen?: ScreenTab | null;
  target_form_id?: string | null;
  target_field_id?: string | null;
  extracted_field_update?: { field_key: string; value: any } | null;
  missing_fields_remaining: string[];
  suggested_quick_replies_en: string[];
  suggested_quick_replies_hi: string[];
  audio_base64?: string | null;
  audio_format?: string;
}
