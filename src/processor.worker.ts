import jsonata from 'jsonata';
import { jsonToCsv } from './utils/jsonQuery';

let rawData: any = null;
let lastQueryResult: any = null;
let expandedPaths: Set<string> = new Set(['$']);
let flattenedCache: any[] = [];

// Memory limits for the worker
const WORKER_MAX_SIZE = 1024 * 1024 * 1024; // 1GB limit
const MAX_TRANSFER_SIZE = 20 * 1024 * 1024; // 20MB transfer limit

/**
 * Detects the browser name from the user agent string within the worker context.
 */
const getBrowserName = (): string => {
  const ua = self.navigator.userAgent;
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome")) return "Google Chrome";
  if (ua.includes("Firefox")) return "Mozilla Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari";
  return "The browser";
};

/**
 * Safely estimates if an object is too large for transfer without using JSON.stringify
 * to avoid "allocation size overflow" during structured cloning.
 */
const isTooLargeToTransfer = (obj: any): boolean => {
  if (obj === null || obj === undefined) return false;
  
  let count = 0;
  const maxItems = 40000; 

  const stack = [obj];
  while (stack.length > 0) {
    const current = stack.pop();
    count++;

    if (count > maxItems) return true;

    if (typeof current === 'object' && current !== null) {
      if (Array.isArray(current)) {
        if (current.length > maxItems) return true;
        for (let i = 0; i < Math.min(current.length, 1000); i++) {
          stack.push(current[i]);
        }
      } else {
        const keys = Object.keys(current);
        if (keys.length > 1000) return true;
        for (let i = 0; i < Math.min(keys.length, 100); i++) {
          stack.push(current[keys[i]]);
        }
      }
    } else if (typeof current === 'string' && current.length > MAX_TRANSFER_SIZE) {
      return true;
    }
  }
  return false;
};

const getValueSnippet = (val: any): { snippet: string, type: string } => {
  if (val === null) return { snippet: 'null', type: 'null' };
  const type = typeof val;
  if (type === 'object') {
    if (Array.isArray(val)) return { snippet: `[Array(${val.length})]`, type: 'array' };
    return { snippet: `{Object(${Object.keys(val).length})}`, type: 'object' };
  }
  if (type === 'string') {
    return { 
      snippet: val.length > 80 ? `"${val.substring(0, 80)}..."` : `"${val}"`, 
      type: 'string' 
    };
  }
  return { snippet: String(val), type: type };
};

const updateFlattenedCache = () => {
  if (!rawData) {
    flattenedCache = [];
    return;
  }

  self.postMessage({ type: 'UPDATING_TREE', payload: true });

  const result: any[] = [];
  const flatten = (obj: any, path: string, key: string, depth: number, parentGuides: boolean[], isLast: boolean) => {
    const isObject = typeof obj === 'object' && obj !== null;
    const hasChildren = isObject && Object.keys(obj).length > 0;
    const isExpanded = expandedPaths.has(path);
    const { snippet, type } = getValueSnippet(obj);

    result.push({
      id: path,
      path,
      key,
      valueSnippet: snippet,
      valueType: type,
      depth,
      isExpanded,
      hasChildren,
      isLastChild: isLast,
      continuationGuides: parentGuides
    });

    if (hasChildren && isExpanded) {
      const isArray = Array.isArray(obj);
      const entries = Object.entries(obj);
      const limit = 5000;
      entries.slice(0, limit).forEach(([k, v], index) => {
        const childIsLast = index === Math.min(entries.length, limit) - 1;
        const childPath = isArray ? `${path}[${k}]` : `${path}.${k}`;
        const nextGuides = [...parentGuides, !childIsLast];
        flatten(v, childPath, k, depth + 1, nextGuides, childIsLast);
      });
      
      if (entries.length > limit) {
        result.push({
          id: `${path}_truncated`,
          path: `${path}_truncated`,
          key: '...',
          valueSnippet: `(${entries.length - limit} more items hidden)`,
          valueType: 'string',
          depth: depth + 1,
          isExpanded: false,
          hasChildren: false,
          isLastChild: true,
          continuationGuides: [...parentGuides, false]
        });
      }
    }
  };

  flatten(rawData, '$', 'root', 0, [], true);
  flattenedCache = result;
  self.postMessage({ type: 'UPDATING_TREE', payload: false });
};

