import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  ScreenTab,
  CitizenProfile,
  ProfileFieldValue,
  DocumentExtractionResponse,
  VaultDocumentItem,
  ActionReminder,
} from '../types';
import { api } from '../services/api';

interface UserSession {
  name: string;
  isGuest: boolean;
  email?: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  user: UserSession | null;
  signInGuest: () => void;
  signOut: () => void;
  profile: CitizenProfile;
  updateProfileField: (key: string, value: any, source?: string, confidence?: number) => void;
  applyExtractedDocument: (doc: DocumentExtractionResponse) => void;
  selectedFormId: string;
  setSelectedFormId: (id: string) => void;
  selectedSchemeId: string;
  setSelectedSchemeId: (id: string) => void;
  activeFieldId: string | null;
  setActiveFieldId: (id: string | null) => void;
  availableDocumentTypes: string[];
  vaultDocs: VaultDocumentItem[];
  actionReminders: ActionReminder[];
  saveToVault: (doc: VaultDocumentItem) => Promise<void>;
  deleteFromVault: (id: string) => Promise<void>;
  refreshVault: () => Promise<void>;
}

const DEFAULT_PROFILE: CitizenProfile = {
  full_name: { value: 'Ramesh Kumar Sharma', source: 'demo_preset', confidence: 0.98, confirmed_by_user: true },
  gender: { value: 'Male', source: 'demo_preset', confidence: 0.98, confirmed_by_user: true },
  aadhaar_number: {
    value: '9876 5432 1098',
    source: 'demo_preset',
    confidence: 0.99,
    confirmed_by_user: true,
    masked_value: 'XXXX XXXX 1098',
  },
  state: { value: 'Uttar Pradesh', source: 'demo_preset', confidence: 0.95, confirmed_by_user: true },
  district: { value: 'Varanasi', source: 'demo_preset', confidence: 0.95, confirmed_by_user: true },
  pincode: { value: '221001', source: 'demo_preset', confidence: 0.95, confirmed_by_user: true },
  landholding_acres: { value: 2.4, source: 'demo_preset', confidence: 0.96, confirmed_by_user: true },
  annual_income: { value: 72000, source: 'demo_preset', confidence: 0.92, confirmed_by_user: true },
  age: { value: 42, source: 'demo_preset', confidence: 0.95, confirmed_by_user: true },
  custom_fields: {},
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<ScreenTab>('welcome');
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<CitizenProfile>(DEFAULT_PROFILE);
  const [selectedFormId, setSelectedFormId] = useState<string>('form_pm_kisan_app');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('scheme_pm_kisan');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [vaultDocs, setVaultDocs] = useState<VaultDocumentItem[]>([]);
  const [actionReminders, setActionReminders] = useState<ActionReminder[]>([]);

  // Track document types that are present in profile/vault
  const availableDocumentTypes = [
    'identity_card',
    'land_record',
    ...(profile.annual_income?.value ? ['income_certificate'] : []),
    ...vaultDocs.map((d) => d.doc_type),
  ];

  const signInGuest = () => {
    setUser({
      name: language === 'en' ? 'Demo Guest Citizen' : 'डेमो अतिथि नागरिक',
      isGuest: true,
    });
    setActiveTab('dashboard');
  };

  const signOut = () => {
    setUser(null);
    setActiveTab('welcome');
  };

  const updateProfileField = (key: string, value: any, source: string = 'user_input', confidence: number = 1.0) => {
    setProfile((prev) => {
      const updated = { ...prev };
      const fieldVal: ProfileFieldValue = {
        value,
        source,
        confidence,
        confirmed_by_user: true,
      };

      if (key in updated && key !== 'custom_fields') {
        (updated as any)[key] = fieldVal;
      } else {
        if (!updated.custom_fields) updated.custom_fields = {};
        updated.custom_fields[key] = fieldVal;
      }
      return updated;
    });
  };

  const applyExtractedDocument = (doc: DocumentExtractionResponse) => {
    setProfile((prev) => {
      const updated = { ...prev };
      doc.fields.forEach((f) => {
        const fieldVal: ProfileFieldValue = {
          value: f.value,
          source: `doc_ocr_${doc.detected_document_type}`,
          source_document_id: doc.document_id,
          confidence: f.confidence,
          confirmed_by_user: true,
          masked_value: f.masked_value,
        };

        if (f.field_key in updated && f.field_key !== 'custom_fields') {
          (updated as any)[f.field_key] = fieldVal;
        } else {
          if (!updated.custom_fields) updated.custom_fields = {};
          updated.custom_fields[f.field_key] = fieldVal;
        }
      });
      return updated;
    });
  };

  const refreshVault = async () => {
    try {
      const docs = await api.getVaultDocuments();
      setVaultDocs(docs);
      const rems = await api.getActionReminders();
      setActionReminders(rems);
    } catch (e) {
      console.warn('Could not load vault data:', e);
    }
  };

  const saveToVault = async (doc: VaultDocumentItem) => {
    try {
      const saved = await api.saveVaultDocument(doc);
      setVaultDocs((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
    } catch (e) {
      console.error('Error saving to vault:', e);
    }
  };

  const deleteFromVault = async (id: string) => {
    try {
      await api.deleteVaultDocument(id);
      setVaultDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error('Error deleting from vault:', e);
    }
  };

  useEffect(() => {
    refreshVault();
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        activeTab,
        setActiveTab,
        user,
        signInGuest,
        signOut,
        profile,
        updateProfileField,
        applyExtractedDocument,
        selectedFormId,
        setSelectedFormId,
        selectedSchemeId,
        setSelectedSchemeId,
        activeFieldId,
        setActiveFieldId,
        availableDocumentTypes,
        vaultDocs,
        actionReminders,
        saveToVault,
        deleteFromVault,
        refreshVault,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
