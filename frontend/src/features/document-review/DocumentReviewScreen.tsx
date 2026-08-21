import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Upload,
  FileCheck,
  Eye,
  EyeOff,
  FolderLock,
  ArrowRight,
  Edit2,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { DocumentExtractionResponse, VaultDocumentItem } from '../../types';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';
import { OriginalTextToggle } from '../../components/common/OriginalTextToggle';

export const DocumentReviewScreen: React.FC = () => {
  const { language, setActiveTab, applyExtractedDocument, saveToVault } = useApp();

  const [selectedSample, setSelectedSample] = useState<string>('sample_aadhaar');
  const [extractionResult, setExtractionResult] = useState<DocumentExtractionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSensitiveMasks, setShowSensitiveMasks] = useState<Record<string, boolean>>({});
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [savedVaultSuccess, setSavedVaultSuccess] = useState(false);

  const runExtraction = async (sampleKey: string, file?: File) => {
    setLoading(true);
    setSavedVaultSuccess(false);
    try {
      const res = await api.extractDocument({ sampleKey: file ? undefined : sampleKey, file });
      setExtractionResult(res);
      const initialEdits: Record<string, any> = {};
      res.fields.forEach((f) => {
        initialEdits[f.field_key] = f.value;
      });
      setEditValues(initialEdits);
    } catch (err) {
      console.error('Document extraction error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runExtraction(selectedSample);
  }, [selectedSample]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      runExtraction('', e.target.files[0]);
    }
  };

  const toggleMask = (key: string) => {
    setShowSensitiveMasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveFieldEdit = (fieldKey: string) => {
    if (extractionResult) {
      const updatedFields = extractionResult.fields.map((f) => {
        if (f.field_key === fieldKey) {
          return { ...f, value: editValues[fieldKey], user_edited: true };
        }
        return f;
      });
      setExtractionResult({ ...extractionResult, fields: updatedFields });
    }
    setEditingFieldKey(null);
  };

  const handleApplyToProfile = () => {
    if (extractionResult) {
      applyExtractedDocument(extractionResult);
      setActiveTab('form_readiness');
    }
  };

  const handleSaveToVault = async () => {
    if (extractionResult) {
      const newDoc: VaultDocumentItem = {
        id: extractionResult.document_id,
        doc_type: extractionResult.detected_document_type,
        name_en:
          extractionResult.detected_document_type === 'identity_card'
            ? 'Aadhaar Identity Proof (Synthetic)'
            : extractionResult.detected_document_type === 'land_record'
            ? 'Khatauni Land Record (Synthetic)'
            : 'Income Certificate (Synthetic)',
        name_hi:
          extractionResult.detected_document_type === 'identity_card'
            ? 'आधार पहचान पत्र (सिंथेटिक)'
            : extractionResult.detected_document_type === 'land_record'
            ? 'खतौनी भू-अभिलेख (सिंथेटिक)'
            : 'आय प्रमाण पत्र (सिंथेटिक)',
        extracted_fields_count: extractionResult.fields.length,
        saved_at: new Date().toISOString(),
        is_synthetic_verified: true,
        tags: [extractionResult.detected_document_type, 'Verified'],
      };
      await saveToVault(newDoc);
      setSavedVaultSuccess(true);
      setTimeout(() => setSavedVaultSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-paper-sand">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Module 1: Document Intelligence' : 'मॉड्यूल १: दस्तावेज़ बुद्धिमत्ता'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-0.5">
            {language === 'en' ? 'OCR & Structured Extraction Review' : 'दस्तावेज़ निष्कर्षण एवं सत्यापन'}
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {language === 'en'
              ? 'Review candidate fields extracted from your supporting documents before reusing them.'
              : 'दस्तावेज़ से निकाली गई जानकारी की समीक्षा करें और पुष्टि के बाद ही आगे उपयोग करें।'}
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink-muted">
            {language === 'en' ? 'Synthetic Demo Sample:' : 'डेमो नमूना चुनें:'}
          </label>
          <select
            value={selectedSample}
            onChange={(e) => setSelectedSample(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-surface font-medium text-ink focus:border-guidance outline-hidden"
          >
            <option value="sample_aadhaar">Synthetic Aadhaar Card</option>
            <option value="sample_khatauni">Synthetic Khatauni Land Record</option>
            <option value="sample_income_cert">Synthetic Income Certificate</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout: Document OCR Preview & Extracted Fields Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Raw OCR text inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-paper-sand">
              <span className="text-xs font-bold text-ink">
                {language === 'en' ? 'Supporting Document Source' : 'सहायक दस्तावेज़ स्रोत'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-canvas text-ink-muted">
                {extractionResult?.detected_document_type || 'OCR Engine'}
              </span>
            </div>

            {/* Custom Upload Drop Area */}
            <div className="p-4 rounded-lg border-2 border-dashed border-paper-sand hover:border-guidance transition-colors text-center space-y-2 bg-paper-canvas">
              <Upload className="w-6 h-6 text-guidance mx-auto" />
              <div className="text-xs font-semibold text-ink">
                {language === 'en' ? 'Upload Custom PDF or Image' : 'कस्टम पीडीएफ अथवा फोटो अपलोड करें'}
              </div>
              <p className="text-[11px] text-ink-muted">
                {language === 'en'
                  ? 'Supports PDF, JPG, PNG (Synthetic test files only)'
                  : 'पीडीएफ, जेपीजी, पीएनजी समर्थित (केवल परीक्षण फ़ाइलें)'}
              </p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="text-xs text-ink-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-guidance file:text-white hover:file:bg-guidance-hover cursor-pointer"
              />
            </div>

            {/* Raw OCR Grounding Inspector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">
                {language === 'en' ? 'Extracted Raw OCR Text:' : 'मूल ओसीआर टेक्स्ट:'}
              </label>
              <div className="p-3 bg-paper-canvas rounded-lg border border-paper-sand font-mono text-[11px] text-ink-muted max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {loading ? 'Running OCR parsing...' : extractionResult?.raw_ocr_text || 'No text extracted'}
              </div>
            </div>

            {/* Quality flags */}
            {extractionResult?.quality_flags && extractionResult.quality_flags.length > 0 && (
              <div className="p-2.5 rounded bg-paper-canvas border border-paper-sand text-[11px] text-ink-muted space-y-1">
                <div className="font-semibold text-ink">
                  {language === 'en' ? 'Quality & Security Flags:' : 'गुणवत्ता एवं सुरक्षा समीक्षा:'}
                </div>
                {extractionResult.quality_flags.map((q, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-guidance"></span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted Structured Fields Review */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-paper-sand">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-guidance" />
                <h4 className="font-bold text-sm text-ink">
                  {language === 'en' ? 'Structured Candidate Fields' : 'संरचित फ़ील्ड सूची'}
                </h4>
              </div>
              <OriginalTextToggle
                showOriginal={showOriginal}
                onToggle={() => setShowOriginal(!showOriginal)}
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                {language === 'en' ? 'Extracting schema-bound fields...' : 'फ़ील्ड निकाले जा रहे हैं...'}
              </div>
            ) : (
              <div className="space-y-3">
                {extractionResult?.fields.map((f) => {
                  const isEditing = editingFieldKey === f.field_key;
                  const isMasked = f.is_sensitive && !showSensitiveMasks[f.field_key];
                  const displayValue = isMasked
                    ? f.masked_value || 'XXXX XXXX ' + String(f.value).slice(-4)
                    : editValues[f.field_key] !== undefined
                    ? editValues[f.field_key]
                    : f.value;

                  return (
                    <div
                      key={f.field_key}
                      className="p-3.5 rounded-lg border border-paper-sand bg-paper-canvas/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-muted">
                          {language === 'en' || showOriginal ? f.label_en : f.label_hi}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-paper-surface border border-paper-sand text-guidance font-semibold">
                            {Math.round(f.confidence * 100)}% Conf
                          </span>
                          {f.is_sensitive && (
                            <button
                              type="button"
                              onClick={() => toggleMask(f.field_key)}
                              className="text-ink-muted hover:text-ink p-1"
                              title="Toggle sensitive masking"
                            >
                              {isMasked ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Value Display / Edit Input */}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValues[f.field_key] || ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, [f.field_key]: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1 text-xs rounded border border-guidance bg-white text-ink"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveFieldEdit(f.field_key)}
                            className="p-1.5 rounded bg-guidance text-white hover:bg-guidance-hover"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-ink font-mono">
                            {String(displayValue)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingFieldKey(f.field_key)}
                            className="text-ink-muted hover:text-ink text-xs flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{language === 'en' ? 'Edit' : 'संपादित करें'}</span>
                          </button>
                        </div>
                      )}

                      {/* Source Text Grounding Snippet */}
                      {f.source_text && (
                        <div className="text-[10px] text-ink-muted bg-paper-surface p-1.5 rounded border border-paper-sand truncate">
                          <span className="font-semibold">{language === 'en' ? 'Source:' : 'स्रोत:'}</span>{' '}
                          "{f.source_text}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions: Save to Vault & Apply to Active Profile */}
            <div className="pt-4 border-t border-paper-sand flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSaveToVault}
                className="px-4 py-2.5 rounded-lg border border-paper-sand bg-paper-surface hover:bg-paper-canvas text-xs font-semibold text-ink flex items-center justify-center gap-2 transition-colors"
              >
                <FolderLock className="w-4 h-4 text-guidance" />
                <span>
                  {savedVaultSuccess
                    ? language === 'en'
                      ? 'Saved to Vault ✓'
                      : 'तिजोरी में सहेजा गया ✓'
                    : language === 'en'
                    ? 'Save Document to Vault'
                    : 'दस्तावेज़ तिजोरी में सहेजें'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleApplyToProfile}
                className="px-5 py-2.5 rounded-lg bg-guidance hover:bg-guidance-hover text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-xs transition-colors flex-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === 'en'
                    ? 'Confirm & Apply to Form Readiness'
                    : 'पुष्टि करें एवं फॉर्म तैयारी में लागू करें'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          <SafetyDisclaimer />
        </div>
      </div>
    </div>
  );
};
