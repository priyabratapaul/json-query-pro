import React from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings } from '../types';

const HelpView: React.FC<{ settings: AppSettings, cornerClass: string }> = ({ settings, cornerClass }) => {
  const { help: labels } = developerConfig.labels;
  const isRounded = settings.corners === 'rounded';
  const cardCornerClass = isRounded ? 'rounded-xl' : 'rounded-none';

  return (
    <div className="max-w-5xl mx-auto py-2">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${cornerClass}`}>
        <div className="h-14 flex items-center px-6 lg:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-[0.8em] lg:text-[0.85em] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{labels.header}</h2>
        </div>

        <div className="p-6 lg:p-10 space-y-12">
          {/* Header Summary */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
             <h1 className="text-[1.2em] lg:text-[1.5em] font-black text-slate-900 dark:text-white uppercase tracking-tight">Query Guide</h1>
             <p className="text-[0.85em] lg:text-[0.95em] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                {labels.quote}
             </p>
          </div>

          {/* Tabular Sample Queries */}
          <div className="space-y-6">
            <h3 className="text-[0.7em] font-black uppercase tracking-widest text-slate-400 opacity-80 text-center">{labels.sampleQueriesHeader}</h3>
            
            <div className={`overflow-x-auto border border-slate-100 dark:border-slate-800 ${cardCornerClass}`}>
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[0.65em] font-black uppercase tracking-widest text-slate-400 w-1/3">Search Criteria</th>
                    <th className="px-6 py-4 text-[0.65em] font-black uppercase tracking-widest text-slate-400 w-1/3">Path (JS)</th>
                    <th className="px-6 py-4 text-[0.65em] font-black uppercase tracking-widest text-blue-500 w-1/3">JSONata Query</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {labels.samples.map((sample, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-[0.85em] font-bold text-slate-800 dark:text-slate-200 mb-1">{sample.title}</div>
                        <div className="text-[0.7em] text-slate-500 dark:text-slate-400 leading-tight">{sample.desc}</div>
                      </td>
                      <td className="px-6 py-5">
                        <code className="text-[0.75em] font-mono text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                          {sample.path}
                        </code>
                      </td>
                      <td className="px-6 py-5">
                        <code className="text-[0.75em] font-mono text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100/50 dark:border-blue-800/50">
                          {sample.sql}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple Contact Footer - Commented out as requested */}
          {/*
          <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 px-4 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="text-[0.65em] font-black uppercase tracking-widest text-slate-400">{labels.supportHeader}</h4>
              <p className="text-[0.8em] text-slate-500 font-medium">support@jsonquerypro.dev</p>
            </div>
            <div className="flex gap-4">
               {labels.items.slice(1).map((item, idx) => (
                 <a key={idx} href={`https://${item.val}`} target="_blank" rel="noreferrer" className="text-[0.7em] font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest">
                    {item.title.split(' ')[0]}
                 </a>
               ))}
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default HelpView;
