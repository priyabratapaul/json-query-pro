// Fixed: Replaced the failing vite/client reference with manual declarations to fix 
// "Cannot find type definition file for 'vite/client'". This provides the necessary 
// types for Vite's environment variables and special import suffixes like ?worker.

interface ImportMetaEnv {
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module '*?url' {
  const content: string;
  export default content;
}

declare module '*?raw' {
  const content: string;
  export default content;
}
