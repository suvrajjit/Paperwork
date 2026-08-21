import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Sparkles,
  Send,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Upload,
  FolderLock,
  Layers,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { FormTemplate, AssistantMessageResponse, DocumentExtractionResponse } from '../../types';
import { OriginalTextToggle } from '../../components/common/OriginalTextToggle';
import { VoiceWaveform } from '../../components/common/VoiceWaveform';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';

export const FormWorkspaceScreen: React.FC = () => {
  const {
    language,
    setActiveTab,
    selectedFormId,
    setSelectedFormId,
    activeFieldId,
    setActiveFieldId,
    profile,
    vaultDocs,
  } = useApp();

  const [availableTemplates, setAvailableTemplates] = useState<FormTemplate[]>([]);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'guidance'>('guidance');
  const [showRawOcrInspector, setShowRawOcrInspector] = useState(false);

  // Source selection: 'template' | 'vault' | 'upload'
  const [sourceMode, setSourceMode] = useState<'template' | 'vault' | 'upload'>('template');
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Embedded Assistant Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'assistant'; text_en: string; text_hi: string }>
  >([
    {
      sender: 'assistant',
      text_en:
        'I am your bilingual form guide. Click any field on the form to see simple explanations and what to write.',
      text_hi:
        'मैं आपका द्विभाषी फॉर्म सहायक हूँ। किसी भी फ़ील्ड पर क्लिक करके उसका सरल विवरण और भरने के निर्देश देखें।',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 1. Fetch available templates list on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const templates = await api.getFormTemplates();
        setAvailableTemplates(templates);
      } catch (err) {
        console.error('Error loading form templates:', err);
      }
    }
    loadTemplates();
  }, []);

  // 2. Load the active template
  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      try {
        const data = await api.getFormTemplate(selectedFormId);
        setFormTemplate(data);
        setRawOcrText(null);
        if (data.fields.length > 0 && !activeFieldId) {
          setActiveFieldId(data.fields[0].field_id);
        }
      } catch (err) {
        console.error('Error fetching form template:', err);
      } finally {
        setLoading(false);
      }
    }

    // Only load from template API if we are in template mode or starting fresh
    if (sourceMode === 'template') {
      loadForm();
    }
  }, [selectedFormId, sourceMode]);

  // Convert DocumentExtractionResponse into an interactive FormTemplate
  const convertExtractionToFormTemplate = (
    doc: DocumentExtractionResponse,
    documentTitle?: string
  ): FormTemplate => {
    const titleEn = documentTitle || `${doc.detected_document_type.replace(/_/g, ' ').toUpperCase()} Form`;
    const titleHi = documentTitle || `${doc.detected_document_type.replace(/_/g, ' ')} प्रपत्र`;

    return {
      id: doc.document_id,
      name_en: titleEn,
      name_hi: titleHi,
      category: doc.detected_document_type.replace(/_/g, ' ').toUpperCase(),
      form_type: 'manual',
      supported_fillable: true,
      description_en: `Analyzed document containing ${doc.fields.length} detected fields extracted via OCR Document Intelligence.`,
      description_hi: `ओसीआर दस्तावेज़ बुद्धिमत्ता द्वारा निकाले गए ${doc.fields.length} फ़ील्ड वाला विश्लेषित दस्तावेज़।`,
      fields: doc.fields.map((f, idx) => ({
        field_id: f.field_key || `field_${idx}`,
        label_en: f.label_en || f.field_key,
        label_hi: f.label_hi || f.label_en,
        explanation_en:
          f.value && !f.value.includes('Blank')
            ? `Extracted value: "${f.value}" (Found in OCR: "${f.source_text || f.label_en}"). Click to review or ask questions.`
            : `Required field in this document. Fill your official ${f.label_en} details accurately.`,
        explanation_hi:
          f.value && !f.value.includes('Blank')
            ? `निकाला गया मान: "${f.value}" (दस्तावेज़ में मिला: "${f.source_text || f.label_hi}")। समीक्षा करें या प्रश्न पूछें।`
            : `इस प्रपत्र पर आवश्यक फ़ील्ड। अपना आधिकारिक ${f.label_hi} विवरण भरें।`,
        field_type: f.is_sensitive ? 'masked' : 'text',
        is_required: true,
        profile_mapping: f.field_key,
        validation_regex: '',
      })),
      checklist_en: [
        'Review all extracted fields carefully before final submission.',
        'Ensure the values match your official supporting proofs identically.',
        'Keep original identity documents ready for official verification.',
      ],
      checklist_hi: [
        'अंतिम रूप से जमा करने से पहले सभी निकाले गए फ़ील्ड की सावधानीपूर्वक समीक्षा करें।',
        'सुनिश्चित करें कि सभी मान आपके आधिकारिक प्रमाणों से बिल्कुल मेल खाते हों।',
        'सत्यापन हेतु मूल पहचान दस्तावेज़ अपने पास तैयार रखें।',
      ],
    };
  };

  // 3. Handle Direct File Upload & OCR Parsing
  const handleFileUpload = async (file: File) => {
    setIsProcessingOcr(true);
    setLoading(true);
    try {
      const result = await api.extractDocument({ file });
      const customTemplate = convertExtractionToFormTemplate(result, file.name);
      setFormTemplate(customTemplate);
      setRawOcrText(result.raw_ocr_text);
      if (customTemplate.fields.length > 0) {
        setActiveFieldId(customTemplate.fields[0].field_id);
      }
      // Add agent notification message
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text_en: `Successfully analyzed "${file.name}"! I extracted ${result.fields.length} form fields. Click any field to understand it.`,
          text_hi: `"${file.name}" का विश्लेषण पूरा हुआ! मैंने ${result.fields.length} फ़ील्ड निकाले हैं। समझने के लिए किसी भी फ़ील्ड पर क्लिक करें।`,
        },
      ]);
    } catch (err) {
      console.error('OCR Extraction failed for uploaded file:', err);
      alert(language === 'en' ? 'Failed to process document OCR.' : 'दस्तावेज़ ओसीआर प्रोसेस करने में विफल।');
    } finally {
      setIsProcessingOcr(false);
      setLoading(false);
    }
  };

  // 4. Handle Selecting a Document from Vault / Recent Uploads
  const handleSelectVaultDoc = async (docId: string) => {
    setSelectedVaultDocId(docId);
    const vaultItem = vaultDocs.find((d) => d.id === docId);
    if (!vaultItem) return;

    setIsProcessingOcr(true);
    setLoading(true);
    try {
      // Extract from sample key corresponding to the doc type
      const sampleKeyMap: Record<string, string> = {
        identity_card: 'sample_aadhaar',
        land_record: 'sample_khatauni',
        income_certificate: 'sample_income_certificate',
      };
      const sampleKey = sampleKeyMap[vaultItem.doc_type] || 'sample_aadhaar';
      const result = await api.extractDocument({ sampleKey });

      const customTemplate = convertExtractionToFormTemplate(
        result,
        language === 'hi' ? vaultItem.name_hi : vaultItem.name_en
      );
      setFormTemplate(customTemplate);
      setRawOcrText(result.raw_ocr_text);
      if (customTemplate.fields.length > 0) {
        setActiveFieldId(customTemplate.fields[0].field_id);
      }
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text_en: `Loaded "${vaultItem.name_en}" from your vault! Click any field to inspect details.`,
          text_hi: `आपकी तिजोरी से "${vaultItem.name_hi}" लोड किया गया! विवरण देखने के लिए फ़ील्ड पर क्लिक करें।`,
        },
      ]);
    } catch (err) {
      console.error('Error loading vault document into workspace:', err);
    } finally {
      setIsProcessingOcr(false);
      setLoading(false);
    }
  };

  const activeField = formTemplate?.fields.find((f) => f.field_id === activeFieldId) || formTemplate?.fields[0];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || userInput;
    if (!textToSend.trim() || isSending) return;

    const userMsg = {
      sender: 'user' as const,
      text_en: textToSend,
      text_hi: textToSend,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setUserInput('');
    setIsSending(true);

    try {
      const response: AssistantMessageResponse = await api.sendAssistantMessage({
        userMessage: textToSend,
        language,
        currentContext: 'form_workspace',
        activeFieldId: activeField?.field_id,
        formId: formTemplate?.id || selectedFormId,
        contextData: {
          field_label_en: activeField?.label_en,
          field_label_hi: activeField?.label_hi,
          form_name_en: formTemplate?.name_en,
          extracted_explanation_en: activeField?.explanation_en,
        },
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text_en: response.response_text_en,
          text_hi: response.response_text_hi,
        },
      ]);
    } catch (err) {
      console.error('Error sending assistant message:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text_en: `Ensure this field matches your official documents. Need help with ${activeField?.label_en}?`,
          text_hi: `सुनिश्चित करें कि यह जानकारी आपके आधिकारिक दस्तावेज़ों से मेल खाती है। क्या आपको ${activeField?.label_hi} के संबंध में और सहायता चाहिए?`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceTranscription = (spokenText: string) => {
    handleSendMessage(spokenText);
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Source Selector Bar: Standard Templates | Vault Documents | Upload Form Now */}
      <div className="p-4 rounded-xl bg-paper-surface border border-paper-sand space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>{language === 'en' ? 'Choose Form / Document to Understand' : 'समझने हेतु प्रपत्र / दस्तावेज़ चुनें'}</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center rounded-lg border border-paper-sand p-0.5 bg-paper-canvas text-xs font-medium">
            <button
              type="button"
              onClick={() => setSourceMode('template')}
              className={`px-3 py-1.5 rounded transition-colors ${
                sourceMode === 'template'
                  ? 'bg-paper-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              📋 {language === 'en' ? 'Standard Forms' : 'मानक फॉर्म'}
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('vault')}
              className={`px-3 py-1.5 rounded transition-colors ${
                sourceMode === 'vault'
                  ? 'bg-paper-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              📂 {language === 'en' ? 'From Vault' : 'तिजोरी से'}
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('upload')}
              className={`px-3 py-1.5 rounded transition-colors ${
                sourceMode === 'upload'
                  ? 'bg-paper-surface text-ink font-semibold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              📤 {language === 'en' ? 'Upload Any Form' : 'नया फॉर्म अपलोड'}
            </button>
          </div>
        </div>

        {/* Mode A: Standard Templates Selector */}
        {sourceMode === 'template' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {availableTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedFormId(t.id);
                  setActiveFieldId(null);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                  selectedFormId === t.id && !rawOcrText
                    ? 'bg-guidance text-white border-guidance shadow-xs'
                    : 'bg-paper-canvas border-paper-sand text-ink hover:border-ink-muted'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'hi' ? t.name_hi : t.name_en}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mode B: From Vault Selector */}
        {sourceMode === 'vault' && (
          <div className="pt-1 space-y-2">
            {vaultDocs.length === 0 ? (
              <div className="p-3 bg-paper-canvas rounded-lg border border-paper-sand text-xs text-ink-muted flex items-center justify-between">
                <span>{language === 'en' ? 'No saved vault documents yet.' : 'तिजोरी में अभी कोई दस्तावेज़ नहीं है।'}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('document_review')}
                  className="text-guidance font-semibold hover:underline"
                >
                  {language === 'en' ? 'Upload in Documents' : 'दस्तावेज़ में जोड़ें'}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vaultDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleSelectVaultDoc(doc.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                      selectedVaultDocId === doc.id
                        ? 'bg-guidance text-white border-guidance shadow-xs'
                        : 'bg-paper-canvas border-paper-sand text-ink hover:border-ink-muted'
                    }`}
                  >
                    <FolderLock className="w-3.5 h-3.5 shrink-0" />
                    <span>{language === 'hi' ? doc.name_hi : doc.name_en}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode C: Drag & Drop / Direct File Upload */}
        {sourceMode === 'upload' && (
          <div className="pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-guidance hover:border-guidance-hover bg-guidance-light/40 rounded-xl p-5 text-center cursor-pointer transition-colors space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-white text-guidance flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div className="font-semibold text-xs text-ink">
                {language === 'en'
                  ? 'Click to upload any PDF or image form (e.g. Gold Loan, Application Form, Agreement)'
                  : 'कोई भी पीडीएफ या फोटो फॉर्म अपलोड करने के लिए यहां क्लिक करें'}
              </div>
              <div className="text-[11px] text-ink-muted">
                {language === 'en'
                  ? 'PaddleOCR + AI Document Intelligence will automatically parse all fields and generate guidance.'
                  : 'ओसीआर और एआई दस्तावेज़ बुद्धिमत्ता सभी फ़ील्ड का विश्लेषण कर तुरंत मार्गदर्शन तैयार करेगी।'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading & OCR Processing Indicator */}
      {(loading || isProcessingOcr) && (
        <div className="p-8 rounded-xl bg-paper-surface border border-paper-sand text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-guidance mx-auto" />
          <div className="font-bold text-sm text-ink">
            {language === 'en'
              ? 'Analyzing document layout & running OCR Intelligence...'
              : 'दस्तावेज़ लेआउट का विश्लेषण एवं ओसीआर प्रोसेसिंग जारी है...'}
          </div>
          <p className="text-xs text-ink-muted">
            {language === 'en'
              ? 'Extracting structured fields and simple-language bilingual explanations...'
              : 'संरचित फ़ील्ड और सरल-भाषा द्विभाषी मार्गदर्शन तैयार किया जा रहा है...'}
          </p>
        </div>
      )}

      {/* Main Workspace View */}
      {!loading && !isProcessingOcr && formTemplate && (
        <>
          {/* Top Form Header & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-paper-sand">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>{formTemplate.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-0.5">
                {language === 'en' || showOriginal ? formTemplate.name_en : formTemplate.name_hi}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                {language === 'en' || showOriginal ? formTemplate.description_en : formTemplate.description_hi}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {rawOcrText && (
                <button
                  type="button"
                  onClick={() => setShowRawOcrInspector((prev) => !prev)}
                  className="px-3 py-2 rounded-lg bg-paper-surface border border-paper-sand hover:border-ink-muted text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-guidance" />
                  <span>{showRawOcrInspector ? (language === 'en' ? 'Hide OCR' : 'ओसीआर छुपाएं') : (language === 'en' ? 'View Raw OCR' : 'ओसीआर देखें')}</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('eligibility')}
                className="px-3 py-2 rounded-lg bg-paper-surface border border-paper-sand hover:border-ink-muted text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-guidance" />
                <span>{language === 'en' ? 'Check Eligibility' : 'पात्रता जांचें'}</span>
              </button>

              <button
                onClick={() => setActiveTab('form_readiness')}
                className="px-4 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'en' ? 'Prepare Form Plan' : 'तैयारी योजना देखें'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Raw OCR Text Inspector Drawer */}
          {showRawOcrInspector && rawOcrText && (
            <div className="p-4 rounded-xl bg-paper-surface border border-paper-sand space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span>{language === 'en' ? 'Raw Extracted Document OCR Text:' : 'निकाला गया मूल ओसीआर टेक्स्ट:'}</span>
                <span className="text-[10px] text-ink-muted font-mono">{rawOcrText.length} characters</span>
              </div>
              <pre className="p-3 bg-paper-canvas rounded-lg border border-paper-sand text-[11px] font-mono text-ink-muted max-h-48 overflow-y-auto whitespace-pre-wrap">
                {rawOcrText}
              </pre>
            </div>
          )}

          {/* Mobile Segmented Switch (Form vs Guidance) */}
          <div className="lg:hidden flex rounded-lg border border-paper-sand p-1 bg-paper-canvas text-xs font-semibold">
            <button
              onClick={() => setMobileTab('form')}
              className={`flex-1 py-1.5 rounded text-center transition-colors ${
                mobileTab === 'form' ? 'bg-paper-surface text-ink shadow-xs' : 'text-ink-muted'
              }`}
            >
              {language === 'en' ? 'Interactive Form View' : 'इंटरएक्टिव फॉर्म दृश्य'}
            </button>
            <button
              onClick={() => setMobileTab('guidance')}
              className={`flex-1 py-1.5 rounded text-center transition-colors ${
                mobileTab === 'guidance' ? 'bg-paper-surface text-ink shadow-xs' : 'text-ink-muted'
              }`}
            >
              {language === 'en' ? 'Bilingual Guidance & Assistant' : 'द्विभाषी मार्गदर्शन एवं सहायक'}
            </button>
          </div>

          {/* Asymmetric 42/58 Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Pane (42% on desktop): High-Contrast Visual Form Document Preview */}
            <div
              className={`lg:col-span-5 space-y-4 ${
                mobileTab === 'form' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-paper-sand">
                  <span className="text-xs font-mono font-semibold text-ink-muted">
                    FORM: {formTemplate.id.toUpperCase()}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-guidance-light text-guidance font-semibold">
                    {formTemplate.fields.length} {language === 'en' ? 'Fields Detected' : 'फ़ील्ड मिले'}
                  </span>
                </div>

                {/* Document Emulation Box */}
                <div className="p-4 bg-paper-canvas rounded-lg border-2 border-paper-sand font-mono text-xs space-y-3 max-h-[560px] overflow-y-auto">
                  <div className="text-center font-bold pb-2 border-b border-paper-darkSand text-ink">
                    {formTemplate.name_en.toUpperCase()}
                  </div>

                  {formTemplate.fields.map((f, idx) => {
                    const isActive = f.field_id === activeFieldId;
                    const userVal = profile[f.profile_mapping as keyof typeof profile] as any;
                    const displayVal = userVal?.masked_value || userVal?.value || (f.explanation_en.includes('Extracted value') ? '✓ Extracted in OCR' : '_______________');

                    return (
                      <div
                        key={f.field_id}
                        onClick={() => {
                          setActiveFieldId(f.field_id);
                          setMobileTab('guidance');
                        }}
                        className={`p-2.5 rounded border transition-all cursor-pointer ${
                          isActive
                            ? 'border-guidance bg-guidance-light/80 ring-2 ring-guidance shadow-xs'
                            : 'border-paper-sand hover:border-ink-muted bg-paper-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink truncate mr-2">
                            {idx + 1}. {f.label_en}:
                          </span>
                          {f.is_required && (
                            <span className="text-[10px] text-error-brick font-sans font-bold shrink-0">*</span>
                          )}
                        </div>
                        <div className="mt-1 text-ink-muted truncate text-[11px]">
                          {String(displayVal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-ink-muted italic">
                  {language === 'en'
                    ? 'Tip: Click on any field above to focus guidance and ask contextual questions.'
                    : 'सुझाव: संबंधित मार्गदर्शन देखने के लिए ऊपर किसी भी फ़ील्ड पर क्लिक करें।'}
                </p>
              </div>
            </div>

            {/* Right Pane (58% on desktop): Field Guidance & Embedded Context Assistant */}
            <div
              className={`lg:col-span-7 space-y-5 ${
                mobileTab === 'guidance' ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Active Field Guidance Card */}
              {activeField && (
                <div className="p-5 rounded-xl bg-paper-surface border-2 border-guidance shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-guidance"></span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-guidance">
                        {language === 'en' ? 'Active Field in Focus' : 'सक्रिय फ़ील्ड'}
                      </span>
                    </div>
                    <OriginalTextToggle
                      showOriginal={showOriginal}
                      onToggle={() => setShowOriginal(!showOriginal)}
                    />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-ink">
                      {language === 'en' || showOriginal ? activeField.label_en : activeField.label_hi}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                      {language === 'en' || showOriginal
                        ? activeField.explanation_en
                        : activeField.explanation_hi}
                    </p>
                  </div>

                  {/* Verified Value Preview if available in Profile */}
                  {profile[activeField.profile_mapping as keyof typeof profile] && (
                    <div className="p-3 rounded-lg bg-guidance-light border border-guidance-border text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-guidance">
                          {language === 'en' ? 'Confirmed Profile Value:' : 'पुष्टीकृत प्रोफ़ाइल मान:'}
                        </span>
                        <div className="font-mono text-ink font-semibold">
                          {String(
                            (profile[activeField.profile_mapping as keyof typeof profile] as any)?.masked_value ||
                            (profile[activeField.profile_mapping as keyof typeof profile] as any)?.value
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-guidance bg-white px-2 py-0.5 rounded border border-guidance-border">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Embedded Contextual Guide & Voice Waveform */}
              <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-paper-sand">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-guidance" />
                    <h4 className="font-semibold text-sm text-ink">
                      {language === 'en' ? 'Embedded Field Assistant' : 'एम्बेडेड फ़ील्ड सहायक'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    {language === 'en' ? 'Type or Speak' : 'लिखें या बोलें'}
                  </span>
                </div>

                {/* Voice Input Waveform */}
                <VoiceWaveform onTranscription={handleVoiceTranscription} />

                {/* Chat History Messages */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-guidance text-white ml-8'
                          : 'bg-paper-canvas text-ink border border-paper-sand mr-6'
                      }`}
                    >
                      <p>{language === 'en' || showOriginal ? msg.text_en : msg.text_hi}</p>
                    </div>
                  ))}
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? `Ask anything about ${activeField?.label_en || 'this form'}...`
                        : `${activeField?.label_hi || 'इस फॉर्म'} के बारे में कुछ भी पूछें...`
                    }
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-surface text-ink focus:border-guidance outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !userInput.trim()}
                    className="px-4 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Ask' : 'पूछें'}</span>
                  </button>
                </form>
              </div>

              <SafetyDisclaimer />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
