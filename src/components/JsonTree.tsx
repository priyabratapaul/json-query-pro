
import React, { useState } from 'react';
import { JsonNodeProps, AppSettings } from '../types';

interface ExtendedJsonNodeProps extends JsonNodeProps {
  settings?: AppSettings;
}

const JsonTree: React.FC<ExtendedJsonNodeProps> = ({ data, name, path, onSelect, depth, mode, settings }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);
  const keys = isObject ? Object.keys(data) : [];

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'select') {
      onSelect(path);
    } else if (isObject) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderValue = (val: any) => {
    if (val === null) return <span className="text-gray-400">null</span>;
    if (typeof val === 'string') return <span className="text-emerald-600 dark:text-emerald-400">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-blue-600 dark:text-blue-400">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-orange-600 dark:text-orange-400">{String(val)}</span>;
    return null;
  };

  const indentation = depth * 16;
  const isRounded = settings?.corners === 'rounded';
  const smallCornerClass = isRounded ? 'rounded' : 'rounded-none';

  return (
    <div className="font-mono text-[1em]">
      <div 
        onClick={handleClick}
        className={`group flex items-center py-0.5 px-1 border border-transparent cursor-pointer transition-colors duration-200 ${smallCornerClass} ${
          mode === 'select' 
            ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200/50 dark:hover:border-blue-800/50' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <span style={{ width: indentation }} />
        
        {isObject ? (
          <button 
            onClick={toggleExpand}
            className="w-4 h-4 flex items-center justify-center mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform"
            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <span className="text-[0.7em]">▼</span>
          </button>
        ) : (
          <span className="w-4 mr-1" />
        )}

        <span className="text-purple-600 dark:text-purple-400 font-semibold">{name}:</span>
        
        {!isObject && (
          <span className="ml-2">{renderValue(data)}</span>
        )}
        
        {isObject && !isExpanded && (
          <span className="ml-2 text-slate-400 italic text-[0.7em]">
            {isArray ? `[Array(${data.length})]` : `{Object(${keys.length})}`}
          </span>
        )}
      </div>

      {isObject && isExpanded && (
        <div className="border-l border-slate-200 dark:border-slate-800 ml-2">
          {keys.map((key) => {
            const currentPath = isArray 
              ? `${path}[${key}]` 
              : `${path}.${key}`;
            
            return (
              <JsonTree 
                key={currentPath}
                data={data[key]}
                name={key}
                path={currentPath}
                onSelect={onSelect}
                depth={depth + 1}
                mode={mode}
                settings={settings}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JsonTree;
