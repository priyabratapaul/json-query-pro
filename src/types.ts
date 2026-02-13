export type Theme = 'light' | 'dark' | 'system';
export type CornerStyle = 'rounded' | 'sharp';
export type AppTab = 'Home' | 'Main' | 'Settings' | 'Help' | 'About';
export type QueryMode = 'standard' | 'sql';
export type TreeMode = 'view' | 'edit';

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  mode: QueryMode;
  timestamp: number;
}

export interface AppSettings {
  theme: Theme;
  corners: CornerStyle;
  fontFamily: string;
  fontSize: number;
}

// Added JsonNodeProps interface to resolve errors in JsonTree.tsx component where properties were missing
export interface JsonNodeProps {
  data: any;
  name: string;
  path: string;
  onSelect: (path: string) => void;
  depth: number;
  mode: TreeMode;
}

/**
 * Metadata for a single rendered row in the tree.
 * Minimal data sent from Worker to Main thread.
 */
export interface TreeRow {
  id: string;
  path: string;
  key: string;
  valueSnippet: string; // Pre-formatted value or type label
  valueType: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  isLastChild: boolean;
  continuationGuides: boolean[];
}

export type WorkerMessageType = 
  | 'INIT_DATA' 
  | 'QUERY' 
  | 'GET_TREE_VIEW' 
  | 'TOGGLE_EXPAND' 
  | 'EXPAND_ALL' 
  | 'COLLAPSE_ALL';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload: any;
}

export interface WorkerResponse {
  type: 'READY' | 'PROGRESS' | 'RESULT' | 'TREE_DATA' | 'ERROR' | 'UPDATING_TREE';
  payload: any;
}
