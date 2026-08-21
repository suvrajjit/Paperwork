import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  FileText,
  FileCheck2,
  Mic,
  Volume2,
} from 'lucide-react';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';

export const WelcomeScreen: React.FC = () => {
  const { language, setLanguage, signInGuest } = useApp();

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 sm:py-16 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Mission & Onboarding Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-guidance-light text-guidance text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {language === 'en'
                ? 'EasyPaper — Smart Voice & Form Assistant'
                : 'ईज़ी-पेपर — स्मार्ट वॉयस व फॉर्म सहायक'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
            {language === 'en'
              ? 'Navigate complex paperwork and forms with conversational voice guidance.'
              : 'सरकारी एवं बैंकिंग प्रपत्रों को बोलकर समझें और आसानी से सही भरें।'}
          </h1>

          <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
            {language === 'en'
              ? 'Understand official forms, verify your eligibility transparently, extract verified details from your documents, and get a field-by-field preparation plan in English or Hindi.'
              : 'फॉर्मों को सरल भाषा में समझें, अपनी पात्रता की निष्पक्ष जांच करें, दस्तावेज़ों से सही जानकारी निकालें और प्रत्येक फ़ील्ड के लिए सटीक तैयारी योजना प्राप्त करें।'}
          </p>

          {/* Voice Assistant Callout Card */}
          <div className="p-4 rounded-xl bg-guidance text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span>{language === 'en' ? 'Conversational Voice Guide' : 'बोलकर सहायता प्राप्त करें'}</span>
                  <Volume2 className="w-4 h-4 text-white/80" />
                </div>
                <div className="text-xs text-white/85 mt-0.5">
                  {language === 'en'
                    ? 'Tap the floating microphone in the bottom-right corner anytime to navigate or ask questions in Hindi or English.'
                    : 'निचले दाएं कोने पर स्थित वॉयस बटन दबाकर कभी भी हिंदी या अंग्रेजी में बोलकर सहायता प्राप्त करें।'}
                </div>
              </div>
            </div>
            <div className="text-[11px] px-2.5 py-1 rounded bg-white/15 text-white font-medium whitespace-nowrap self-end sm:self-center">
              {language === 'en' ? 'Hindi • English' : 'हिंदी • English'}
            </div>
          </div>

          {/* Language Selector Box with Instant Preview */}
          <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {language === 'en' ? 'Select Preferred Language' : 'अपनी पसंदीदा भाषा चुनें'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  language === 'en'
                    ? 'border-guidance bg-guidance-light ring-2 ring-guidance'
                    : 'border-paper-sand hover:border-ink-muted bg-paper-canvas'
                }`}
              >
                <div className="font-semibold text-sm text-ink">English</div>
                <div className="text-xs text-ink-muted mt-0.5">Simple guidance & clear terms</div>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  language === 'hi'
                    ? 'border-guidance bg-guidance-light ring-2 ring-guidance'
                    : 'border-paper-sand hover:border-ink-muted bg-paper-canvas'
                }`}
              >
                <div className="font-semibold text-sm text-ink font-devanagari">हिंदी (Hindi)</div>
                <div className="text-xs text-ink-muted mt-0.5 font-devanagari">
                  सरल भाषा में स्पष्ट मार्गदर्शन
                </div>
              </button>
            </div>
            <div className="text-xs text-ink-muted bg-paper-canvas p-2.5 rounded border border-paper-sand italic">
              {language === 'en'
                ? 'Preview: "We will help you understand every field of your application step by step."'
                : 'पूर्वावलोकन: "हम आपके आवेदन के प्रत्येक फ़ील्ड को चरणबद्ध तरीके से समझने में आपकी सहायता करेंगे।"'}
            </div>
          </div>

          {/* Quick Access CTA */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={signInGuest}
              className="min-h-[48px] px-8 py-3.5 rounded-lg bg-guidance hover:bg-guidance-hover text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>{language === 'en' ? 'Get Started / Open Workspace' : 'प्रारंभ करें / कार्यक्षेत्र खोलें'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <SafetyDisclaimer className="mt-4" />
        </div>

        {/* Right Column: The 4 Core Modular Pillars */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand space-y-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-guidance">
              {language === 'en' ? 'Core Capabilities' : 'प्रमुख विशेषताएं'}
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-guidance-light text-guidance flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink">
                  {language === 'en' ? '1. Understand Any Form' : '१. किसी भी फॉर्म को समझें'}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'Interactive split view workspace showing plain-language guidance beside each form field.'
                    : 'प्रत्येक बॉक्स के बगल में सरल-भाषा मार्गदर्शन के साथ इंटरैक्टिव स्प्लिट व्यू।'}
                </p>
              </div>
            </div>

            <div className="border-t border-paper-sand pt-3.5 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-guidance-light text-guidance flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink">
                  {language === 'en' ? '2. Document Intelligence' : '२. दस्तावेज़ बुद्धिमत्ता'}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'OCR text extraction with evidence grounding, sensitive identity masking, and user confirmation.'
                    : 'सटीक ओसीआर निष्कर्षण, सख्त सत्यापन और संवेदनशील पहचान संख्या की गोपनीयता सुरक्षा।'}
                </p>
              </div>
            </div>

            <div className="border-t border-paper-sand pt-3.5 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-guidance-light text-guidance flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink">
                  {language === 'en' ? '3. Eligibility Copilot' : '३. पात्रता सह-पायलट'}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'Transparent evaluation against official rule sets with plain reasons and missing-data questions.'
                    : 'आधिकारिक नियमों के विरुद्ध पारदर्शी जांच, स्पष्ट कारण एवं छूटी हुई जानकारी के सवाल।'}
                </p>
              </div>
            </div>

            <div className="border-t border-paper-sand pt-3.5 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-guidance-light text-guidance flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink">
                  {language === 'en' ? '4. Form Readiness Kit' : '४. फॉर्म तत्परता किट'}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'Sequential "write this here" manual instructions and downloadable watermarked draft PDF.'
                    : 'प्रत्येक बॉक्स के लिए "यहाँ यह लिखें" निर्देश और डाउनलोड करने योग्य मसौदा पीडीएफ।'}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & synthetic sample note */}
          <div className="p-4 rounded-lg bg-guidance-light/60 border border-guidance-border text-xs text-ink space-y-1">
            <div className="font-semibold text-guidance">
              {language === 'en' ? 'Privacy First & Synthetic Data' : 'गोपनीयता और सिंथेटिक डेटा'}
            </div>
            <p className="text-ink-muted">
              {language === 'en'
                ? 'All sample documents and profiles use privacy-safe synthetic records. Your actual documents are processed securely with masking.'
                : 'सभी नमूना दस्तावेज़ और प्रोफ़ाइल सुरक्षित सिंथेटिक डेटा का उपयोग करते हैं।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
