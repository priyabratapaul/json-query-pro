import React, { useState, useRef, useEffect, useMemo } from 'react';
import { developerConfig } from '../developerConfig';
import { QueryMode, AppSettings, SavedQuery } from '../types';
import Popover from './Popover';
import { getAllKeys, getKeysAtLevel } from '../utils/jsonQuery';

interface QueryEditorProps {
  query: string;
  setQuery: (query: string) => void;
  mode: QueryMode;
  setMode: (mode: QueryMode) => void;
  onExecute: () => void;
  onLoadSaved: (q: SavedQuery) => void;
  savedQueries: SavedQuery[];
  setSavedQueries: React.Dispatch<React.SetStateAction<SavedQuery[]>>;
  settings: AppSettings;
  autoExecute: boolean;
  setAutoExecute: (val: boolean) => void;
  autoSuggestions: boolean;
  setAutoSuggestions: (val: boolean) => void;
  jsonData: any;
}

const QueryEditor: React.FC<QueryEditorProps> = ({ 
  query, 
  setQuery, 
  mode, 
  setMode, 
  onExecute, 
  onLoadSaved,
  savedQueries,
  setSavedQueries,
  settings,
  autoExecute,
  setAutoExecute,
  autoSuggestions,
  setAutoSuggestions,
  jsonData
}) => {
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [querySaveName, setQuerySaveName] = useState('');
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const { editor: labels } = developerConfig.labels;

  // Extract all keys for fallback autocomplete
  const allKeys = useMemo(() => getAllKeys(jsonData), [jsonData]);

  const handleCopyHeader = async () => {
    if (!query) return;
    try {
      await navigator.clipboard.writeText(query);
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
    } catch (err) {
      console.error("Failed to copy query!", err);
    }
  };

  const handlePerformSave = () => {
    if (!querySaveName.trim()) return;
    const newSavedQuery: SavedQuery = {
      id: crypto.randomUUID(),
      name: querySaveName.trim(),
      query: query,
      mode: mode,
      timestamp: Date.now()
    };
    setSavedQueries(prev => [newSavedQuery, ...prev]);
    setShowSave(false);
    setQuerySaveName('');
  };

  const updateSuggestions = (val: string, pos: number) => {
    if (!autoSuggestions) {
      setShowSuggestions(false);
      return;
    }
    const textBeforeCursor = val.substring(0, pos);
    
    // 1. Determine "base path"
    let basePath = '$';
    let lastSeparatorIndex = -1;
    let insideBackticks = false;
    for (let i = 0; i < textBeforeCursor.length; i++) {
      if (textBeforeCursor[i] === '`') insideBackticks = !insideBackticks;
      if (!insideBackticks) {
        if (textBeforeCursor[i] === '.' || textBeforeCursor[i] === '[' || textBeforeCursor[i] === '(') {
          lastSeparatorIndex = i;
        }
      }
    }

    let segmentAfterSeparator = '';
    if (lastSeparatorIndex !== -1) {
      basePath = textBeforeCursor.substring(0, lastSeparatorIndex);
      segmentAfterSeparator = textBeforeCursor.substring(lastSeparatorIndex + 1);
      if (!basePath || basePath === '$') basePath = '$';
    } else {
      segmentAfterSeparator = textBeforeCursor.replace(/^\$/, '');
      basePath = '$';
    }

    // 2. Determine "current word" from the segment after the separator
    // We look for the last alphanumeric/$ word or backticked string
    const wordMatch = segmentAfterSeparator.match(/(`[^`]*`|[\w$]+)$/);
    const currentWord = wordMatch ? wordMatch[0] : '';

    // Clean up currentWord from backticks for matching
    const searchWord = currentWord.replace(/^`|`$/g, '');

    // 3. Get keys at this level
    // For evaluatePath, we need to clean up backticks from basePath if it's JSONata style
    const cleanBasePath = basePath.replace(/`/g, '');
    let levelKeys = getKeysAtLevel(jsonData, cleanBasePath);
    
    // 4. Fallback to all keys if at root and no keys found
    if (levelKeys.length === 0 && cleanBasePath === '$') {
      levelKeys = allKeys;
    }

    // 5. Filter by current word
    const filtered = levelKeys.filter(k => 
      k.toLowerCase().startsWith(searchWord.toLowerCase()) && k !== searchWord
    );
    
    if (filtered.length > 0) {
      setSuggestions(filtered.slice(0, 10));
      setSuggestionIndex(0);
      setShowSuggestions(true);
      
      // Position estimation
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length;
      const currentChar = lines[lines.length - 1].length;
      setSuggestionPos({
        top: currentLine * 24 + 25,
        left: currentChar * 9 + 20
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setQuery(val);
    updateSuggestions(val, pos);
  };

  const handleCursorMove = () => {
    if (textareaRef.current) {
      updateSuggestions(textareaRef.current.value, textareaRef.current.selectionStart);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBeforeCursor = query.substring(0, pos);
    const textAfterCursor = query.substring(pos);
    
    // Find where the last word starts
    // We look for the last alphanumeric/$ word or backticked string immediately before the cursor
    const wordMatch = textBeforeCursor.match(/(`[^`]*`|[\w$]+)$/);
    const lastWordStart = wordMatch ? wordMatch.index! : pos;
    
    // Logic for backticks in JSONata
    let finalSuggestion = suggestion;
    if (mode === 'sql') {
      const needsBackticks = /^\d/.test(suggestion) || /[^\w$]/.test(suggestion);
      if (needsBackticks) {
        finalSuggestion = `\`${suggestion}\``;
      }
    }

    const newTextBefore = textBeforeCursor.substring(0, lastWordStart) + finalSuggestion;
    setQuery(newTextBefore + textAfterCursor);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newTextBefore.length;
        textareaRef.current.focus();
      }
    }, 0);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const isRounded = settings.corners === 'rounded';
  const smallCornerClass = isRounded ? 'rounded-md' : 'rounded-none';
  const inputCornerClass = isRounded ? 'rounded-xl' : 'rounded-none';
  const buttonCornerClass = isRounded ? 'rounded-lg' : 'rounded-none';
  const togglePillClass = isRounded ? 'rounded-full' : 'rounded-none';

  return (
    <div className="h-full flex flex-col min-w-0 relative">
      {/* Header Row */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <label className="text-[0.65em] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
            {labels.editorLabel}
          </label>
          
          <div className="flex items-center gap-3">
            <div className={`flex bg-slate-200/50 dark:bg-slate-800 p-0.5 ${smallCornerClass}`}>
              <button 
                onClick={() => setMode('standard')}
                className={`px-3 py-0.5 text-[0.7em] font-bold transition-all ${smallCornerClass} ${mode === 'standard' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
              >
                {labels.modes.standard}
              </button>
              <button 
                onClick={() => setMode('sql')}
                className={`px-3 py-0.5 text-[0.7em] font-bold transition-all ${smallCornerClass} ${mode === 'sql' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
              >
                {labels.modes.sql}
              </button>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Auto Execute Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[0.6em] font-black uppercase tracking-tighter transition-colors ${autoExecute ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'}`}>{labels.autoExecuteLabel}</span>
              <button 
                onClick={() => setAutoExecute(!autoExecute)}
                className={`w-8 h-4 relative transition-all duration-300 ${togglePillClass} ${autoExecute ? 'bg-blue-400 dark:bg-blue-500 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <div 
                  className={`absolute top-0.5 w-3 h-3 bg-white transition-all duration-300 shadow-sm ${togglePillClass} ${autoExecute ? 'left-[1.1rem]' : 'left-0.5'}`}
                />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Auto Suggestions Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[0.6em] font-black uppercase tracking-tighter transition-colors ${autoSuggestions ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`}>Suggestions</span>
              <button 
                onClick={() => setAutoSuggestions(!autoSuggestions)}
                className={`w-8 h-4 relative transition-all duration-300 ${togglePillClass} ${autoSuggestions ? 'bg-emerald-400 dark:bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <div 
                  className={`absolute top-0.5 w-3 h-3 bg-white transition-all duration-300 shadow-sm ${togglePillClass} ${autoSuggestions ? 'left-[1.1rem]' : 'left-0.5'}`}
                />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <div className="flex items-center gap-1">
              <button 
                ref={saveBtnRef}
                onClick={() => {
                  setQuerySaveName(`Query ${savedQueries.length + 1}`);
                  setShowSave(!showSave);
                }}
                title="Save current query"
                className={`p-1.5 text-slate-400 hover:text-blue-500 transition-colors ${smallCornerClass}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
              <button 
                ref={historyBtnRef}
                onClick={() => setShowHistory(!showHistory)}
                title="View saved queries"
                className={`p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${smallCornerClass} flex items-center gap-1`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {savedQueries.length > 0 && <span className="text-[0.6em] font-bold bg-slate-200 dark:bg-slate-700 px-1 rounded-full">{savedQueries.length}</span>}
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleCopyHeader}
          disabled={!query}
          className={`text-[0.7em] font-bold transition-all uppercase tracking-wide ${
            copiedHeader 
              ? 'text-emerald-500' 
              : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {copiedHeader ? labels.copiedLabel : labels.copyLabel}
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative p-4 flex flex-col min-w-0">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onSelect={handleCursorMove}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`flex-1 w-full bg-slate-50 dark:bg-slate-950 p-4 font-mono text-[1em] focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 ${inputCornerClass}`}
          placeholder={mode === 'sql' ? labels.placeholders.sql : labels.placeholders.standard}
          spellCheck={false}
        />
        
        {/* Autocomplete Suggestions */}
        {showSuggestions && (
          <div 
            className={`absolute z-[100] bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[150px] ${smallCornerClass}`}
            style={{ 
              top: `${Math.min(suggestionPos.top, (textareaRef.current?.clientHeight || 0) - 100)}px`, 
              left: `${Math.min(suggestionPos.left, (textareaRef.current?.clientWidth || 0) - 150)}px` 
            }}
          >
            {suggestions.map((s, i) => (
              <button
                key={s}
                onClick={() => applySuggestion(s)}
                onMouseEnter={() => setSuggestionIndex(i)}
                className={`w-full text-left px-3 py-1.5 text-[0.85em] font-mono transition-colors ${i === suggestionIndex ? 'bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {s}
              </button>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-700" />
            <button
              onClick={() => setShowSuggestions(false)}
              className="w-full text-left px-3 py-1.5 text-[0.7em] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
            >
              <span>Close</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="absolute bottom-6 right-6">
          <button 
            onClick={onExecute}
            className={`bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 text-[0.75em] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2 ${buttonCornerClass}`}
          >
            {labels.runButton}
          </button>
        </div>
      </div>

      {/* History Popover */}
      <Popover isOpen={showHistory} onClose={() => setShowHistory(false)} anchorEl={historyBtnRef.current} settings={settings} width="w-72">
        <div className="p-2 border-b border-slate-50 dark:border-slate-800 text-[0.65em] font-black uppercase tracking-widest text-slate-400">
          Saved Queries
        </div>
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
          {savedQueries.length === 0 ? (
            <div className="p-4 text-[0.7em] text-slate-400 italic text-center">No saved queries yet</div>
          ) : (
            savedQueries.map(q => (
              <button 
                key={q.id}
                onClick={() => { onLoadSaved(q); setShowHistory(false); }}
                className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
              >
                <div className="text-[0.8em] font-bold text-slate-800 dark:text-slate-200 truncate">{q.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-[0.6em] font-mono text-slate-400 truncate max-w-[70%]">{q.query}</div>
                  <div className="text-[0.55em] font-black px-1.5 bg-slate-100 dark:bg-slate-900/50 rounded uppercase text-slate-500">{q.mode}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </Popover>

      {/* Save Popover */}
      <Popover isOpen={showSave} onClose={() => setShowSave(false)} anchorEl={saveBtnRef.current} settings={settings} width="w-72">
        <div className="p-4 space-y-3">
          <p className="text-[0.8em] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Save current query</p>
          <input 
            type="text" 
            value={querySaveName}
            onChange={(e) => setQuerySaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePerformSave()}
            autoFocus
            className={`w-full bg-slate-100 dark:bg-slate-800 border-none px-3 py-2 text-[0.9em] focus:ring-2 focus:ring-blue-500/50 ${smallCornerClass}`}
            placeholder="e.g. Sales Filter"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button 
              onClick={() => setShowSave(false)} 
              className="px-3 py-1 text-[0.7em] font-bold text-slate-400 uppercase"
            >
              Cancel
            </button>
            <button 
              onClick={handlePerformSave} 
              className={`px-4 py-1.5 bg-blue-500 text-white text-[0.75em] font-black uppercase tracking-widest ${buttonCornerClass}`}
            >
              Save
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default QueryEditor;
