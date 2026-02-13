import React, { useState, useEffect, useCallback } from 'react';
import { developerConfig } from './developerConfig';
import { AppTab, AppSettings, Theme, SavedQuery } from './types';
import HomeView from './components/HomeView';
import MainView from './components/MainView';
import SettingsView from './components/SettingsView';
import HelpView from './components/HelpView';
import AboutView from './components/AboutView';
import Modal from './components/Modal';
import { getLargeData, saveLargeData, clearLargeData } from './utils/db';

const SETTINGS_KEY = 'json_query_pro_settings';
const TAB_KEY = 'json_query_pro_active_tab';
const QUERIES_KEY = 'json_query_pro_saved_queries';

const App: React.FC = () => {
  // Reordered tabs to put Help after Main
  const enabledTabs = (['Home', 'Main', 'Help', 'Settings', 'About'] as AppTab[]).filter((tab) => {
    return tab === 'Home' ||
           tab === 'Main' || 
           (tab === 'Settings') || 
           (tab === 'Help' && developerConfig.features.enableSupportPage) || 
           (tab === 'About' && developerConfig.features.enableAboutPage);
  });

  const getTabFromHash = useCallback((): AppTab | null => {
    const hash = window.location.hash.replace('#/', '');
    const tabMatch = enabledTabs.find(t => t.toLowerCase() === hash.toLowerCase());
    return tabMatch || null;
  }, [enabledTabs]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      theme: developerConfig.defaults.theme,
      corners: developerConfig.defaults.corners,
      fontFamily: developerConfig.defaults.fontFamily,
      fontSize: developerConfig.defaults.fontSize,
    };
  });

  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(() => {
    const saved = localStorage.getItem(QUERIES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse queries", e);
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const hashTab = getTabFromHash();
    if (hashTab) return hashTab;
    const saved = localStorage.getItem(TAB_KEY);
    return (saved as AppTab) || developerConfig.defaults.tab;
  });

  const [jsonData, setJsonData] = useState<any>(developerConfig.defaults.initialJson);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Load Initial Data from IndexedDB (Async)
  useEffect(() => {
    const initData = async () => {
      const persistedData = await getLargeData();
      if (persistedData) {
        setJsonData(persistedData);
      }
      setIsDataLoaded(true);
    };
    initData();
  }, []);

  // Persist Settings & Queries to LocalStorage (Small Data)
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(QUERIES_KEY, JSON.stringify(savedQueries));
  }, [savedQueries]);

  // Persist JSON Data to IndexedDB (Large Data)
  useEffect(() => {
    if (isDataLoaded && jsonData) {
      saveLargeData(jsonData);
    }
  }, [jsonData, isDataLoaded]);

  // Sync hash with state
  useEffect(() => {
    const currentHash = window.location.hash.replace('#/', '');
    if (currentHash.toLowerCase() !== activeTab.toLowerCase()) {
      window.location.hash = `/${activeTab}`;
    }
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hashTab = getTabFromHash();
      if (hashTab && hashTab !== activeTab) {
        setActiveTab(hashTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, getTabFromHash]);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isDark = 
        settings.theme === 'dark' || 
        (settings.theme === 'system' && mediaQuery.matches);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();

    if (settings.theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [settings.theme]);

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setSettings(prev => ({ ...prev, theme: themes[nextIndex] }));
  };

  const getThemeIcon = () => {
    if (settings.theme === 'light') return '☀️';
    if (settings.theme === 'dark') return '🌙';
    return '🖥️';
  };

  // Export/Import
  const exportAllData = () => {
    const bundle = {
      settings,
      savedQueries,
      jsonData,
      exportDate: new Date().toISOString(),
      version: '1.4.0'
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json_query_pro_backup_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) setSettings(data.settings);
        if (data.savedQueries) setSavedQueries(data.savedQueries);
        if (data.jsonData) {
          setJsonData(data.jsonData);
          await saveLargeData(data.jsonData);
        }
        alert("Backup imported successfully!");
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  };

  const executeReset = async () => {
    const keysToClear = [
      SETTINGS_KEY, 
      TAB_KEY, 
      QUERIES_KEY, 
      'json_query_standard',
      'json_query_sql',
      'json_query_mode',
      'json_query_tree_width',
      'json_query_auto_execute'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));
    await clearLargeData();
    window.location.reload();
  };

  const isRounded = settings.corners === 'rounded';
  const cornerClass = isRounded ? 'rounded-2xl' : 'rounded-none';
  const pillCornerClass = isRounded ? 'rounded-full' : 'rounded-none';

  const tabLabels: Record<AppTab, string> = {
    Home: developerConfig.labels.nav.home,
    Main: developerConfig.labels.nav.main,
    Settings: developerConfig.labels.nav.settings,
    Help: developerConfig.labels.nav.help,
    About: developerConfig.labels.nav.about,
  };

  if (!isDataLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse text-slate-400 font-mono text-sm uppercase tracking-widest">
          Waking Engines...
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden ${settings.fontFamily}`} style={{ fontSize: `${settings.fontSize}px` }}>
      {/* Responsive Tab Bar with Theme Toggle */}
      <nav className="flex items-center justify-center py-4 lg:py-6 px-4 z-50 shrink-0">
        <div className={`flex items-center max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 lg:p-1.5 shadow-lg ${pillCornerClass}`}>
          <div className="flex items-center overflow-x-auto custom-scrollbar whitespace-nowrap px-1 lg:px-0 scroll-smooth">
            {enabledTabs.map((tab, index) => (
              <React.Fragment key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 lg:px-8 py-2 text-[0.75em] lg:text-[0.85em] font-bold transition-all duration-200 shrink-0 ${pillCornerClass} ${
                    activeTab === tab 
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {tabLabels[tab].toUpperCase()}
                </button>
                {index < enabledTabs.length - 1 && (
                  <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-0.5 opacity-60 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

          <button
            onClick={toggleTheme}
            className={`w-9 h-9 lg:w-10 lg:h-10 shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[0.9em] lg:text-[1em] shadow-inner ${pillCornerClass}`}
            title={`Toggle Theme: ${settings.theme.toUpperCase()}`}
          >
            {getThemeIcon()}
          </button>
        </div>
      </nav>

      {/* View Container */}
      <main className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 px-4 lg:px-6 pb-4 lg:pb-6 overflow-y-auto custom-scrollbar transition-all duration-300 ${activeTab === 'Home' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <HomeView 
            settings={settings} 
            cornerClass={cornerClass}
            onNavigate={setActiveTab}
          />
        </div>

        <div className={`absolute inset-0 px-4 lg:px-6 pb-4 lg:pb-6 transition-all duration-300 ${activeTab === 'Main' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <MainView 
            jsonData={jsonData} 
            setJsonData={setJsonData} 
            settings={settings} 
            savedQueries={savedQueries}
            setSavedQueries={setSavedQueries}
          />
        </div>
        
        <div className={`absolute inset-0 px-4 lg:px-6 pb-4 lg:pb-6 overflow-y-auto custom-scrollbar transition-all duration-300 ${activeTab === 'Settings' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <SettingsView 
            settings={settings} 
            setSettings={setSettings} 
            cornerClass={cornerClass}
            onExport={exportAllData}
            onImport={importAllData}
            onReset={() => setShowResetModal(true)}
          />
        </div>

        {developerConfig.features.enableSupportPage && (
          <div className={`absolute inset-0 px-4 lg:px-6 pb-4 lg:pb-6 overflow-y-auto custom-scrollbar transition-all duration-300 ${activeTab === 'Help' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <HelpView settings={settings} cornerClass={cornerClass} />
          </div>
        )}

        {developerConfig.features.enableAboutPage && (
          <div className={`absolute inset-0 px-4 lg:px-6 pb-4 lg:pb-6 overflow-y-auto custom-scrollbar transition-all duration-300 ${activeTab === 'About' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <AboutView settings={settings} cornerClass={cornerClass} />
          </div>
        )}
      </main>

      {/* Reset Confirmation Modal */}
      <Modal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        title={developerConfig.labels.settings.resetLabel}
        settings={settings}
        footer={
          <div className="flex gap-2">
            <button 
              onClick={() => setShowResetModal(false)} 
              className="px-4 py-2 text-[0.7em] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase"
            >
              Cancel
            </button>
            <button 
              onClick={executeReset} 
              className={`px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-[0.7em] font-black uppercase tracking-widest transition-transform active:scale-95 ${pillCornerClass}`}
            >
              Confirm Reset
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 flex items-center justify-center rounded-full mx-auto text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="text-center">
            <p className="text-[0.9em] font-bold text-slate-800 dark:text-slate-100">{developerConfig.labels.settings.resetConfirm}</p>
            <p className="text-[0.75em] text-slate-500 dark:text-slate-400 mt-2">{developerConfig.labels.settings.resetDescription}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
