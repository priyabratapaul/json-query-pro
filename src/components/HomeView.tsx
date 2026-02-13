
import React from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings, AppTab } from '../types';

interface HomeViewProps {
  settings: AppSettings;
  cornerClass: string;
  onNavigate: (tab: AppTab) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ settings, cornerClass, onNavigate }) => {
  const { home: labels } = developerConfig.labels;
  const isRounded = settings.corners === 'rounded';
  const logoCornerClass = isRounded ? 'rounded-3xl' : 'rounded-none';
  const buttonCornerClass = isRounded ? 'rounded-full' : 'rounded-none';

  return (
    <div className="max-w-4xl mx-auto min-h-full flex items-center justify-center py-4 lg:py-0">
      <div className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 lg:p-12 text-center ${cornerClass}`}>
        <div className="flex flex-col items-center mb-8 lg:mb-10">
          <div className={`w-16 h-16 lg:w-24 lg:h-24 bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 text-[1.8em] lg:text-[2.5em] font-black shadow-2xl mb-6 lg:mb-8 ${logoCornerClass}`}>
            {`{ }`}
          </div>
          <h1 className="text-[1.5em] lg:text-[2.2em] font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4 px-2">
            {labels.welcome}
          </h1>
          <div className="max-w-lg mx-auto mb-8 lg:mb-10 px-2">
            <p className="text-[0.9em] lg:text-[1.1em] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {labels.featureDescription}
            </p>
          </div>
          
          <button 
            onClick={() => onNavigate('Main')}
            className={`bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 lg:px-10 py-3 lg:py-4 text-[0.8em] lg:text-[0.9em] font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-xl ${buttonCornerClass}`}
          >
            {labels.cta}
          </button>
        </div>

        <div className="pt-6 lg:pt-8 border-t border-slate-100 dark:border-slate-800">
          <a href={labels.devProfileUrl} target="_blank" rel="noopener noreferrer">
            <p className="text-[0.6em] lg:text-[0.7em] font-black text-slate-400 uppercase tracking-[0.4em] hover:scale-105 duration:900 transform transition-transform">
              Created by: {labels.devName}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
