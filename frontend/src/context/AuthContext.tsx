import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

export type Language = 'en' | 'hi' | 'kn';
export type ThemeMode = 'dark' | 'light';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    appName: 'Coop Connect',
    tagline: 'Worker-Owned Digital Service Marketplace',
    roleCustomer: 'Customer',
    roleWorker: 'Worker Partner',
    roleAdmin: 'Cooperative Admin',
    loginBtn: 'Sign In',
    registerBtn: 'Join Cooperative',
    logoutBtn: 'Sign Out',
    sosBtn: 'SOS Emergency',
    searchPlaceholder: 'Search electrician, plumber, carpenter, beautician, solar tech...',
    bookServiceBtn: 'Book Service',
    viewFairnessBtn: 'Inspect FairDispatch',
    welfareVault: 'Welfare Vault',
    governancePortal: 'Governance Portal',
    themeToggle: 'Toggle Theme',
    languageSelect: 'Language',
    verified: 'Verified Worker',
    unverified: 'Pending Verification',
    verificationNotice: 'Only verified worker partners can accept job dispatches.',
    autoDispatch: 'Auto FairDispatch',
    manualSelect: 'Choose Worker Manually',
    acceptJob: 'Accept Request',
    rejectJob: 'Decline Request',
    inProgress: 'In Progress',
    completed: 'Completed',
    payNow: 'Pay & Confirm',
    downloadReceipt: 'Download Receipt',
    printReceipt: 'Print Digital Receipt',
    submitFeedback: 'Submit Review',
    aiForecast: 'AI Demand Forecast',
    workerRoster: 'Worker Management',
    votingProposals: 'Cooperative Voting',
    verifiedBadge: 'Verified',
    pendingBadge: 'Pending Verification',
  },
  hi: {
    appName: 'कूप कनेक्ट',
    tagline: 'श्रमिक-स्वामित्व वाली डिजिटल सेवा मार्केटप्लेस',
    roleCustomer: 'ग्राहक',
    roleWorker: 'सहयोगी श्रमिक',
    roleAdmin: 'सहकारी प्रशासक',
    loginBtn: 'साइन इन करें',
    registerBtn: 'सहकारी में शामिल हों',
    logoutBtn: 'साइन आउट',
    sosBtn: 'आपातकालीन SOS',
    searchPlaceholder: 'इलेक्ट्रीशियन, प्लंबर, कारपेंटर, ब्यूटीशियन खोजें...',
    bookServiceBtn: 'सेवा बुक करें',
    viewFairnessBtn: 'फेयर-डिसपैच जांचें',
    welfareVault: 'कल्याण कोष',
    governancePortal: 'गवर्नेंस पोर्टल',
    themeToggle: 'थीम बदलें',
    languageSelect: 'भाषा',
    verified: 'सत्यापित श्रमिक',
    unverified: 'सत्यापन लंबित',
    verificationNotice: 'केवल सत्यापित श्रमिक ही जॉब स्वीकार कर सकते हैं।',
    autoDispatch: 'ऑटो फेयर-डिसपैच',
    manualSelect: 'श्रमिक खुद चुनें',
    acceptJob: 'स्वीकार करें',
    rejectJob: 'अस्वीकार करें',
    inProgress: 'प्रगति पर',
    completed: 'पूरा हुआ',
    payNow: 'भुगतान करें और पुष्टि करें',
    downloadReceipt: 'रसीद डाउनलोड करें',
    printReceipt: 'डिजिटल रसीद प्रिंट करें',
    submitFeedback: 'समीक्षा जमा करें',
    aiForecast: 'AI मांग पूर्वानुमान',
    workerRoster: 'श्रमिक प्रबंधन',
    votingProposals: 'सहकारी मतदान',
    verifiedBadge: 'सत्यापित',
    pendingBadge: 'सत्यापन लंबित',
  },
  kn: {
    appName: 'ಕೂಪ್ ಕನೆಕ್ಟ್',
    tagline: 'ಕಾರ್ಮಿಕ ಸ್ವಾಮ್ಯದ ಡಿಜಿಟಲ್ ಸೇವಾ ಮಾರುಕಟ್ಟೆ',
    roleCustomer: 'ಗ್ರಾಹಕ',
    roleWorker: 'ಕಾರ್ಮಿಕ ಪಾಲುದಾರ',
    roleAdmin: 'ಸಹಕಾರ ಆಡಳಿತಾಧಿಕಾರಿ',
    loginBtn: 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    registerBtn: 'ಸಹಕಾರ ಸಂಘಕ್ಕೆ ಸೇರಿ',
    logoutBtn: 'ಸೈನ್ ಔಟ್',
    sosBtn: 'ತುರ್ತು SOS',
    searchPlaceholder: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್, ಕಾರ್ಪೆಂಟರ್, ಸೌಂದರ್ಯ ತಜ್ಞರನ್ನು ಹುಡುಕಿ...',
    bookServiceBtn: 'ಸೇವೆ ಬುಕ್ ಮಾಡಿ',
    viewFairnessBtn: 'ಫೇರ್-ಡಿಸ್ಪ್ಯಾಚ್ ಪರಿಶೀಲಿಸಿ',
    welfareVault: 'ಕ್ಷೇಮಾಭಿವೃದ್ಧಿ ನಿಧಿ',
    governancePortal: 'ಆಡಳಿತ ಮಂಡಳಿ',
    themeToggle: 'ಥೀಮ್ ಬದಲಾಯಿಸಿ',
    languageSelect: 'ಭಾಷೆ',
    verified: 'ಪರಿಶೀಲಿಸಿದ ಕಾರ್ಮಿಕ',
    unverified: 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ',
    verificationNotice: 'ಪರಿಶೀಲಿಸಿದ ಕಾರ್ಮಿಕರು ಮಾತ್ರ ಕೆಲಸಗಳನ್ನು ಸ್ವೀಕರಿಸಬಹುದು.',
    autoDispatch: 'ಆಟೋ ಫೇರ್-ಡಿಸ್ಪ್ಯಾಚ್',
    manualSelect: 'ಕಾರ್ಮಿಕರನ್ನು ಹಸ್ತಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಿ',
    acceptJob: 'ಸ್ವೀಕರಿಸಿ',
    rejectJob: 'ನಿರಾಕರಿಸಿ',
    inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    payNow: 'ಪಾವತಿಸಿ ಮತ್ತು ದೃಢೀಕರಿಸಿ',
    downloadReceipt: 'ರಸೀದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    printReceipt: 'ಡಿಜಿಟಲ್ ರಸೀದಿ ಮುದ್ರಿಸಿ',
    submitFeedback: 'ವಿಮರ್ಶೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    aiForecast: 'AI ಬೇಡಿಕೆ ಮುನ್ಸೂಚನೆ',
    workerRoster: 'ಕಾರ್ಮಿಕ ನಿರ್ವಹಣೆ',
    votingProposals: 'ಸಹಕಾರ ಮತದಾನ',
    verifiedBadge: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    pendingBadge: 'ಪರಿಶೀಲನೆ ಬಾಕಿ',
  },
};

