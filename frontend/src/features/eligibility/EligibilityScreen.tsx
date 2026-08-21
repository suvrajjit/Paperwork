import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Upload,
} from 'lucide-react';
import { api } from '../../services/api';
import { SchemeRule, EligibilityEvaluationResponse } from '../../types';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';
import { OriginalTextToggle } from '../../components/common/OriginalTextToggle';

export const EligibilityScreen: React.FC = () => {
  const {
    language,
    setActiveTab,
    selectedSchemeId,
    setSelectedSchemeId,
    profile,
    updateProfileField,
    availableDocumentTypes,
  } = useApp();

  const [schemes, setSchemes] = useState<SchemeRule[]>([]);
  const [evaluation, setEvaluation] = useState<EligibilityEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [showOriginal, setShowOriginal] = useState(false);

  const [tempInputs, setTempInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadSchemesList() {
      try {
        const list = await api.getSchemes();
        setSchemes(list);
      } catch (err) {
        console.error('Error fetching schemes:', err);
      }
    }
    loadSchemesList();
  }, []);

  const runEvaluation = async () => {
    try {
      const res = await api.evaluateEligibility(
        selectedSchemeId,
        profile,
        availableDocumentTypes,
        language
      );
      setEvaluation(res);
    } catch (err) {
      console.error('Error running eligibility evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, [selectedSchemeId, profile]);

  const toggleExpand = (critId: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [critId]: !prev[critId] }));
  };

  const handleUpdateFact = (fieldKey: string) => {
    const val = tempInputs[fieldKey];
    if (val !== undefined && val.trim() !== '') {
      const parsed = isNaN(Number(val)) ? val : Number(val);
      updateProfileField(fieldKey, parsed, 'user_input');
      setTempInputs((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const currentScheme = schemes.find((s) => s.id === selectedSchemeId) || schemes[0];

  const statusBadge = (status: 'likely_match' | 'not_a_match' | 'needs_information') => {
    if (status === 'likely_match') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-guidance-light text-guidance text-xs font-bold border border-guidance-border">
          <CheckCircle2 className="w-4 h-4" />
          <span>{language === 'en' ? 'Likely Match' : 'संभावित पात्र'}</span>
        </span>
      );
    }
    if (status === 'not_a_match') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-light text-error-brick text-xs font-bold border border-error-border">
          <XCircle className="w-4 h-4" />
          <span>{language === 'en' ? 'Does Not Match Criteria' : 'शर्तें पूरी नहीं होतीं'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-review-light text-review-amber text-xs font-bold border border-review-border">
        <AlertTriangle className="w-4 h-4" />
        <span>{language === 'en' ? 'Information Needed' : 'अतिरिक्त जानकारी अपेक्षित'}</span>
      </span>
    );
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Scheme Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-paper-sand">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Module 2: Eligibility Copilot' : 'मॉड्यूल २: पात्रता सह-पायलट'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-0.5">
            {language === 'en' ? 'Transparent Eligibility Evaluation' : 'पारदर्शी पात्रता मूल्यांकन'}
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {language === 'en'
              ? 'Evaluates your confirmed profile against official rules with full citations.'
              : 'आधिकारिक नियमों और संदर्भों के साथ आपकी प्रोफ़ाइल की निष्पक्ष जांच।'}
          </p>
        </div>

        {/* Scheme Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-ink-muted">
            {language === 'en' ? 'Target Scheme:' : 'लक्ष्य योजना:'}
          </label>
          <select
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-paper-sand bg-paper-surface font-medium text-ink focus:border-guidance outline-hidden"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {language === 'en' ? s.name_en : s.name_hi}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-muted">
          {language === 'en' ? 'Evaluating criteria...' : 'पात्रता मानदंडों की जांच हो रही है...'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Banner Card */}
          {evaluation && (
            <div className="p-6 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    {language === 'en' ? 'Evaluation Result' : 'मूल्यांकन परिणाम'}
                  </div>
                  <h3 className="text-lg font-bold text-ink">
                    {evaluation.scheme_name}
                  </h3>
                </div>
                <div>{statusBadge(evaluation.status)}</div>
              </div>

              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                {language === 'en' || showOriginal
                  ? evaluation.summary_explanation_en
                  : evaluation.summary_explanation_hi}
              </p>

              {/* Next Actions Checklist */}
              <div className="p-3.5 rounded-lg bg-paper-canvas border border-paper-sand space-y-2">
                <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-guidance" />
                  <span>{language === 'en' ? 'Recommended Next Steps:' : 'अनुशंसित अगले कदम:'}</span>
                </div>
                <ul className="text-xs text-ink-muted space-y-1 pl-4 list-disc">
                  {(language === 'en' || showOriginal
                    ? evaluation.next_actions_en
                    : evaluation.next_actions_hi
                  ).map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Transparent Criteria Checklist */}
          <div className="p-6 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-sand">
              <h4 className="font-bold text-sm text-ink">
                {language === 'en' ? 'Condition-by-Condition Rule Check' : 'नियम-वार शर्त जांच'}
              </h4>
              <OriginalTextToggle
                showOriginal={showOriginal}
                onToggle={() => setShowOriginal(!showOriginal)}
              />
            </div>

            <div className="space-y-3">
              {evaluation?.criteria_evaluations.map((crit) => {
                const isExpanded = !!expandedCriteria[crit.criterion_id];

                return (
                  <div
                    key={crit.criterion_id}
                    className="p-4 rounded-lg border border-paper-sand bg-paper-canvas/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {crit.status === 'met' && (
                          <CheckCircle2 className="w-4 h-4 text-guidance shrink-0 mt-0.5" />
                        )}
                        {crit.status === 'not_met' && (
                          <XCircle className="w-4 h-4 text-error-brick shrink-0 mt-0.5" />
                        )}
                        {crit.status === 'needs_information' && (
                          <AlertTriangle className="w-4 h-4 text-review-amber shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-semibold text-xs sm:text-sm text-ink">
                            {language === 'en' || showOriginal ? crit.label_en : crit.label_hi}
                          </span>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {language === 'en' || showOriginal ? crit.reason_en : crit.reason_hi}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(crit.criterion_id)}
                        className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 shrink-0 p-1"
                      >
                        <span className="hidden sm:inline text-[11px]">
                          {language === 'en' ? 'Why am I seeing this?' : 'यह नियम क्यों?'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Expandable Official Citation Section */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-paper-sand text-xs text-ink-muted bg-paper-surface p-3 rounded space-y-1">
                        <div className="font-semibold text-ink">
                          {language === 'en' ? 'Official Rule Citation:' : 'आधिकारिक नियम संदर्भ:'}
                        </div>
                        <p className="font-mono text-[11px] text-ink leading-relaxed">
                          {crit.rule_source_citation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Missing Facts & Documents Input Card */}
          {evaluation && (evaluation.missing_fields.length > 0 || evaluation.missing_documents.length > 0) && (
            <div className="p-6 rounded-xl bg-review-light/50 border border-review-border space-y-4">
              <div className="flex items-center gap-2 text-review-amber">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-sm text-ink">
                  {language === 'en'
                    ? 'Fill Missing Details to Complete Evaluation'
                    : 'मूल्यांकन पूरा करने के लिए छूटी हुई जानकारी भरें'}
                </h4>
              </div>

              {/* Missing Fields Input */}
              {evaluation.missing_fields.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-ink-muted">
                    {language === 'en' ? 'Missing Profile Values:' : 'अपेक्षित प्रोफ़ाइल मान:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluation.missing_fields.map((mf) => (
                      <div
                        key={mf.field_key}
                        className="p-3 rounded-lg bg-paper-surface border border-paper-sand flex flex-col justify-between gap-2"
                      >
                        <label className="text-xs font-semibold text-ink">
                          {language === 'en' ? mf.label_en : mf.label_hi}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={language === 'en' ? 'Enter value...' : 'मान दर्ज करें...'}
                            value={tempInputs[mf.field_key] || ''}
                            onChange={(e) =>
                              setTempInputs({ ...tempInputs, [mf.field_key]: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1.5 text-xs rounded border border-paper-sand bg-paper-canvas text-ink"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateFact(mf.field_key)}
                            className="px-3 py-1.5 text-xs font-semibold rounded bg-guidance text-white hover:bg-guidance-hover"
                          >
                            {language === 'en' ? 'Save' : 'सहेजें'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Documents CTA */}
              {evaluation.missing_documents.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-review-border">
                  <span className="text-xs font-semibold text-ink-muted">
                    {language === 'en' ? 'Required Supporting Documents:' : 'आवश्यक सहायक दस्तावेज़:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.missing_documents.map((md) => (
                      <div
                        key={md.doc_type}
                        className="px-3 py-2 rounded-lg bg-paper-surface border border-paper-sand text-xs flex items-center justify-between gap-3"
                      >
                        <span className="font-medium text-ink">
                          {language === 'en' ? md.name_en : md.name_hi}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('document_review')}
                          className="text-xs font-semibold text-guidance hover:underline flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{language === 'en' ? 'Upload / Review' : 'अपलोड करें'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation CTAs */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('document_review')}
              className="px-4 py-2.5 rounded-lg border border-paper-sand bg-paper-surface hover:bg-paper-canvas text-xs font-semibold text-ink flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{language === 'en' ? 'Review Supporting Documents' : 'दस्तावेज़ समीक्षा पर जाएं'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('form_readiness')}
              className="px-5 py-2.5 rounded-lg bg-guidance hover:bg-guidance-hover text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{language === 'en' ? 'Proceed to Form Readiness Plan' : 'फॉर्म तत्परता योजना पर जाएं'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <SafetyDisclaimer sourceUrl={currentScheme?.official_source_url} />
        </div>
      )}
    </div>
  );
};
