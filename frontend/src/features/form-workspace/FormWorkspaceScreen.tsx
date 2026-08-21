import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Sparkles,
  Send,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { FormTemplate, AssistantMessageResponse } from '../../types';
import { OriginalTextToggle } from '../../components/common/OriginalTextToggle';
import { VoiceWaveform } from '../../components/common/VoiceWaveform';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';

export const FormWorkspaceScreen: React.FC = () => {
  const {
    language,
    setActiveTab,
    selectedFormId,
    activeFieldId,
    setActiveFieldId,
    profile,
  } = useApp();

  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'guidance'>('guidance');

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

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      try {
        const data = await api.getFormTemplate(selectedFormId);
        setFormTemplate(data);
        if (data.fields.length > 0 && !activeFieldId) {
          setActiveFieldId(data.fields[0].field_id);
        }
      } catch (err) {
        console.error('Error fetching form template:', err);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [selectedFormId]);

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
        formId: selectedFormId,
        contextData: {
          field_label_en: activeField?.label_en,
          field_label_hi: activeField?.label_hi,
          form_name_en: formTemplate?.name_en,
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

  if (loading || !formTemplate) {
    return (
      <div className="max-w-content mx-auto px-6 py-16 text-center text-ink-muted">
        {language === 'en' ? 'Loading form workspace...' : 'फॉर्म कार्यक्षेत्र लोड हो रहा है...'}
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 space-y-6">
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

      {/* Mobile Segmented Switch (Form vs Guidance) */}
      <div className="lg:hidden flex rounded-lg border border-paper-sand p-1 bg-paper-canvas text-xs font-semibold">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-1.5 rounded text-center transition-colors ${
            mobileTab === 'form' ? 'bg-paper-surface text-ink shadow-xs' : 'text-ink-muted'
          }`}
        >
          {language === 'en' ? 'Original Form View' : 'मूल फॉर्म दृश्य'}
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
              <span className="text-[11px] px-2 py-0.5 rounded bg-paper-canvas border border-paper-sand text-ink-muted">
                {language === 'en' ? 'Interactive Preview' : 'इंटरएक्टिव पूर्वावलोकन'}
              </span>
            </div>

            {/* Document Emulation Box */}
            <div className="p-4 bg-paper-canvas rounded-lg border-2 border-paper-sand font-mono text-xs space-y-3">
              <div className="text-center font-bold pb-2 border-b border-paper-darkSand text-ink">
                GOVERNMENT APPLICATION FORM
              </div>

              {formTemplate.fields.map((f, idx) => {
                const isActive = f.field_id === activeFieldId;
                const userVal = profile[f.profile_mapping as keyof typeof profile] as any;
                const displayVal = userVal?.masked_value || userVal?.value || '_______________';

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
                      <span className="font-semibold text-ink">
                        {idx + 1}. {f.label_en}:
                      </span>
                      {f.is_required && (
                        <span className="text-[10px] text-error-brick font-sans font-bold">*</span>
                      )}
                    </div>
                    <div className="mt-1 text-ink-muted truncate">
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

              {/* Verified Value Preview if available */}
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
    </div>
  );
};
