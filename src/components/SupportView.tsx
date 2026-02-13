
import React from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings } from '../types';

const SupportView: React.FC<{ settings: AppSettings, cornerClass: string }> = ({ settings, cornerClass }) => {
  // Fix: changed 'support' to 'help' as 'support' property does not exist in developerConfig.labels.
  const { help: labels } = developerConfig.labels;
  const isRounded = settings.corners === 'rounded';
  const itemCornerClass = isRounded ? 'rounded-2xl' : 'rounded-none';

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${cornerClass}`}>
        <div className="h-14 flex items-center px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-[0.85em] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{labels.header}</h2>
        </div>

        <div className="p-10">
          <p className="text-[1em] text-slate-600 dark:text-slate-400 mb-10 leading-relaxed text-center italic">
            {labels.quote}
          </p>

          <div className="space-y-4">
            {labels.items.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 ${itemCornerClass}`}>
                <div className="flex items-center gap-4">
                  <span className="text-[1.4em] grayscale">{item.icon}</span>
                  <div>
                    <h4 className="text-[0.7em] font-black uppercase tracking-widest text-slate-400">{item.title}</h4>
                    <p className="text-[1em] font-bold text-slate-800 dark:text-slate-200">{item.val}</p>
                  </div>
                </div>
                <button className="text-[0.7em] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 uppercase tracking-widest">{labels.connectButton}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportView;
