import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderLock,
  FileCheck,
  Trash2,
  Upload,
  Clock,
} from 'lucide-react';
import { SafetyDisclaimer } from '../../components/common/SafetyDisclaimer';
import { OriginalTextToggle } from '../../components/common/OriginalTextToggle';

export const VaultScreen: React.FC = () => {
  const { language, setActiveTab, vaultDocs, actionReminders, deleteFromVault } = useApp();
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-paper-sand">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-guidance uppercase tracking-wider">
            <FolderLock className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Document Vault & Reminders' : 'दस्तावेज़ तिजोरी एवं अनुस्मारक'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-0.5">
            {language === 'en' ? 'Saved Supporting Documents' : 'सत्यापित सहायक दस्तावेज़'}
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {language === 'en'
              ? 'Stored synthetic document proofs ready for automatic reuse in scheme forms.'
              : 'विभिन्न सरकारी फॉर्मों में पुनः उपयोग के लिए सुरक्षित रूप से सहेजे गए दस्तावेज़।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OriginalTextToggle
            showOriginal={showOriginal}
            onToggle={() => setShowOriginal(!showOriginal)}
          />

          <button
            type="button"
            onClick={() => setActiveTab('document_review')}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-guidance hover:bg-guidance-hover text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'en' ? 'Add New Document' : 'नया दस्तावेज़ जोड़ें'}</span>
          </button>
        </div>
      </div>

      {/* Action Reminder Alerts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-review-amber" />
          <h3 className="font-bold text-sm text-ink">
            {language === 'en' ? 'Pending Deadlines & Action Reminders' : 'लंबित कार्य एवं अनुस्मारक'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actionReminders.map((rem) => (
            <div
              key={rem.id}
              className="p-4 rounded-xl bg-paper-surface border border-paper-sand space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-ink">
                  {language === 'en' || showOriginal ? rem.title_en : rem.title_hi}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-review-light text-review-amber">
                  Due: {rem.due_date}
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {language === 'en' || showOriginal ? rem.description_en : rem.description_hi}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vault Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-guidance" />
            <h3 className="font-bold text-sm text-ink">
              {language === 'en' ? 'Stored Documents & Extracted Metadata' : 'सहेजे गए दस्तावेज़ एवं डेटा'}
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {vaultDocs.length} {language === 'en' ? 'Records' : 'अभिलेख'}
          </span>
        </div>

        {vaultDocs.length === 0 ? (
          <div className="p-8 rounded-xl bg-paper-surface border border-paper-sand text-center text-xs text-ink-muted space-y-3">
            <p>
              {language === 'en'
                ? 'Your vault is currently empty. Extract a document to store confirmed records.'
                : 'आपकी तिजोरी वर्तमान में खाली है। दस्तावेज़ निकालें और सहेजें।'}
            </p>
            <button
              onClick={() => setActiveTab('document_review')}
              className="px-4 py-2 rounded-lg bg-guidance text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Review a Document' : 'दस्तावेज़ समीक्षा करें'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaultDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-xl bg-paper-surface border border-paper-sand shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-ink">
                        {language === 'en' || showOriginal ? doc.name_en : doc.name_hi}
                      </h4>
                      <span className="text-[11px] font-mono text-ink-muted">
                        ID: {doc.id}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-guidance-light text-guidance border border-guidance-border">
                      Verified
                    </span>
                  </div>

                  {/* Metadata Tag Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-paper-canvas border border-paper-sand text-ink-muted font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Next Action guidance */}
                  {doc.next_action_en && (
                    <div className="p-2.5 rounded-lg bg-paper-canvas border border-paper-sand text-xs text-ink-muted space-y-0.5">
                      <span className="font-semibold text-ink">
                        {language === 'en' ? 'Ready For:' : 'उपयोग हेतु:'}
                      </span>
                      <p>{language === 'en' || showOriginal ? doc.next_action_en : doc.next_action_hi}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-paper-sand flex items-center justify-between text-xs">
                  <span className="text-[11px] text-ink-muted font-mono">
                    {new Date(doc.saved_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('form_readiness')}
                      className="text-xs font-semibold text-guidance hover:underline"
                    >
                      {language === 'en' ? 'Use in Form' : 'फॉर्म में उपयोग करें'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFromVault(doc.id)}
                      className="p-1 text-ink-muted hover:text-error-brick rounded hover:bg-paper-canvas transition-colors"
                      title="Remove from vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SafetyDisclaimer />
    </div>
  );
};
