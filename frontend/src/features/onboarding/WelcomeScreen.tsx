import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
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
                ? 'HACQUIRE 2026 — Paperwork & Access'
                : 'हैकवायर 2026 — पेपरवर्क एंड एक्सेस'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
            {language === 'en'
              ? 'Navigate complex government paperwork with confidence.'
              : 'सरकारी योजनाओं एवं प्रपत्रों को आसानी से समझें और सही भरें।'}
          </h1>

          <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
            {language === 'en'
              ? 'Understand official forms, verify your eligibility transparently, extract verified details from your documents, and get a field-by-field preparation plan in English or Hindi.'
              : 'सरकारी फॉर्मों को सरल भाषा में समझें, अपनी पात्रता की निष्पक्ष जांच करें, दस्तावेज़ों से सही जानकारी निकालें और प्रत्येक फ़ील्ड के लिए सटीक तैयारी योजना प्राप्त करें।'}
          </p>

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
                <div className="font-semibold text-sm text-ink">हिंदी (Hindi)</div>
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

          {/* Sign In & Guest Mode CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={signInGuest}
              className="min-h-[48px] px-6 py-3 rounded-lg bg-guidance hover:bg-guidance-hover text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>{language === 'en' ? 'Continue as Demo Guest' : 'डेमो अतिथि के रूप में प्रारंभ करें'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={signInGuest}
              className="min-h-[48px] px-5 py-3 rounded-lg border border-paper-sand bg-paper-surface hover:bg-paper-canvas text-ink font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4 text-ink-muted" />
              <span>{language === 'en' ? 'Sign In with Firebase' : 'फ़ायरबेस से साइन इन करें'}</span>
            </button>
          </div>

          <SafetyDisclaimer className="mt-4" />
        </div>

        {/* Right Column: The 3 Core Modular Pillars */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand space-y-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-guidance">
              {language === 'en' ? 'Core Capabilities' : 'प्रमुख विशेषताएं'}
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-guidance-light text-guidance flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink">
                  {language === 'en' ? '1. Document Intelligence' : '१. दस्तावेज़ बुद्धिमत्ता'}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'OCR text extraction with strict grounding verification and sensitive number privacy masking.'
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
                  {language === 'en' ? '2. Eligibility Copilot' : '२. पात्रता सह-पायलट'}
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
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink">
                  {language === 'en' ? '3. Form Readiness Kit' : '३. फॉर्म तत्परता किट'}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  {language === 'en'
                    ? 'Sequential "write this here" manual guidance and downloadable watermarked draft PDF.'
                    : 'प्रत्येक बॉक्स के लिए "यहाँ यह लिखें" निर्देश और डाउनलोड करने योग्य मसौदा पीडीएफ।'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Assurance Card */}
          <div className="p-4 rounded-lg bg-guidance-light/60 border border-guidance-border text-xs text-ink space-y-1">
            <div className="font-semibold text-guidance">
              {language === 'en' ? 'Synthetic Data Demo' : 'सिंथेटिक डेटा डेमो'}
            </div>
            <p className="text-ink-muted">
              {language === 'en'
                ? 'All sample documents and profiles in this demo use synthetic, privacy-safe test records.'
                : 'इस डेमो में सभी नमूना दस्तावेज़ और प्रोफ़ाइल सिंथेटिक व सुरक्षित परीक्षण डेटा का उपयोग करते हैं।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
