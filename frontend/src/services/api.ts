/// <reference types="vite/client" />
import {
  DocumentExtractionResponse,
  EligibilityEvaluationResponse,
  FormReadinessResponse,
  FormTemplate,
  SchemeRule,
  CitizenProfile,
  ExplainResponse,
  AssistantMessageResponse,
  VaultDocumentItem,
  ActionReminder,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Module 1: Document Intelligence
  async extractDocument(options: {
    sampleKey?: string;
    file?: File;
    documentTypeHint?: string;
    languageHint?: string;
  }): Promise<DocumentExtractionResponse> {
    if (options.sampleKey) {
      const response = await fetch(
        `${API_BASE_URL}/v1/documents/extract?sample_key=${encodeURIComponent(options.sampleKey)}&language_hint=${options.languageHint || 'en'}`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error(`Document extraction failed: ${response.statusText}`);
      return response.json();
    }

    if (options.file) {
      const formData = new FormData();
      formData.append('file', options.file);
      const params = new URLSearchParams();
      if (options.documentTypeHint) params.append('document_type_hint', options.documentTypeHint);
      if (options.languageHint) params.append('language_hint', options.languageHint);

      const response = await fetch(`${API_BASE_URL}/v1/documents/extract?${params.toString()}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Document extraction failed: ${response.statusText}`);
      return response.json();
    }

    // Default sample
    const response = await fetch(`${API_BASE_URL}/v1/documents/extract?sample_key=sample_aadhaar`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Document extraction failed: ${response.statusText}`);
    return response.json();
  },

  async getSampleDocuments(): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE_URL}/v1/documents/samples`);
    if (!response.ok) throw new Error('Failed to fetch synthetic samples');
    return response.json();
  },

  // Module 2: Eligibility Copilot
  async getSchemes(): Promise<SchemeRule[]> {
    const response = await fetch(`${API_BASE_URL}/v1/eligibility/schemes`);
    if (!response.ok) throw new Error('Failed to fetch schemes list');
    return response.json();
  },

  async getScheme(schemeId: string): Promise<SchemeRule> {
    const response = await fetch(`${API_BASE_URL}/v1/eligibility/schemes/${schemeId}`);
    if (!response.ok) throw new Error(`Failed to fetch scheme ${schemeId}`);
    return response.json();
  },

  async evaluateEligibility(
    schemeId: string,
    profile: CitizenProfile,
    availableDocumentTypes: string[],
    language: string = 'en'
  ): Promise<EligibilityEvaluationResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/eligibility/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheme_id: schemeId,
        profile,
        available_document_types: availableDocumentTypes,
        language,
      }),
    });
    if (!response.ok) throw new Error(`Eligibility evaluation failed: ${response.statusText}`);
    return response.json();
  },

  // Module 3: Form Readiness Kit
  async getFormTemplates(): Promise<FormTemplate[]> {
    const response = await fetch(`${API_BASE_URL}/v1/forms/templates`);
    if (!response.ok) throw new Error('Failed to fetch form templates');
    return response.json();
  },

  async getFormTemplate(formId: string): Promise<FormTemplate> {
    const response = await fetch(`${API_BASE_URL}/v1/forms/templates/${formId}`);
    if (!response.ok) throw new Error(`Failed to fetch form template ${formId}`);
    return response.json();
  },

  async prepareFormPlan(
    formId: string,
    profile: CitizenProfile,
    language: string = 'en'
  ): Promise<FormReadinessResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/forms/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: formId,
        profile,
        language,
      }),
    });
    if (!response.ok) throw new Error(`Form readiness plan generation failed: ${response.statusText}`);
    return response.json();
  },

  async downloadDraftPdf(
    formId: string,
    profile: CitizenProfile,
    language: string = 'en'
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/v1/forms/${formId}/draft-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: formId,
        profile,
        language,
      }),
    });
    if (!response.ok) throw new Error(`Draft PDF download failed: ${response.statusText}`);
    return response.blob();
  },

  // Stretch Module: Bilingual Explainer & Assistant
  async explainText(
    text: string,
    context?: string,
    targetLanguage: string = 'hi'
  ): Promise<ExplainResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context,
        target_language: targetLanguage,
      }),
    });
    if (!response.ok) throw new Error('Explain request failed');
    return response.json();
  },

  async sendAssistantMessage(payload: {
    userMessage: string;
    language: string;
    currentContext?: string;
    activeFieldId?: string;
    formId?: string;
    schemeId?: string;
    contextData?: Record<string, any>;
  }): Promise<AssistantMessageResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_message: payload.userMessage,
        language: payload.language,
        current_context: payload.currentContext,
        active_field_id: payload.activeFieldId,
        form_id: payload.formId,
        scheme_id: payload.schemeId,
        context_data: payload.contextData,
      }),
    });
    if (!response.ok) throw new Error('Assistant chat request failed');
    return response.json();
  },

  async transcribeVoice(file: File | Blob): Promise<{ transcription: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file, 'recording.wav');
    const response = await fetch(`${API_BASE_URL}/v1/assistant/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Voice transcription failed');
    return response.json();
  },

  // Document Vault & Reminders
  async getVaultDocuments(): Promise<VaultDocumentItem[]> {
    const response = await fetch(`${API_BASE_URL}/v1/vault/documents`);
    if (!response.ok) throw new Error('Failed to fetch vault documents');
    return response.json();
  },

  async saveVaultDocument(doc: VaultDocumentItem): Promise<VaultDocumentItem> {
    const response = await fetch(`${API_BASE_URL}/v1/vault/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    if (!response.ok) throw new Error('Failed to save document to vault');
    return response.json();
  },

  async deleteVaultDocument(docId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/v1/vault/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete vault document');
  },

  async getActionReminders(): Promise<ActionReminder[]> {
    const response = await fetch(`${API_BASE_URL}/v1/vault/reminders`);
    if (!response.ok) throw new Error('Failed to fetch action reminders');
    return response.json();
  },
};
