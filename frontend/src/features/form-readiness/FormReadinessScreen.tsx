import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  FileDown,
  Edit2,
  Check,
  ClipboardList,
} from 'lucide-react';
import { api } from '../../services/api';
import { FormReadinessResponse, FormFieldGuidance } from '../../types';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';
import { OriginalTextToggle } from '../../components/common/OriginalTextToggle';

export const FormReadinessScreen: React.FC = () => {
  const { language, selectedFormId, profile, updateProfileField } = useApp();

  const [plan, setPlan] = useState<FormReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.prepareFormPlan(selectedFormId, profile, language);
      setPlan(res);
    } catch (err) {
      console.error('Error fetching form plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [selectedFormId, profile]);

  const handleDownloadDraftPdf = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await api.downloadDraftPdf(selectedFormId, profile, language);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFormId}_readiness_draft.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download draft PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveInlineEdit = (field: FormFieldGuidance) => {
    if (editValue.trim() !== '') {
      updateProfileField(field.field_id, editValue, 'user_manual_override');
    }
    setEditingFieldId(null);
  };

  const toggleChecklist = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-paper-sand">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Module 3: Form Readiness Kit' : 'मॉड्यूल ३: फॉर्म तत्परता किट'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-0.5">
            {language === 'en' ? 'Field-by-Field Preparation Plan' : 'फ़ील्ड-वार फॉर्म तैयारी योजना'}
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {language === 'en'
              ? 'Clear, verified guidance on exactly what to write in every line of your physical or digital form.'
              : 'आपके भौतिक अथवा डिजिटल फॉर्म की प्रत्येक पंक्ति में क्या लिखना है, इसका सटीक व सत्यापित निर्देश।'}
          </p>
        </div>

        {/* Action Button: Download Draft PDF */}
        <div className="flex items-center gap-3">
          <OriginalTextToggle
            showOriginal={showOriginal}
            onToggle={() => setShowOriginal(!showOriginal)}
          />

          <button
            type="button"
            onClick={handleDownloadDraftPdf}
            disabled={downloadingPdf || loading}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-guidance hover:bg-guidance-hover text-xs font-semibold text-white flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>
              {downloadingPdf
                ? language === 'en'
                  ? 'Generating PDF...'
                  : 'पीडीएफ तैयार हो रहा है...'
                : language === 'en'
                ? 'Download Draft PDF'
                : 'तैयारी ड्राफ्ट पीडीएफ डाउनलोड करें'}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink-muted">
          {language === 'en' ? 'Compiling form readiness plan...' : 'तैयारी योजना संकलित हो रही है...'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Progress Header */}
          {plan && (
            <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  {language === 'en' ? 'Target Form' : 'लक्ष्य फॉर्म'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  {language === 'en' || showOriginal ? plan.form_name_en : plan.form_name_hi}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center sm:text-right">
                  <div className="text-xs text-ink-muted">
                    {language === 'en' ? 'Fields Ready' : 'तैयार फ़ील्ड'}
                  </div>
                  <div className="text-lg font-bold font-mono text-guidance">
                    {plan.completed_fields} / {plan.total_fields}
                  </div>
                </div>

                {/* Progress pill */}
                <div className="px-3 py-1.5 rounded-full bg-guidance-light border border-guidance-border text-guidance text-xs font-bold">
                  {Math.round((plan.completed_fields / plan.total_fields) * 100)}% Complete
                </div>
              </div>
            </div>
          )}

          {/* Sequential Numbered Field Guidance Plan */}
          <div className="p-6 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-sand">
              <h4 className="font-bold text-sm text-ink">
                {language === 'en' ? 'Sequential Completion Guide' : 'क्रमबद्ध फ़ील्ड भरने की मार्गदर्शिका'}
              </h4>
              <span className="text-xs text-ink-muted font-mono">
                {plan?.field_guidance_list.length} {language === 'en' ? 'Steps' : 'चरण'}
              </span>
            </div>

            <div className="space-y-4">
              {plan?.field_guidance_list.map((field, idx) => {
                const isEditing = editingFieldId === field.field_id;
                const isReady = field.completion_state === 'ready';

                return (
                  <div
                    key={field.field_id}
                    className={`p-4 rounded-xl border transition-all ${
                      isReady
                        ? 'border-paper-sand bg-paper-surface'
                        : 'border-review-border bg-review-light/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-paper-canvas border border-paper-sand text-ink text-xs font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sm text-ink">
                            {language === 'en' || showOriginal ? field.label_en : field.label_hi}
                          </span>
                          {field.is_required && (
                            <span className="text-error-brick text-xs font-bold">*</span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted pl-8 leading-relaxed">
                          {language === 'en' || showOriginal
                            ? field.explanation_en
                            : field.explanation_hi}
                        </p>
                      </div>

                      {/* Source badge */}
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded shrink-0 self-start ${
                          field.value_source === 'document_confirmed'
                            ? 'bg-guidance-light text-guidance border border-guidance-border'
                            : field.value_source === 'user_confirmed' || field.value_source === 'user_manual_override'
                            ? 'bg-paper-canvas text-ink border border-paper-sand'
                            : 'bg-review-light text-review-amber border border-review-border'
                        }`}
                      >
                        {language === 'en' || showOriginal
                          ? field.source_description_en
                          : field.source_description_hi}
                      </span>
                    </div>

                    {/* Manual Writing Callout Box */}
                    <div className="mt-3 ml-8 p-3 rounded-lg bg-paper-canvas border border-paper-sand flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-guidance">
                          {language === 'en' ? 'Write This in the Form:' : 'फॉर्म में यह लिखें:'}
                        </span>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-2 py-1 text-xs rounded border border-guidance bg-white text-ink font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(field)}
                              className="p-1 rounded bg-guidance text-white hover:bg-guidance-hover"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono text-xs sm:text-sm font-bold text-ink">
                            {field.proposed_value !== null && field.proposed_value !== undefined
                              ? String(field.proposed_value)
                              : language === 'en'
                              ? '[Needed — Enter manually]'
                              : '[अपेक्षित — स्वयं भरें]'}
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFieldId(field.field_id);
                            setEditValue(field.proposed_value || '');
                          }}
                          className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 self-start sm:self-auto"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{language === 'en' ? 'Edit value' : 'मान बदलें'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pre-Submission Attachments Checklist */}
          {plan && (
            <div className="p-6 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-paper-sand">
                <ClipboardList className="w-4 h-4 text-guidance" />
                <h4 className="font-bold text-sm text-ink">
                  {language === 'en'
                    ? 'Pre-Submission Attachments & Verification Checklist'
                    : 'जमा करने से पहले आवश्यक संलग्नक एवं सत्यापन सूची'}
                </h4>
              </div>

              <div className="space-y-2.5">
                {(language === 'en' || showOriginal ? plan.checklist_en : plan.checklist_hi).map(
                  (item, idx) => {
                    const isChecked = !!checkedItems[idx];
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleChecklist(idx)}
                        className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-guidance-light/40 border-guidance-border'
                            : 'bg-paper-canvas border-paper-sand'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 text-guidance rounded border-paper-sand focus:ring-guidance"
                        />
                        <span
                          className={`text-xs leading-relaxed ${
                            isChecked ? 'text-ink line-through font-medium' : 'text-ink'
                          }`}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <SafetyDisclaimer />
        </div>
      )}
    </div>
  );
};
