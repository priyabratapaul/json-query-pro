import jsonata from 'jsonata';

/**
 * Native Path Evaluator
 * Safely traverses an object based on a string path like "$.company.departments[0]"
 */
const evaluatePath = (data: any, path: string): any => {
  let segmentString = (path || '').trim();
  if (!segmentString || segmentString === '$') return data;

  // Strip leading $ or $.
  if (segmentString.startsWith('$.')) {
    segmentString = segmentString.substring(2);
  } else if (segmentString.startsWith('$')) {
    segmentString = segmentString.substring(1);
  }
  
  if (!segmentString) return data;

  // Split into segments by treating brackets as part of a dot-notated path
  const segments = segmentString
    .replace(/\[/g, '.[')
    .split('.')
    .filter(Boolean);
  
  let current = data;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    if (segment.startsWith('[') && segment.endsWith(']')) {
      const indexStr = segment.substring(1, segment.length - 1);
      const index = parseInt(indexStr, 10);
      current = Array.isArray(current) ? current[index] : undefined;
    } else {
      current = current[segment];
    }
  }
  return current;
};

/**
 * JSONata Evaluator
 * Uses the JSONata library for complex transformations.
 */
const evaluateJsonata = async (data: any, query: string): Promise<any> => {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery || cleanQuery === '$') return data;

  try {
    const engine = (jsonata as any).default || jsonata;
    
    if (typeof engine !== 'function') {
      console.error("JSONata initialization error: engine is not a function", engine);
      return "Error: JSONata engine failed to load properly.";
    }

    const expression = engine(cleanQuery);
    const result = await expression.evaluate(data);
    return result;
  } catch (e: any) {
    const msg = e.message || String(e);
    const pos = e.position || 'unknown';
    const charCode = cleanQuery.length > 0 ? cleanQuery.charCodeAt(0) : 'N/A';
    return `Query Error: ${msg} (at pos ${pos}, first char code: ${charCode}). Query: "${cleanQuery}"`;
  }
};

/**
 * Main Query Entry Point
 */
export const queryJson = async (data: any, queryStr: string, mode: 'standard' | 'sql' = 'standard'): Promise<any> => {
  if (mode === 'standard') {
    return evaluatePath(data, queryStr);
  } else {
    return await evaluateJsonata(data, queryStr);
  }
};

/**
 * Translates a standard path to a JSONata expression.
 * Escapes identifiers that start with a digit or contain special characters.
 */
export const translatePathToSql = (path: string): string => {
  if (!path || path === '$') return '$';
  
  let cleanPath = path.startsWith('$.') ? path.substring(2) : (path.startsWith('$') ? path.substring(1) : path);
  if (!cleanPath) return '$';

  // Split into segments, treating brackets as part of a dot-notated path for processing
  const segments = cleanPath.replace(/\[/g, '.[').split('.').filter(Boolean);
  
  const escapedSegments = segments.map(segment => {
    // Array index access like [0] should remain as is
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return segment;
    }
    
    // JSONata identifiers must start with a letter, _, or $ 
    // and contain only letters, numbers, _, or $
    // If it starts with a digit or has other chars, it must be backticked
    const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment);
    
    if (isValidIdentifier) {
      return segment;
    }
    
    // Escape with backticks
    return `\`${segment}\``;
  });

  // Rejoin and fix the bracket notation (remove the extra dot we added for splitting)
  return escapedSegments.join('.').replace(/\.\[/g, '[');
};

/**
 * Converts JSON data to CSV format.
 */
export const jsonToCsv = (data: any): string => {
  if (data === null || data === undefined) return '';
  
  const array = Array.isArray(data) ? data : [data];
  if (array.length === 0) return '';

  const objects = array.filter(item => item !== null && typeof item === 'object');
  
  if (objects.length === 0) {
    return array.join('\n');
  }

  const keys = new Set<string>();
  objects.forEach(obj => {
    Object.keys(obj).forEach(key => keys.add(key));
  });

  const headers = Array.from(keys);
  const csvRows = [];

  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  array.forEach(item => {
    const values = headers.map(header => {
      let val = (item && typeof item === 'object') ? item[header] : (header === 'value' ? item : '');
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

export const initSqlEngine = (_data: any) => {};
