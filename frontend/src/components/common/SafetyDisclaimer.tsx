import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ExternalLink } from 'lucide-react';

interface SafetyDisclaimerProps {
  sourceUrl?: string;
  className?: string;
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ sourceUrl, className = '' }) => {
  const { language } = useApp();

  return (
    <div
      className={`rounded-lg border border-paper-sand bg-paper-surface p-3.5 flex items-start gap-3 text-xs text-ink-muted ${className}`}
    >
      <ShieldAlert className="w-4 h-4 text-review-amber shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="font-medium text-ink">
          {language === 'en'
            ? 'Guidance & Preparation Tool Only'
            : 'केवल मार्गदर्शन एवं तैयारी हेतु सहायक उपकरण'}
        </p>
        <p className="leading-relaxed">
          {language === 'en'
            ? 'EasyPaper is an independent bilingual assistant. It does not provide legal advice, official eligibility decisions, or government submission confirmation. Please verify all details on the official portal.'
            : 'ईज़ी-पेपर एक स्वतंत्र द्विभाषी मार्गदर्शक है। यह कानूनी सलाह, आधिकारिक पात्रता निर्णय या सरकारी आवेदन स्वीकृति प्रदान नहीं करता है। कृपया आधिकारिक पोर्टल पर विवरण सत्यापित करें।'}
        </p>
        {sourceUrl && (
          <div className="pt-1">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-guidance font-medium hover:underline"
            >
              <span>{language === 'en' ? 'Official Government Portal' : 'आधिकारिक सरकारी पोर्टल'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
