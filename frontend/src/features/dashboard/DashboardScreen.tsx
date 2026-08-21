import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  CheckCircle2,
  FolderLock,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { FormTemplate } from '../../types';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';

export const DashboardScreen: React.FC = () => {
  const {
    language,
    setActiveTab,
    profile,
    selectedFormId,
    setSelectedFormId,
    setSelectedSchemeId,
    vaultDocs,
    actionReminders,
  } = useApp();

  const [forms, setForms] = useState<FormTemplate[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const formsData = await api.getFormTemplates();
        setForms(formsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }
    loadData();
  }, []);

  const handleSelectFormAndNavigate = (formId: string, tab: 'form_workspace' | 'form_readiness') => {
    setSelectedFormId(formId);
    if (formId === 'form_pm_kisan_app') {
      setSelectedSchemeId('scheme_pm_kisan');
    } else if (formId === 'form_income_cert_app') {
      setSelectedSchemeId('scheme_pm_awas');
    }
    setActiveTab(tab);
  };

  const handleSelectSchemeAndNavigate = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    if (schemeId === 'scheme_pm_kisan') {
      setSelectedFormId('form_pm_kisan_app');
    } else {
      setSelectedFormId('form_income_cert_app');
    }
    setActiveTab('eligibility');
  };

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl bg-paper-surface border border-paper-sand flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Citizen Workspace' : 'नागरिक कार्यक्षेत्र'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            {language === 'en'
              ? `Welcome back, ${profile.full_name?.value || 'Citizen'}`
              : `स्वागत है, ${profile.full_name?.value || 'नागरिक'}`}
          </h2>
          <p className="text-sm text-ink-muted">
            {language === 'en'
              ? 'Select a service below to understand its requirements or prepare your submission.'
              : 'इसकी आवश्यकताओं को समझने अथवा आवेदन तैयार करने के लिए नीचे दी गई सेवा चुनें।'}
          </p>
        </div>

        {/* Profile Snapshot Badge */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-paper-canvas border border-paper-sand text-xs">
          <div className="space-y-0.5">
            <div className="text-ink-muted">
              {language === 'en' ? 'Active Profile' : 'सक्रिय प्रोफ़ाइल'}
            </div>
            <div className="font-semibold text-ink">
              {profile.district?.value || 'Varanasi'}, {profile.state?.value || 'Uttar Pradesh'}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('document_review')}
            className="px-2.5 py-1 rounded bg-paper-surface border border-paper-sand hover:border-ink-muted text-ink font-medium"
          >
            {language === 'en' ? 'Manage Documents' : 'दस्तावेज़ प्रबंधित करें'}
          </button>
        </div>
      </div>

      {/* Two Primary Action Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pathway 1: Understand a Form */}
        <div
          onClick={() => handleSelectFormAndNavigate(selectedFormId, 'form_workspace')}
          className="p-6 rounded-xl bg-paper-surface border-2 border-transparent hover:border-guidance transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-guidance-light text-guidance flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-guidance flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              {language === 'en' ? 'Open Workspace' : 'कार्यक्षेत्र खोलें'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <h3 className="text-lg font-bold text-ink mb-1">
            {language === 'en' ? 'Understand a Form' : 'फॉर्म को समझें'}
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-4">
            {language === 'en'
              ? 'View the original application form alongside clear English/Hindi explanations, active field highlighting, and voice assistance.'
              : 'मूल फॉर्म को सरल हिंदी/अंग्रेजी व्याख्या, सक्रिय फ़ील्ड हाइलाइटिंग और वॉयस गाइड के साथ देखें।'}
          </p>

          <div className="text-xs font-medium text-ink-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-guidance"></span>
            <span>
              {language === 'en' ? 'Interactive 42/58 split screen' : 'इंटरएक्टिव द्विभाषी स्प्लिट स्क्रीन'}
            </span>
          </div>
        </div>

        {/* Pathway 2: Prepare a Form Plan */}
        <div
          onClick={() => handleSelectFormAndNavigate(selectedFormId, 'form_readiness')}
          className="p-6 rounded-xl bg-paper-surface border-2 border-transparent hover:border-guidance transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-guidance-light text-guidance flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-guidance flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              {language === 'en' ? 'Generate Plan' : 'योजना बनाएं'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <h3 className="text-lg font-bold text-ink mb-1">
            {language === 'en' ? 'Prepare Form Completion Plan' : 'फॉर्म भरने की तैयारी योजना'}
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-4">
            {language === 'en'
              ? 'Get exact "write this here" guidance for each field, check missing attachments, and download a readiness draft PDF.'
              : 'प्रत्येक फ़ील्ड के लिए सटीक "यहाँ यह लिखें" निर्देश पाएं, संलग्नक जांचें और मसौदा पीडीएफ डाउनलोड करें।'}
          </p>

          <div className="text-xs font-medium text-ink-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-guidance"></span>
            <span>
              {language === 'en' ? 'Field-by-field manual guidance & draft PDF' : 'फ़ील्ड-वार मार्गदर्शन एवं मसौदा पीडीएफ'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Supported Schemes & Forms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink tracking-tight">
            {language === 'en' ? 'Supported Schemes & Forms' : 'समर्थित योजनाएं एवं फॉर्म'}
          </h3>
          <span className="text-xs text-ink-muted">
            {language === 'en' ? 'Curated Synthetic Demos' : 'सिंथेटिक डेमो सूची'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="p-4 rounded-xl bg-paper-surface border border-paper-sand hover:border-ink-muted transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-paper-canvas border border-paper-sand text-ink-muted">
                    {form.category}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted">
                    {form.fields.length} {language === 'en' ? 'fields' : 'फ़ील्ड'}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-ink">
                  {language === 'en' ? form.name_en : form.name_hi}
                </h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {language === 'en' ? form.description_en : form.description_hi}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-paper-sand flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelectFormAndNavigate(form.id, 'form_workspace')}
                  className="text-xs font-semibold text-guidance hover:underline flex items-center gap-1"
                >
                  <span>{language === 'en' ? 'Understand' : 'समझें'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSchemeAndNavigate(
                      form.id === 'form_pm_kisan_app' ? 'scheme_pm_kisan' : 'scheme_pm_awas'
                    )}
                    className="text-xs px-2.5 py-1 rounded bg-paper-canvas border border-paper-sand hover:bg-paper-sand text-ink font-medium"
                  >
                    {language === 'en' ? 'Check Eligibility' : 'पात्रता जांचें'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFormAndNavigate(form.id, 'form_readiness')}
                    className="text-xs px-2.5 py-1 rounded bg-guidance text-white hover:bg-guidance-hover font-medium"
                  >
                    {language === 'en' ? 'Prepare' : 'तैयार करें'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Reminder Cards & Vault Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reminders Card */}
        <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-review-amber" />
              <h4 className="font-semibold text-sm text-ink">
                {language === 'en' ? 'Action Checklist & Reminders' : 'कार्य चेकलिस्ट एवं अनुस्मारक'}
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-review-light text-review-amber font-semibold">
              {actionReminders.length} {language === 'en' ? 'Pending' : 'लंबित'}
            </span>
          </div>

          <div className="space-y-2.5">
            {actionReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3 rounded-lg bg-paper-canvas border border-paper-sand text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    {language === 'en' ? rem.title_en : rem.title_hi}
                  </span>
                  <span className="text-[10px] text-review-amber font-mono font-medium">
                    {rem.due_date}
                  </span>
                </div>
                <p className="text-ink-muted">
                  {language === 'en' ? rem.description_en : rem.description_hi}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Vault Summary Card */}
        <div className="p-5 rounded-xl bg-paper-surface border border-paper-sand space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-guidance" />
              <h4 className="font-semibold text-sm text-ink">
                {language === 'en' ? 'Document Vault' : 'दस्तावेज़ तिजोरी'}
              </h4>
            </div>
            <button
              onClick={() => setActiveTab('vault')}
              className="text-xs font-semibold text-guidance hover:underline"
            >
              {language === 'en' ? 'View All' : 'सभी देखें'}
            </button>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            {language === 'en'
              ? 'Confirmed documents are securely referenced for automatic form completion and eligibility checks.'
              : 'सत्यापित दस्तावेज़ों का उपयोग स्वचालित फॉर्म भरने और पात्रता जांच के लिए सुरक्षित रूप से किया जाता है।'}
          </p>

          <div className="space-y-2">
            {vaultDocs.slice(0, 2).map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-lg bg-paper-canvas border border-paper-sand flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-ink">
                    {language === 'en' ? doc.name_en : doc.name_hi}
                  </div>
                  <div className="text-[10px] text-ink-muted">
                    {doc.extracted_fields_count} {language === 'en' ? 'extracted fields confirmed' : 'फ़ील्ड सत्यापित'}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-guidance-light text-guidance font-semibold">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SafetyDisclaimer />
    </div>
  );
};
