import React from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings } from '../types';

interface QueryResultProps {
  result: any;
  settings?: AppSettings;
  onExportRequest?: (format: 'json' | 'csv') => void;
}

const QueryResult: React.FC<QueryResultProps> = ({ result, settings, onExportRequest }) => {
  const { results: labels } = developerConfig.labels;

  // Specific state for when the application has no JSON data active
  if (result === "__NO_DATA__") {
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-slate-400 p-8 text-center italic">
        <div className="w-16 h-16 mb-4 opacity-10 flex items-center justify-center border-4 border-dashed border-current rounded-3xl animate-pulse">
           <span className="text-2xl">{`{ }`}</span>
        </div>
        <p className="text-[1em] font-bold uppercase tracking-widest opacity-60 mb-2">Awaiting Source</p>
        <p className="text-[0.75em] opacity-40 leading-relaxed uppercase tracking-tighter max-w-[200px]">
          {labels.noDataLoaded}
        </p>
      </div>
    );
  }

  const isRounded = settings?.corners === 'rounded';
  const buttonCornerClass = isRounded ? 'rounded-lg' : 'rounded-none';

  // Handle summarized large results from worker
  if (typeof result === 'string' && result.startsWith('__LARGE_RESULT_SUMMARY__:')) {
    const summaryText = result.split('__LARGE_RESULT_SUMMARY__:')[1];
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-slate-400 p-6 lg:p-8 text-center bg-amber-50/10 dark:bg-amber-900/5 transition-all animate-in fade-in duration-500">
        <div className="w-12 h-12 lg:w-16 lg:h-16 mb-4 opacity-20 text-amber-500 shrink-0">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <p className="text-[0.7em] lg:text-[0.85em] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Payload Too Large for Preview</p>
        <p className="text-[0.9em] lg:text-[1.1em] font-mono text-slate-800 dark:text-slate-200 mb-6 font-bold break-all">{summaryText}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-[280px] sm:max-w-none justify-center">
          <button 
            onClick={() => onExportRequest?.('json')}
            className={`w-full sm:w-auto px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[0.7em] lg:text-[0.75em] font-black uppercase tracking-[0.2em] shadow-lg transition-transform active:scale-95 ${buttonCornerClass}`}
          >
            Export JSON
          </button>
          <button 
            onClick={() => onExportRequest?.('csv')}
            className={`w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-[0.7em] lg:text-[0.75em] font-black uppercase tracking-[0.2em] shadow-lg transition-transform active:scale-95 ${buttonCornerClass}`}
          >
            Export CSV
          </button>
        </div>

        <p className="text-[0.65em] lg:text-[0.7em] text-slate-500 dark:text-slate-400 max-w-[320px] leading-relaxed px-4">
          The result of this query exceeds browser memory limits for real-time text rendering. Use the buttons above to download the full dataset.
        </p>
      </div>
    );
  }

  // result is undefined when JSONata/Path finds absolutely no matches
  if (result === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-slate-400 p-8 text-center italic">
        <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[1.1em] font-medium">{labels.noData}</p>
        <p className="text-[0.75em] mt-2 opacity-50 not-italic uppercase tracking-widest font-bold">The path does not exist in the source JSON</p>
      </div>
    );
  }

  // Handle actual JSON null values
  if (result === null) {
    return (
      <div className="flex items-center justify-center min-h-full font-mono text-slate-400 uppercase tracking-[0.3em] font-black text-[1.2em]">
        null
      </div>
    );
  }

  // Visual feedback for empty data structures
  const isEmptyObject = typeof result === 'object' && !Array.isArray(result) && Object.keys(result).length === 0;
  const isEmptyArray = Array.isArray(result) && result.length === 0;

  if (isEmptyObject || isEmptyArray) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-slate-400 p-8 text-center">
        <div className="font-mono text-[2em] opacity-20 mb-2">{isEmptyArray ? '[]' : '{}'}</div>
        <p className="text-[0.8em] font-bold uppercase tracking-widest opacity-40">
          {isEmptyArray ? 'Empty Array' : 'Empty Object'}
        </p>
      </div>
    );
  }

  const isError = typeof result === 'string' && result.startsWith('Engine Error:');
  
  let formatted = '';
  try {
    formatted = JSON.stringify(result, null, 2);
  } catch (e) {
    formatted = String(result);
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar p-1">
      <pre className={`font-mono text-[1em] whitespace-pre-wrap break-all ${
        isError 
          ? 'text-red-500 dark:text-red-400 font-bold p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl shadow-inner' 
          : 'text-slate-800 dark:text-slate-200'
      }`}>
        {formatted}
      </pre>
    </div>
  );
};

export default QueryResult;
