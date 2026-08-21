import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { WelcomeScreen } from './features/onboarding/WelcomeScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { FormWorkspaceScreen } from './features/form-workspace/FormWorkspaceScreen';
import { EligibilityScreen } from './features/eligibility/EligibilityScreen';
import { DocumentReviewScreen } from './features/document-review/DocumentReviewScreen';
import { FormReadinessScreen } from './features/form-readiness/FormReadinessScreen';
import { VaultScreen } from './features/vault/VaultScreen';
import { StandaloneShowcaseScreen } from './features/showcase/StandaloneShowcaseScreen';
import { VoiceAgentOrb } from './components/voice/VoiceAgentOrb';

const MainContent: React.FC = () => {
  const { activeTab, language } = useApp();

  return (
    <div className={`min-h-screen bg-paper-canvas text-ink flex flex-col ${language === 'hi' ? 'lang-hi' : ''}`}>
      <Header />

      <main className="flex-1 w-full pb-12">
        {activeTab === 'welcome' && <WelcomeScreen />}
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'form_workspace' && <FormWorkspaceScreen />}
        {activeTab === 'eligibility' && <EligibilityScreen />}
        {activeTab === 'document_review' && <DocumentReviewScreen />}
        {activeTab === 'form_readiness' && <FormReadinessScreen />}
        {activeTab === 'vault' && <VaultScreen />}
        {activeTab === 'standalone_showcase' && <StandaloneShowcaseScreen />}
      </main>

      {/* Global Conversational Voice Assistant Orb */}
      <VoiceAgentOrb />

      {/* Footer */}
      <footer className="border-t border-paper-sand bg-paper-surface py-6 text-center text-xs text-ink-muted">
        <div className="max-w-content mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-ink">EasyPaper</span> —{' '}
            {language === 'en'
              ? 'Bilingual Form Assistant for Public & Banking Services'
              : 'सार्वजनिक एवं बैंकिंग सेवाओं हेतु द्विभाषी फॉर्म सहायक'}
          </div>
          <div className="text-[11px] text-ink-muted">
            {language === 'en' ? 'Bilingual Guidance & Form Preparation' : 'द्विभाषी मार्गदर्शन एवं प्रपत्र तैयारी'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
