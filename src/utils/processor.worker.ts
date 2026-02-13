import jsonata from 'jsonata';

let rawData: any = null;

/**
 * Native Path Evaluator (Worker Version)
 * Safely traverses an object based on a string path.
 */
const evaluatePath = (data: any, path: string): any => {
  let segmentString = (path || '').trim();
  if (!segmentString || segmentString === '$') return data;
  
  // Strip leading $ or $. to get to the segments
  if (segmentString.startsWith('$.')) {
    segmentString = segmentString.substring(2);
  } else if (segmentString.startsWith('$')) {
    segmentString = segmentString.substring(1);
  }
  
  if (!segmentString) return data;

  // Split into segments by treating brackets as part of a dot-notated path
  // e.g. "employees[0].name" -> "employees.[0].name" -> ["employees", "[0]", "name"]
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
 * Native Streaming Parser
 * Reads the file stream in chunks to provide progress updates
 * while avoiding Node.js dependency issues.
 */
const parseStream = async (stream: ReadableStream, totalSize: number): Promise<any> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';
  let processedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      processedBytes += value.length;
      accumulatedText += decoder.decode(value, { stream: true });

      // Throttle progress messages
      if (processedBytes % (1024 * 1024) === 0 || processedBytes === totalSize) {
        const progress = Math.round((processedBytes / totalSize) * 100);
        self.postMessage({ type: 'PROGRESS', payload: progress });
      }
    }

    // Finalize decoding
    accumulatedText += decoder.decode();
    
    // Parse the final result
    return JSON.parse(accumulatedText);
  } catch (error) {
    throw new Error(`Parse failed: ${error instanceof Error ? error.message : 'Malformed JSON'}`);
  }
};

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case 'INIT_DATA':
        if (payload instanceof File) {
          self.postMessage({ type: 'PROGRESS', payload: 0 });
          rawData = await parseStream(payload.stream(), payload.size);
          self.postMessage({ type: 'PROGRESS', payload: 100 });
          
          const shouldSendData = payload.size < 100 * 1024 * 1024;
          self.postMessage({ 
            type: 'READY', 
            payload: { 
              size: payload.size, 
              data: shouldSendData ? rawData : null 
            } 
          });
        } else {
          rawData = typeof payload === 'string' ? JSON.parse(payload) : payload;
          const size = typeof payload === 'string' ? payload.length : JSON.stringify(rawData).length;
          self.postMessage({ type: 'READY', payload: { size, data: rawData } });
        }
        break;

      case 'QUERY':
        const { queryStr, mode } = payload;
        if (!rawData) {
          self.postMessage({ type: 'ERROR', payload: "No data loaded." });
          break;
        }
        if (mode === 'standard') {
          const res = evaluatePath(rawData, queryStr);
          self.postMessage({ type: 'RESULT', payload: res });
        } else {
          const expression = jsonata(queryStr);
          const res = await expression.evaluate(rawData);
          self.postMessage({ type: 'RESULT', payload: res });
        }
        break;

      default:
        break;
    }
  } catch (error: any) {
    console.error("Worker Error:", error);
    self.postMessage({ type: 'ERROR', payload: error.message || String(error) });
  }
};
