import React from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings } from '../types';
import { THEMES, CORNER_STYLES, FONT_FAMILIES } from '../constants';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  cornerClass: string;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, cornerClass, onExport, onImport, onReset }) => {
  const { settings: labels } = developerConfig.labels;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getThemeLabel = (val: string) => {
    if (val === 'light') return labels.themes.light;
    if (val === 'dark') return labels.themes.dark;
    return labels.themes.system;
  };

  const getCornerLabel = (val: string) => {
    if (val === 'rounded') return labels.corners.rounded;
    return labels.corners.sharp;
  };

  const isRounded = settings.corners === 'rounded';
  const groupCornerClass = isRounded ? 'rounded-2xl' : 'rounded-none';
  const itemCornerClass = isRounded ? 'rounded-lg' : 'rounded-none';
  const controlCornerClass = isRounded ? 'rounded-xl' : 'rounded-none';

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${cornerClass}`}>
        <div className="h-14 flex items-center px-6 lg:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-[0.8em] lg:text-[0.85em] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{labels.header}</h2>
        </div>
        
        <div className="p-4 lg:p-8 space-y-6">
          {/* Appearance Section */}
          <section className={`border border-slate-100 dark:border-slate-800 p-4 lg:p-6 space-y-4 ${groupCornerClass}`}>
            <h3 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400 opacity-80">{labels.appearance}</h3>
            <div className={`flex bg-slate-900/5 dark:bg-white/5 p-1 ${controlCornerClass}`}>
              {THEMES.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => updateSetting('theme', theme.value as any)}
                  className={`flex-1 py-2 text-[0.75em] lg:text-[0.85em] font-bold transition-all ${itemCornerClass} ${
                    settings.theme === theme.value 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 opacity-100' 
                      : 'text-slate-500 dark:text-slate-400 hover:opacity-100 opacity-60'
                  }`}
                >
                  {getThemeLabel(theme.value)}
                </button>
              ))}
            </div>
          </section>

          {/* Interface Style Section */}
          <section className={`border border-slate-100 dark:border-slate-800 p-4 lg:p-6 space-y-4 ${groupCornerClass}`}>
            <h3 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400 opacity-80">{labels.interfaceStyle}</h3>
            <div className={`flex bg-slate-900/5 dark:bg-white/5 p-1 ${controlCornerClass}`}>
              {CORNER_STYLES.map(style => (
                <button
                  key={style.value}
                  onClick={() => updateSetting('corners', style.value as any)}
                  className={`flex-1 py-2 text-[0.75em] lg:text-[0.85em] font-bold transition-all ${itemCornerClass} ${
                    settings.corners === style.value 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 opacity-100' 
                      : 'text-slate-500 dark:text-slate-400 hover:opacity-100 opacity-60'
                  }`}
                >
                  {getCornerLabel(style.value)}
                </button>
              ))}
            </div>
          </section>

          {/* Typography Section */}
          <section className={`border border-slate-100 dark:border-slate-800 p-4 lg:p-6 space-y-6 ${groupCornerClass}`}>
            <h3 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400 opacity-80">{labels.typography}</h3>
            
            <div className="flex flex-col gap-2 relative">
              <label className="text-[0.75em] lg:text-[0.8em] font-bold text-slate-600 dark:text-slate-300 opacity-80">{labels.fontFamily}</label>
              <div className="relative">
                <select 
                  value={settings.fontFamily}
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border-none p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[0.85em] lg:text-[0.9em] font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all ${controlCornerClass}`}
                >
                  {FONT_FAMILIES.map(font => (
                    <option key={font.value} value={font.value} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">{font.label}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-[0.75em] lg:text-[0.8em] font-bold text-slate-600 dark:text-slate-300 opacity-80">{labels.fontSize}</label>
                <span className={`text-[0.65em] lg:text-[0.7em] bg-slate-900/5 dark:bg-white/5 px-3 py-1 font-bold ${isRounded ? 'rounded-full' : 'rounded-none'}`}>{settings.fontSize}PX</span>
              </div>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100"
              />
            </div>
          </section>

          {/* Data Management Section */}
          <section className={`border border-slate-100 dark:border-slate-800 p-4 lg:p-6 space-y-4 ${groupCornerClass}`}>
            <h3 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400 opacity-80">{labels.dataHeader}</h3>
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <button 
                onClick={onExport}
                className={`w-full lg:flex-1 py-3 lg:py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[0.8em] lg:text-[0.85em] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] ${controlCornerClass} shadow-lg shadow-slate-900/10 dark:shadow-white/5`}
              >
                {labels.exportLabel}
              </button>
              <label className={`w-full lg:flex-1 py-3 lg:py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[0.8em] lg:text-[0.85em] font-black uppercase tracking-widest text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 ${controlCornerClass}`}>
                {labels.importLabel}
                <input type="file" accept=".json" onChange={onImport} className="hidden" />
              </label>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className={`border border-red-100 dark:border-red-900/20 bg-red-50/20 dark:bg-red-900/5 p-4 lg:p-6 space-y-4 ${groupCornerClass}`}>
            <h3 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-red-500 opacity-80">{labels.dangerZone}</h3>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="text-[0.75em] lg:text-[0.8em] font-medium text-slate-600 dark:text-slate-400">
                  {labels.resetDescription}
                </p>
              </div>
              <button 
                onClick={onReset}
                className={`w-full lg:w-auto px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[0.75em] lg:text-[0.8em] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${controlCornerClass} shadow-md shadow-red-500/10`}
              >
                {labels.resetLabel}
              </button>
            </div>
          </section>
        </div>

        <div className="h-12 flex items-center justify-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[0.65em] lg:text-[0.7em] text-slate-400 font-bold uppercase tracking-widest opacity-60 text-center">{labels.autoSave}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
