import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppSettings, TreeMode, TreeRow } from '../types';
import { developerConfig } from '../developerConfig';

interface VirtualizedJsonTreeProps {
  onSelect: (path: string) => void;
  mode: TreeMode;
  settings: AppSettings;
  worker: Worker | null;
  totalRows: number;
  isUpdating?: boolean;
}

const ITEM_HEIGHT = 32;
const BUFFER_COUNT = 15;
const INDENT_WIDTH = 24;

const VirtualizedJsonTree: React.FC<VirtualizedJsonTreeProps> = ({ onSelect, mode, settings, worker, totalRows, isUpdating }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [visibleRows, setVisibleRows] = useState<TreeRow[]>([]);
  // We keep track of the last range AND the last version of totalRows to detect structural changes
  const [lastState, setLastState] = useState({ start: -1, end: -1, totalRows: -1 });

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    if (!worker || containerHeight === 0) return;

    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_COUNT);
    const end = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_COUNT);

    // Trigger fetch if range changed OR if totalRows changed (structural update)
    if (start !== lastState.start || end !== lastState.end || totalRows !== lastState.totalRows) {
      setLastState({ start, end, totalRows });
      worker.postMessage({ type: 'GET_TREE_VIEW', payload: { start, end } });
    }
  }, [scrollTop, containerHeight, totalRows, worker, lastState]);

  useEffect(() => {
    if (!worker) return;
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'TREE_DATA' && e.data.payload.rows) {
        setVisibleRows(e.data.payload.rows);
      }
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [worker]);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    worker?.postMessage({ type: 'TOGGLE_EXPAND', payload: path });
  };

  const handleRecursiveToggle = (node: TreeRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const type = node.isExpanded ? 'COLLAPSE_ALL' : 'EXPAND_ALL';
    worker?.postMessage({ type, payload: node.path });
  };

  const isRounded = settings.corners === 'rounded';
  const smallCornerClass = isRounded ? 'rounded' : 'rounded-none';

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full w-full overflow-auto custom-scrollbar relative">
      <div style={{ height: totalRows * ITEM_HEIGHT, width: '100%', pointerEvents: 'none' }} />
      
      <div 
        className={`absolute top-0 left-0 w-full font-mono text-[0.9em] select-none transition-opacity duration-300 ${isUpdating ? 'opacity-70' : 'opacity-100'}`}
        style={{ transform: `translateY(${lastState.start * ITEM_HEIGHT}px)` }}
      >
        {visibleRows.map((node) => (
          <div 
            key={node.id}
            className={`group flex items-center px-2 border-y border-transparent transition-colors duration-75 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 ${smallCornerClass}`}
            style={{ height: ITEM_HEIGHT }}
          >
            <div className="flex h-full shrink-0">
              {Array.from({ length: node.depth }).map((_, d) => {
                const showLine = d < node.continuationGuides.length - 1 && node.continuationGuides[d];
                return (
                  <div key={d} className="h-full relative" style={{ width: INDENT_WIDTH }}>
                    {showLine && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />}
                    {d === node.depth - 1 && (
                      <>
                        <div className="absolute left-1/2 top-0 h-1/2 w-px bg-slate-200 dark:bg-slate-800" />
                        {!node.isLastChild && <div className="absolute left-1/2 top-1/2 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />}
                        <div className="absolute left-1/2 right-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {node.hasChildren ? (
              <button 
                onClick={(e) => toggleExpand(node.path, e)}
                disabled={isUpdating}
                className={`w-5 h-5 flex items-center justify-center mr-1.5 transition-all z-10 ${smallCornerClass} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0 shadow-sm disabled:opacity-50`}
              >
                <span className={`text-[0.5em] transition-transform duration-200 ${node.isExpanded ? 'rotate(0)' : '-rotate-90'}`}>▼</span>
              </button>
            ) : (
              <span className="w-5 mr-1.5 shrink-0" />
            )}
            
            <span className="text-purple-600 dark:text-purple-400 font-semibold truncate max-w-[200px] shrink-0">{node.key}:</span>
            
            <span className={`ml-2 truncate opacity-90 ${
              node.valueType === 'string' ? 'text-emerald-600 dark:text-emerald-400' :
              node.valueType === 'number' ? 'text-blue-600 dark:text-blue-400' :
              node.valueType === 'boolean' ? 'text-orange-600 dark:text-orange-400' :
              'text-slate-400 italic text-[0.75em]'
            }`}>
              {node.valueSnippet}
            </span>

            <div className="flex-1" />
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pl-4 shrink-0">
              <button
                onClick={() => onSelect(node.path)}
                title="Select Path"
                disabled={isUpdating}
                className="flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition-transform active:scale-95 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              {node.hasChildren && (
                <button
                  onClick={(e) => handleRecursiveToggle(node, e)}
                  disabled={isUpdating}
                  title={node.isExpanded ? "Collapse Branch" : "Expand Branch"}
                  className={`flex items-center justify-center w-6 h-6 text-white rounded shadow-sm transition-all active:scale-95 text-[0.9em] font-black disabled:opacity-50 ${node.isExpanded ? 'bg-slate-400 hover:bg-slate-500' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {node.isExpanded ? '−' : '+'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {totalRows === 0 && !isUpdating && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 italic text-[0.8em] gap-2">
          <span className="font-black uppercase tracking-widest opacity-60">Optimized for Large Data</span>
          <span className="text-[0.9em] text-center max-w-[250px] leading-relaxed">
            Awaiting input. Optimized for high-performance <span className="font-bold text-blue-500">local-first</span> processing of massive datasets.
          </span>
          <span className="text-[0.7em] opacity-40 uppercase tracking-tighter">Powered by Worker-Thread Engine</span>
        </div>
      )}
    </div>
  );
};

export default VirtualizedJsonTree;