const evaluatePath = (data: any, path: string): any => {
  let s = (path || '').trim();
  if (!s || s === '$') return data;
  if (s.startsWith('$.')) s = s.substring(2);
  else if (s.startsWith('$')) s = s.substring(1);
  if (!s) return data;

  const segments = s.replace(/\[/g, '.[').split('.').filter(Boolean);
  let current = data;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const index = parseInt(segment.substring(1, segment.length - 1), 10);
      current = Array.isArray(current) ? current[index] : undefined;
    } else {
      current = current[segment];
    }
  }
  return current;
};

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  try {
    switch (type) {
      case 'INIT_DATA':
        // 1. Defensively clear the heap before starting a massive allocation
        rawData = null;
        lastQueryResult = null;
        flattenedCache = [];
        expandedPaths = new Set(['$']);
        
        if (payload instanceof File) {
          if (payload.size > WORKER_MAX_SIZE) {
            throw new Error(`File exceeds the 1GB browser limit.`);
          }
          
          try {
            // 2. Primary strategy: Response.json()
            const response = new Response(payload);
            rawData = await response.json();
          } catch (nativeError: any) {
            console.warn("Native Response.json() failed, attempting ArrayBuffer fallback...", nativeError);
            
            // 3. Fallback strategy: Manual ArrayBuffer reading
            try {
              let buffer: ArrayBuffer | null = await payload.arrayBuffer();
              const decoder = new TextDecoder("utf-8");
              const text = decoder.decode(buffer);
              // Explicitly null out buffer to free memory for the parse
              buffer = null; 
              rawData = JSON.parse(text);
            } catch (fallbackError: any) {
              const msg = fallbackError.message || String(fallbackError);
              if (msg.includes("Unexpected end of JSON input")) {
                const browserName = getBrowserName();
                throw new Error(`${browserName} hit a memory allocation limit (approx 512MB). This is a known browser restriction where the JSON string exceeds the engine's internal buffer capacity.`);
              }
              throw new Error(`Parse failed: ${msg}`);
            }
          }
        } else {
          rawData = typeof payload === 'string' ? JSON.parse(payload) : payload;
        }
        
        updateFlattenedCache();
        
        const isSmall = !isTooLargeToTransfer(rawData);
        self.postMessage({ 
          type: 'READY', 
          payload: { 
            size: payload instanceof File ? payload.size : 0, 
            data: isSmall ? rawData : null, 
            totalRows: flattenedCache.length 
          } 
        });
        break;

      case 'GET_TREE_VIEW':
        const { start, end } = payload;
        const rows = flattenedCache.slice(start, end);
        self.postMessage({ type: 'TREE_DATA', payload: { rows, totalRows: flattenedCache.length, start } });
        break;

      case 'TOGGLE_EXPAND':
        if (expandedPaths.has(payload)) expandedPaths.delete(payload);
        else expandedPaths.add(payload);
        updateFlattenedCache();
        self.postMessage({ type: 'TREE_DATA', payload: { totalRows: flattenedCache.length } });
        break;

      case 'EXPAND_ALL':
        const target = evaluatePath(rawData, payload);
        if (typeof target === 'object' && target !== null && Object.keys(target).length > 20000) {
          throw new Error("Branch too large for auto-expand.");
        }
        
        const collect = (obj: any, path: string) => {
          if (typeof obj !== 'object' || obj === null) return;
          expandedPaths.add(path);
          const isArr = Array.isArray(obj);
          Object.entries(obj).forEach(([k, v]) => {
            const childPath = isArr ? `${path}[${k}]` : `${path}.${k}`;
            collect(v, childPath);
          });
        };
        collect(target, payload);
        updateFlattenedCache();
        self.postMessage({ type: 'TREE_DATA', payload: { totalRows: flattenedCache.length } });
        break;

      case 'QUERY':
        const { queryStr, mode: qMode } = payload;
        let queryResult;
        if (qMode === 'standard') {
          queryResult = evaluatePath(rawData, queryStr);
        } else {
          const expression = jsonata(queryStr);
          queryResult = await expression.evaluate(rawData);
        }

        // Cache the result for future export even if it's too large to transfer now
        lastQueryResult = queryResult;

        if (isTooLargeToTransfer(queryResult)) {
          const summary = Array.isArray(queryResult) 
            ? `[Large Array: ${queryResult.length} items]` 
            : typeof queryResult === 'object' && queryResult !== null 
              ? `{Large Object: ${Object.keys(queryResult).length} keys}`
              : "[Large Data Structure]";
          
          self.postMessage({ 
            type: 'RESULT', 
            payload: `__LARGE_RESULT_SUMMARY__:${summary}` 
          });
        } else {
          self.postMessage({ type: 'RESULT', payload: queryResult });
        }
        break;

      case 'REQUEST_EXPORT':
        const { format } = payload;
        if (!lastQueryResult) {
            throw new Error("No query result available for export.");
        }

        let exportContent: string;
        let mimeType: string;
        let extension: string;

        if (format === 'csv') {
            exportContent = jsonToCsv(lastQueryResult);
            mimeType = 'text/csv';
            extension = 'csv';
        } else {
            exportContent = JSON.stringify(lastQueryResult, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        }

        // We use Uint8Array to transfer the data efficiently as a Blob
        const encoder = new TextEncoder();
        const bytes = encoder.encode(exportContent);
        
        self.postMessage({
            type: 'EXPORT_READY',
            payload: {
                data: bytes,
                mimeType,
                fileName: `export_${Date.now()}.${extension}`
            }
        }, [bytes.buffer] as any);
        break;

      case 'COLLAPSE_ALL':
        const prefix = payload;
        expandedPaths.forEach(p => {
          if (p === prefix || p.startsWith(prefix + '.') || p.startsWith(prefix + '[')) {
            expandedPaths.delete(p);
          }
        });
        updateFlattenedCache();
        self.postMessage({ type: 'TREE_DATA', payload: { totalRows: flattenedCache.length } });
        break;
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', payload: err.message || String(err) });
  }
};
