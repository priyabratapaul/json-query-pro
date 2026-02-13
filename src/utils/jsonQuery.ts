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
    console.warn("JSONata Evaluation failed:", e);
    return `Query Error: ${e?.message || String(e)}`;
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
 */
export const translatePathToSql = (path: string): string => {
  if (!path || path === '$') return '$';
  return path.startsWith('$.') ? path.substring(2) : path;
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
