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
  resetProfile: () => void;
  clearCache: () => void;
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

const STORAGE_KEYS = {
  LANGUAGE: 'easypaper_language',
  ACTIVE_TAB: 'easypaper_active_tab',
  USER: 'easypaper_user',
  PROFILE: 'easypaper_profile',
  SELECTED_FORM: 'easypaper_selected_form',
  SELECTED_SCHEME: 'easypaper_selected_scheme',
  VAULT_DOCS: 'easypaper_vault_docs',
  REMINDERS: 'easypaper_action_reminders',
};

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

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item);
    }
  } catch (e) {
    console.warn(`Failed to parse cached localStorage key: ${key}`, e);
  }
  return fallback;
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save to localStorage key: ${key}`, e);
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage cache with fallback defaults
  const [language, setLanguageState] = useState<Language>(() =>
    loadStorage<Language>(STORAGE_KEYS.LANGUAGE, 'en')
  );
  const [activeTab, setActiveTabState] = useState<ScreenTab>(() =>
    loadStorage<ScreenTab>(STORAGE_KEYS.ACTIVE_TAB, 'welcome')
  );
  const [user, setUserState] = useState<UserSession | null>(() =>
    loadStorage<UserSession | null>(STORAGE_KEYS.USER, null)
  );
  const [profile, setProfileState] = useState<CitizenProfile>(() =>
    loadStorage<CitizenProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE)
  );
  const [selectedFormId, setSelectedFormIdState] = useState<string>(() =>
    loadStorage<string>(STORAGE_KEYS.SELECTED_FORM, 'form_pm_kisan_app')
  );
  const [selectedSchemeId, setSelectedSchemeIdState] = useState<string>(() =>
    loadStorage<string>(STORAGE_KEYS.SELECTED_SCHEME, 'scheme_pm_kisan')
  );
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [vaultDocs, setVaultDocsState] = useState<VaultDocumentItem[]>(() =>
    loadStorage<VaultDocumentItem[]>(STORAGE_KEYS.VAULT_DOCS, [])
  );
  const [actionReminders, setActionRemindersState] = useState<ActionReminder[]>(() =>
    loadStorage<ActionReminder[]>(STORAGE_KEYS.REMINDERS, [])
  );

  // Sync state changes to LocalStorage cache
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveStorage(STORAGE_KEYS.LANGUAGE, lang);
  };

  const setActiveTab = (tab: ScreenTab) => {
    setActiveTabState(tab);
    saveStorage(STORAGE_KEYS.ACTIVE_TAB, tab);
  };

  const setUser = (u: UserSession | null) => {
    setUserState(u);
    saveStorage(STORAGE_KEYS.USER, u);
  };

  const setProfile = (p: CitizenProfile) => {
    setProfileState(p);
    saveStorage(STORAGE_KEYS.PROFILE, p);
  };

  const setSelectedFormId = (id: string) => {
    setSelectedFormIdState(id);
    saveStorage(STORAGE_KEYS.SELECTED_FORM, id);
  };

  const setSelectedSchemeId = (id: string) => {
    setSelectedSchemeIdState(id);
    saveStorage(STORAGE_KEYS.SELECTED_SCHEME, id);
  };

  const setVaultDocs = (docs: VaultDocumentItem[]) => {
    setVaultDocsState(docs);
    saveStorage(STORAGE_KEYS.VAULT_DOCS, docs);
  };

  const setActionReminders = (rems: ActionReminder[]) => {
    setActionRemindersState(rems);
    saveStorage(STORAGE_KEYS.REMINDERS, rems);
  };

  // Track document types present in profile/vault
  const availableDocumentTypes = [
    'identity_card',
    'land_record',
    ...(profile.annual_income?.value ? ['income_certificate'] : []),
    ...vaultDocs.map((d) => d.doc_type),
  ];

  const signInGuest = () => {
    const guestUser: UserSession = {
      name: language === 'en' ? 'Demo Guest Citizen' : 'डेमो अतिथि नागरिक',
      isGuest: true,
    };
    setUser(guestUser);
    setActiveTab('dashboard');
  };

  const signOut = () => {
    setUser(null);
    setActiveTab('welcome');
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
  };

  const clearCache = () => {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    setLanguageState('en');
    setActiveTabState('welcome');
    setUserState(null);
    setProfileState(DEFAULT_PROFILE);
    setSelectedFormIdState('form_pm_kisan_app');
    setSelectedSchemeIdState('scheme_pm_kisan');
    setVaultDocsState([]);
    setActionRemindersState([]);
  };

  const updateProfileField = (key: string, value: any, source: string = 'user_input', confidence: number = 1.0) => {
    setProfileState((prev) => {
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
      saveStorage(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  };

  const applyExtractedDocument = (doc: DocumentExtractionResponse) => {
    setProfileState((prev) => {
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
      saveStorage(STORAGE_KEYS.PROFILE, updated);
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
      console.warn('Could not load remote vault data, using cached local store:', e);
    }
  };

  const saveToVault = async (doc: VaultDocumentItem) => {
    try {
      const saved = await api.saveVaultDocument(doc);
      setVaultDocs([saved, ...vaultDocs.filter((d) => d.id !== saved.id)]);
    } catch (e) {
      console.error('Error saving to vault backend, persisting locally:', e);
      setVaultDocs([doc, ...vaultDocs.filter((d) => d.id !== doc.id)]);
    }
  };

  const deleteFromVault = async (id: string) => {
    try {
      await api.deleteVaultDocument(id);
      setVaultDocs(vaultDocs.filter((d) => d.id !== id));
    } catch (e) {
      console.error('Error deleting from remote vault, removing locally:', e);
      setVaultDocs(vaultDocs.filter((d) => d.id !== id));
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
        resetProfile,
        clearCache,
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
