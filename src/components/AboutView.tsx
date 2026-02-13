
import React from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings } from '../types';

const AboutView: React.FC<{ settings: AppSettings, cornerClass: string }> = ({ settings, cornerClass }) => {
  const { about: labels } = developerConfig.labels;
  const isRounded = settings.corners === 'rounded';
  const logoCornerClass = isRounded ? 'rounded-3xl' : 'rounded-none';
  const devCardCornerClass = isRounded ? 'rounded-2xl' : 'rounded-none';
  const pillCornerClass = isRounded ? 'rounded-full' : 'rounded-none';

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${cornerClass}`}>
        <div className="h-14 flex items-center px-6 lg:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-[0.8em] lg:text-[0.85em] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{labels.header}</h2>
        </div>

        <div className="p-6 lg:p-12">
          <div className="flex flex-col items-center mb-8 lg:mb-12">
            <div className={`w-16 h-16 lg:w-20 lg:h-20 bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 text-[1.8em] lg:text-[2.1em] font-black shadow-xl mb-6 ${logoCornerClass}`}>
              {`{ }`}
            </div>
            <h2 className="text-[1.4em] lg:text-[1.7em] font-black text-slate-900 dark:text-white tracking-tight uppercase text-center">{labels.appName}</h2>
            <p className="text-[0.6em] lg:text-[0.7em] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{labels.version}</p>
          </div>

          <div className="space-y-8 lg:space-y-10 text-center max-w-lg mx-auto">
            <div className="space-y-3 lg:space-y-4">
              <h4 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400">{labels.visionHeader}</h4>
              <p className="text-[0.9em] lg:text-[1em] text-slate-600 dark:text-slate-400 leading-relaxed">
                {labels.visionText}
              </p>
            </div>
            
            <div className="space-y-3 lg:space-y-4 pt-6 lg:pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400">{labels.archHeader}</h4>
              <p className="text-[0.9em] lg:text-[1em] text-slate-600 dark:text-slate-400 leading-relaxed">
                {labels.archText}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center">
              <h4 className="text-[0.65em] lg:text-[0.7em] font-black uppercase tracking-widest text-slate-400 mb-6">{labels.devHeader}</h4>
              <div className={`flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-800 ${devCardCornerClass}`}>
                {/*<img src="https://picsum.photos/100/100?grayscale" className={`w-10 h-10 grayscale opacity-80 ${pillCornerClass}`} alt="Developer" />*/}
                 <div className="text-center">
                    <a href={labels.devProfileUrl} target="_blank" rel="noopener noreferrer">
                      <p className="text-[0.8em] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-tight">{labels.devName}</p>
                      {/* <p className="text-[0.7em] text-slate-500 dark:text-slate-400 mt-0.5 tracking-tighter">{labels.devRole}</p> */}
                    </a>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-auto py-4  px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-[0.65em] text-slate-400 font-bold uppercase gap-2 lg:gap-0 text-center">
          <p>{labels.copyright}</p>
          {/* <span>{labels.license}</span> */}
        </div>
      </div>
    </div>
  );
};

export default AboutView;