interface AuthContextType {
  user: User | null;
  role: Role;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  t: (key: string) => string;
  setRole: (role: Role) => void;
  loginAsDemoUser: (demoUserEmail: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  registerUser: (
    name: string,
    phone: string,
    email: string,
    password: string,
    role: Role,
    extra?: { profession?: string; skills?: string; experience_years?: number; locality?: string; certificateUrl?: string }
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>('CUSTOMER');
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('coop_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('coop_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/v1/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRoleState(data.user.role);
      } else {
        setUser(null);
        setIsAuthModalOpen(true);
      }
    } catch (err) {
      setUser(null);
      setIsAuthModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRoleState(data.user.role);
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRoleState(data.user.role);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (
    name: string,
    phone: string,
    email: string,
    password: string,
    roleToRegister: Role,
    extra?: { profession?: string; skills?: string; experience_years?: number; locality?: string; certificateUrl?: string }
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          role: roleToRegister,
          profession: extra?.profession,
          skills: extra?.skills,
          experience_years: extra?.experience_years,
          locality: extra?.locality,
          certificateUrl: extra?.certificateUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRoleState(data.user.role);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (!user) {
      setIsAuthModalOpen(true);
    }
  };

  const logout = () => {
    setUser(null);
    fetch('/api/v1/auth/logout', { method: 'POST' });
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      role,
      language,
      setLanguage: setLanguageState,
      theme,
      toggleTheme,
      t,
      setRole,
      loginAsDemoUser,
      loginWithCredentials,
      registerUser,
      logout,
      isLoading,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isSettingsOpen,
      setIsSettingsOpen,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

