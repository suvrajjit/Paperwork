import React from 'react';
import { useApp } from '../../context/AppContext';
import { Languages } from 'lucide-react';

interface OriginalTextToggleProps {
  showOriginal: boolean;
  onToggle: () => void;
  className?: string;
}

export const OriginalTextToggle: React.FC<OriginalTextToggleProps> = ({
  showOriginal,
  onToggle,
  className = '',
}) => {
  const { language } = useApp();

  // Only relevant when viewing Hindi guidance
  if (language !== 'hi') return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-paper-sand transition-colors ${
        showOriginal
          ? 'bg-ink text-white font-medium shadow-xs'
          : 'bg-paper-surface text-ink-muted hover:text-ink hover:bg-paper-canvas'
      } ${className}`}
      title="मूल अंग्रेजी स्रोत टेक्स्ट देखें"
    >
      <Languages className="w-3.5 h-3.5" />
      <span>{showOriginal ? 'मूल अंग्रेजी दिखाएं ✓' : 'मूल अंग्रेजी देखें'}</span>
    </button>
  );
};
