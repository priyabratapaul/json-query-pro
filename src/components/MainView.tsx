import React, { useState, useEffect, useRef, useCallback } from 'react';
import { developerConfig } from '../developerConfig';
import { AppSettings, QueryMode, TreeMode, SavedQuery } from '../types';
import VirtualizedJsonTree from './VirtualizedJsonTree';
import QueryEditor from './QueryEditor';
import QueryResult from './QueryResult';
import Popover from './Popover';
import { translatePathToSql, jsonToCsv } from '../utils/jsonQuery';

import ProcessorWorker from '../processor.worker?worker';

interface MainViewProps {
  jsonData: any;
  setJsonData: (data: any) => void;
  settings: AppSettings;
  savedQueries: SavedQuery[];
  setSavedQueries: React.Dispatch<React.SetStateAction<SavedQuery[]>>;
}

const MainView: React.FC<MainViewProps> = ({ jsonData, setJsonData, settings, savedQueries, setSavedQueries }) => {
  const [standardQuery, setStandardQuery] = useState<string>(() => localStorage.getItem('json_query_standard') || '$');
  const [sqlQuery, setSqlQuery] = useState<string>(() => localStorage.getItem('json_query_sql') || '$');
  const [queryMode, setQueryMode] = useState<QueryMode>(() => (localStorage.getItem('json_query_mode') as QueryMode) || 'standard');
  const [treeMode, setTreeMode] = useState<TreeMode>('view');
  const [queryResult, setQueryResult] = useState<any>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTreeUpdating, setIsTreeUpdating] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [isLargeMode, setIsLargeMode] = useState(false);
  const [currentFileSizeMB, setCurrentFileSizeMB] = useState(0);
  
  const [autoExecute, setAutoExecute] = useState<boolean>(() => {
    const saved = localStorage.getItem('json_query_auto_execute');
    return saved !== null ? saved === 'true' : developerConfig.features.autoExecuteQuery;
  });
  
  const [treeWidth, setTreeWidth] = useState<number>(() => {
    const saved = localStorage.getItem('json_query_tree_width');
    return saved ? parseFloat(saved) : 45;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const workerRef = useRef<Worker | null>(null);
  const [isClearPopoverOpen, setIsClearPopoverOpen] = useState(false);
  const clearBtnRef = useRef<HTMLButtonElement>(null);

  const { main: labels } = developerConfig.labels;

  // Function to download Blobs (efficient for large files)
  const downloadBlob = useCallback((data: Uint8Array, fileName: string, mimeType: string) => {
    const blob = new Blob([data] as BlobPart[], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadText = useCallback((content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content] as BlobPart[], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Worker Lifecycle: Initialize once on mount
  useEffect(() => {
    const worker = new ProcessorWorker();
    workerRef.current = worker;
    
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'RESULT') {
        setQueryResult(payload);
        setIsProcessing(false);
      } else if (type === 'PROGRESS') {
        setLoadProgress(payload);
      } else if (type === 'UPDATING_TREE') {
        setIsTreeUpdating(payload);
      } else if (type === 'READY') {
        setIsProcessing(false);
        setLoadProgress(0);
        setTotalRows(payload.totalRows);
        setCurrentFileSizeMB(payload.size / (1024 * 1024));
        if (payload.data) {
          setIsLargeMode(false);
        } else {
          setIsLargeMode(true);
        }
      } else if (type === 'TREE_DATA') {
        if (payload.totalRows !== undefined) setTotalRows(payload.totalRows);
      } else if (type === 'EXPORT_READY') {
        setIsProcessing(false);
        const { data, mimeType, fileName } = payload;
        downloadBlob(data, fileName, mimeType);
      } else if (type === 'ERROR') {
        setIsProcessing(false);
        setQueryResult(`Engine Error: ${payload}`);
      }
    };

    // Send initial data if available
    if (jsonData && Object.keys(jsonData).length > 0) {
      worker.postMessage({ type: 'INIT_DATA', payload: jsonData });
    }

    return () => {
      worker.terminate();
    };
  }, [downloadBlob]); // Remove jsonData to keep worker alive

  // Data Sync: Send INIT_DATA when jsonData changes without killing worker
  useEffect(() => {
    if (workerRef.current && jsonData) {
       workerRef.current.postMessage({ type: 'INIT_DATA', payload: jsonData });
    }
  }, [jsonData]);

  useEffect(() => {
    localStorage.setItem('json_query_standard', standardQuery);
    localStorage.setItem('json_query_sql', sqlQuery);
    localStorage.setItem('json_query_mode', queryMode);
    localStorage.setItem('json_query_tree_width', treeWidth.toString());
    localStorage.setItem('json_query_auto_execute', autoExecute.toString());
  }, [standardQuery, sqlQuery, queryMode, treeWidth, autoExecute]);

  const handleExecute = () => {
    if (!workerRef.current) return;
    setIsProcessing(true);
    const activeQuery = queryMode === 'standard' ? standardQuery : sqlQuery;
    workerRef.current.postMessage({ 
      type: 'QUERY', 
      payload: { queryStr: activeQuery, mode: queryMode } 
    });
  };

  useEffect(() => {
    if (autoExecute) handleExecute();
  }, [standardQuery, sqlQuery, queryMode, jsonData, autoExecute]);

  const handleTreeSelect = (path: string) => {
    setStandardQuery(path);
    setSqlQuery(translatePathToSql(path));
  };

  const handleExportRequest = (format: 'json' | 'csv') => {
    if (!workerRef.current) return;

    if (typeof queryResult === 'string' && queryResult.startsWith('__LARGE_RESULT_SUMMARY__:')) {
        setIsProcessing(true);
        workerRef.current.postMessage({ type: 'REQUEST_EXPORT', payload: { format } });
    } else {
        if (queryResult === undefined || queryResult === "__NO_DATA__") return;
        
        if (format === 'json') {
            downloadText(JSON.stringify(queryResult, null, 2), `export_${Date.now()}.json`, 'application/json');
        } else {
            downloadText(jsonToCsv(queryResult), `export_${Date.now()}.csv`, 'text/csv');
        }
    }
  };

  const handleApplyRawJson = () => {
    try {
      const inputSizeMB = (new Blob([rawJsonValue] as BlobPart[]).size / (1024 * 1024));
      if (inputSizeMB > developerConfig.limits.maxFileSizeMB) {
        alert(`Input size (${inputSizeMB.toFixed(1)}MB) exceeds the current safety threshold.`);
        return;
      }

      const parsed = JSON.parse(rawJsonValue);
      setJsonData(parsed);
      setTreeMode('view');
    } catch (e) {
      alert(labels.invalidJson);
    }
  };

  const confirmClearData = () => {
    setJsonData({});
    setStandardQuery('$');
    setSqlQuery('$');
    setQueryResult("__NO_DATA__");
    setTotalRows(0);
    setIsLargeMode(false);
    setCurrentFileSizeMB(0);
    setIsClearPopoverOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > developerConfig.limits.maxFileSizeMB) {
      setQueryResult(`Engine Error: File size (${fileSizeMB.toFixed(1)}MB) exceeds limit of ${developerConfig.limits.maxFileSizeMB}MB.`);
      setIsProcessing(false);
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setLoadProgress(0);
    setQueryResult(undefined);
    workerRef.current?.postMessage({ type: 'INIT_DATA', payload: file });
    setStandardQuery('$');
    setSqlQuery('$');
    setTreeMode('view');
  };

  const [rawJsonValue, setRawJsonValue] = useState('');
  useEffect(() => {
    if (treeMode === 'edit') setRawJsonValue(JSON.stringify(jsonData, null, 2));
  }, [treeMode, jsonData]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidthPercent >= 20 && newWidthPercent <= 80) setTreeWidth(newWidthPercent);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const isRounded = settings.corners === 'rounded';
  const cornerClass = isRounded ? 'rounded-2xl' : 'rounded-none';
  const smallCornerClass = isRounded ? 'rounded-md' : 'rounded-none';
  const buttonCornerClass = isRounded ? 'rounded-lg' : 'rounded-none';

  return (
    <div ref={containerRef} className={`flex flex-col lg:flex-row h-full gap-4 lg:gap-0 relative overflow-y-auto lg:overflow-hidden custom-scrollbar ${isResizing ? 'select-none' : ''}`}>
      {/* Loading Animation Box */}
      {isProcessing && (
        <div className="absolute inset-0 z-[100] bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className={`p-8 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300 ${cornerClass}`}>
             <div className="flex space-x-2">
               <div className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse"></div>
               <div className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
               <div className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
             </div>
          </div>
        </div>
      )}

      <div 
        style={{ flexBasis: window.innerWidth >= 1024 ? `${treeWidth}%` : 'auto' }}
        className={`flex-none h-[45vh] lg:h-full min-w-0 flex flex-col bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 ${cornerClass} overflow-hidden`}
      >
        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="h-12 flex items-center justify-between px-3 lg:px-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 mr-2 truncate">
              <div className="flex flex-col">
                <h2 className="text-[0.75em] lg:text-[0.85em] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">{labels.treeHeader}</h2>
              </div>
            </div>
            <div className="flex gap-1 lg:gap-2 items-center shrink-0">
              {isTreeUpdating && (
                <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin mr-2" />
              )}
              <div className={`flex items-center bg-slate-200/50 dark:bg-slate-800 p-0.5 ${smallCornerClass}`}>
                <button onClick={() => setTreeMode('view')} className={`px-2 lg:px-4 py-1 text-[0.65em] lg:text-[0.7em] font-bold transition-all ${smallCornerClass} ${treeMode === 'view' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}`}>{labels.treeModes.view}</button>
                <button disabled={isLargeMode} onClick={() => setTreeMode('edit')} className={`px-2 lg:px-4 py-1 text-[0.65em] lg:text-[0.7em] font-bold transition-all ${smallCornerClass} ${treeMode === 'edit' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'} disabled:opacity-30 disabled:cursor-not-allowed`}>{labels.treeModes.edit}</button>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1 opacity-50" />
                <label className={`cursor-pointer px-2 lg:px-3 py-1 text-[0.65em] lg:text-[0.7em] font-bold transition-all ${smallCornerClass} text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 uppercase`}>
                  {labels.loadButton}
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
                <button ref={clearBtnRef} onClick={() => setIsClearPopoverOpen(!isClearPopoverOpen)} className={`px-2 lg:px-3 py-1 text-[0.65em] lg:text-[0.7em] font-bold transition-all ${smallCornerClass} text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 uppercase`}>{labels.clearButton}</button>
              </div>
            </div>
          </div>
          {treeMode === 'edit' && (
            <div className="px-4 py-2 flex justify-end gap-2 bg-slate-100/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800/50 shrink-0">
              <button onClick={() => setTreeMode('view')} className="px-3 py-1 text-[0.65em] font-bold text-slate-400 uppercase">Cancel</button>
              <button onClick={handleApplyRawJson} className="px-4 py-1 text-[0.65em] font-bold bg-blue-500 text-white uppercase rounded shadow-sm">Apply</button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-white dark:bg-slate-900 relative">
          {treeMode === 'edit' ? (
            <textarea value={rawJsonValue} onChange={(e) => setRawJsonValue(e.target.value)} className="w-full h-full bg-slate-50 dark:bg-slate-950 p-4 font-mono text-[0.9em] border-none focus:ring-0 resize-none" spellCheck={false} />
          ) : (
            <VirtualizedJsonTree 
              onSelect={handleTreeSelect} 
              mode={treeMode} 
              settings={settings} 
              worker={workerRef.current} 
              totalRows={totalRows}
              isUpdating={isTreeUpdating}
            />
          )}
        </div>
      </div>

      <div onMouseDown={startResizing} className="hidden lg:flex flex-none w-2 cursor-col-resize items-center justify-center group z-[60] relative">
        <div className={`absolute transition-all duration-300 transform ${isResizing ? 'scale-110 opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90'} flex items-center justify-center w-8 h-8 rounded-full shadow-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-xs font-black`}><span className="tracking-tighter">&lt;&gt;</span></div>
        <div className={`w-px h-16 bg-slate-200 dark:bg-slate-800 rounded-full transition-all group-hover:h-32 group-hover:bg-blue-400 ${isResizing ? 'h-full bg-blue-500 opacity-20' : ''}`} />
      </div>

      <div className="flex-none lg:flex-1 lg:min-w-0 flex flex-col gap-4 lg:gap-6 lg:pl-1">
        <div className={`flex-none h-[30vh] lg:flex-1 flex flex-col bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 ${cornerClass} overflow-hidden`}>
          <QueryEditor 
            query={queryMode === 'standard' ? standardQuery : sqlQuery} 
            setQuery={queryMode === 'standard' ? setStandardQuery : setSqlQuery} 
            mode={queryMode} setMode={setQueryMode} onExecute={handleExecute}
            onLoadSaved={(q) => { setQueryMode(q.mode); if (q.mode === 'standard') setStandardQuery(q.query); else setSqlQuery(q.query); }}
            savedQueries={savedQueries} setSavedQueries={setSavedQueries} settings={settings} autoExecute={autoExecute} setAutoExecute={setAutoExecute}
          />
        </div>
        <div className={`flex-none h-[40vh] lg:flex-1 flex flex-col bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 ${cornerClass} overflow-hidden`}>
          <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <h2 className="text-[0.75em] lg:text-[0.85em] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Result View</h2>
            <div className="flex gap-2 lg:gap-4 items-center shrink-0">
              <button onClick={async () => { if (queryResult === undefined || queryResult === "__NO_DATA__") return; await navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2)); }} className="text-[0.65em] lg:text-[0.7em] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 uppercase">COPY RESULT</button>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
              <div className="flex gap-2">
                <button onClick={() => handleExportRequest('json')} className="text-[0.65em] lg:text-[0.7em] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 uppercase">JSON</button>
                <button onClick={() => handleExportRequest('csv')} className="text-[0.65em] lg:text-[0.7em] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 uppercase">CSV</button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-slate-50/30 dark:bg-slate-950/20 custom-scrollbar">
            <QueryResult 
                result={queryResult} 
                settings={settings} 
                onExportRequest={handleExportRequest} 
            />
          </div>
        </div>
      </div>

      <Popover isOpen={isClearPopoverOpen} onClose={() => setIsClearPopoverOpen(false)} anchorEl={clearBtnRef.current} settings={settings} width="w-[85vw] lg:w-72">
        <div className="p-4 space-y-3">
          <p className="text-[0.8em] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Clear all data?</p>
          <p className="text-[0.75em] text-slate-500 dark:text-slate-400">This will reset the tree and queries.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsClearPopoverOpen(false)} className="px-3 py-1.5 text-[0.7em] font-bold text-slate-400 uppercase">Cancel</button>
            <button onClick={confirmClearData} className={`px-4 py-1.5 bg-red-500 text-white text-[0.75em] font-black uppercase tracking-widest ${buttonCornerClass}`}>Clear</button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default MainView;
