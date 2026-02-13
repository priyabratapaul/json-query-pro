const defaultJson = {
  "company": {
    "name": "Tech Innovations",
    "location": "San Francisco",
    "departments": [
      {
        "name": "Engineering",
        "employees": [
          {
            "id": 1,
            "name": "Alice",
            "position": "Software Engineer",
            "projects": [
              { "project_id": 101, "project_name": "Project Alpha", "status": "Completed" },
              { "project_id": 102, "project_name": "Project Beta", "status": "In Progress" }
            ]
          },
          {
            "id": 2,
            "name": "Bob",
            "position": "DevOps Engineer",
            "projects": [
              { "project_id": 103, "project_name": "Project Gamma", "status": "Completed" }
            ]
          }
        ]
      },
      {
        "name": "Sales",
        "employees": [
          {
            "id": 3,
            "name": "Charlie",
            "position": "Sales Representative",
            "clients": [
              { "client_id": 201, "client_name": "Client A", "contract_value": 50000 },
              { "client_id": 202, "client_name": "Client B", "contract_value": 75000 }
            ]
          }
        ]
      }
    ]
  }
};

export const developerConfig = {
  features: {
    enableSupportPage: true,
    enableAboutPage: true,
    enableFileUpload: true,
    autoExecuteQuery: false,
  },
  limits: {
    maxFileSizeMB: 1150, // Increased to ~1.1GB to handle user's specific dataset
    warnSizeMB: 100,     // Show warning for files above this size
  },
  labels: {
    nav: {
      home: 'Home',
      main: 'Main',
      help: 'Help',
      settings: 'Settings',
      about: 'About',
    },
    home: {
      header: 'Home',
      welcome: 'Welcome to JSON Query Pro',
      featureDescription: 'High-performance tree visualization with interactive row selection.\nPowerful JSONata engine for complex data transformations.\nImmersive, developer-first interface with full virtualization support.',
      devName: 'Priyabrata Paul',
      devProfileUrl: 'https://github.com/priyabratapaul',
      cta: 'Open Main Dashboard',
    },
    main: {
      treeHeader: 'JSON Tree',
      treeModes: {
        view: 'TREE',
        edit: 'EDIT',
      },
      loadButton: 'Load',
      clearButton: 'Clear',
      applyButton: 'Apply',
      cancelButton: 'Cancel',
      invalidJson: 'Invalid JSON Structure',
      resultHeader: 'Query Result',
      resultSubHeader: 'Preview',
      exportJson: 'JSON',
      exportCsv: 'CSV',
      limitWarning: 'Optimized for massive datasets up to 1.1GB.'
    },
    editor: {
      modes: {
        standard: 'PATH',
        sql: 'JSONATA',
      },
      copyLabel: 'Copy Query',
      saveLabel: 'Save',
      savedLabel: 'History',
      copiedLabel: 'COPIED!',
      runButton: 'RUN',
      editorLabel: 'Editor',
      tablesLabel: 'Engine:',
      autoExecuteLabel: 'AUTO-RUN',
      placeholders: {
        sql: 'company.departments[name="Engineering"].employees.name',
        standard: '$.company.departments[0]',
      }
    },
    results: {
      noData: 'No results found for this path.',
      noDataLoaded: 'Awaiting data source. Please load a file or enter JSON.',
      copyLabel: 'Copy Result',
      copiedLabel: 'COPIED!',
    },
    help: {
      header: 'Help',
      guideHeader: 'Engine Quick-Start',
      sampleQueriesHeader: 'Common Sample Queries',
      supportHeader: 'Contact Engineering',
      quote: 'Reference guide for using PATH navigation and JSONata transformations.',
      connectButton: 'Connect',
      items: [
        { title: 'Email Support', val: 'support@jsonquerypro.dev', icon: '✉️' },
        { title: 'Technical Issues', val: 'github.com/jsonquerypro/app', icon: '🛠️' },
        { title: 'Live Community', val: 'Discord: #json-query-pro', icon: '💬' }
      ],
      samples: [
        { 
          title: 'Direct Retrieval', 
          desc: 'Get the company name property.', 
          path: '$.company.name', 
          sql: 'company.name' 
        },
        { 
          title: 'Array Indexing', 
          desc: 'Access the first department object.', 
          path: '$.company.departments[0]', 
          sql: 'company.departments[0]' 
        },
        { 
          title: 'Logical Filtering', 
          desc: 'Find departments specifically named "Engineering".', 
          path: 'N/A', 
          sql: 'company.departments[name="Engineering"]' 
        },
        { 
          title: 'Deep Recursive Search', 
          desc: 'Search for any key named "Alice" at any depth.', 
          path: 'N/A', 
          sql: '**[name="Alice"]' 
        },
        { 
          title: 'Aggregations', 
          desc: 'Count total employees across all branches.', 
          path: 'N/A', 
          sql: '$count(company.departments.employees)' 
        },
        { 
          title: 'Data Reshaping', 
          desc: 'Create a custom report structure.', 
          path: 'N/A', 
          sql: 'company.departments.{"dept": name, "staff": $count(employees)}' 
        }
      ]
    },
    settings: {
      header: 'Settings',
      appearance: 'Appearance',
      interfaceStyle: 'Interface Style',
      typography: 'Typography',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      autoSave: 'Auto-Saved to Local Storage',
      dataHeader: 'Data Management',
      exportLabel: 'Export Backup',
      importLabel: 'Import Backup',
      dangerZone: 'Danger Zone',
      resetLabel: 'Reset All Data',
      resetDescription: 'Clears all settings, queries, and history. Restores application to factory defaults.',
      resetConfirm: 'Are you sure you want to reset the app? This action cannot be undone.',
      themes: {
        light: 'LIGHT',
        dark: 'DARK',
        system: 'SYSTEM',
      },
      corners: {
        rounded: 'ROUNDED',
        sharp: 'SHARP',
      }
    },
    about: {
      header: 'About',
      appName: 'JSON Query Pro',
      version: 'v1.0.0',
      visionHeader: 'Vision',
      visionText: 'JSON Query Pro is a high-performance, developer-first tool designed to handle massive data structures with ease. Our goal is to make data exploration and extraction as seamless as possible for engineers.',
      archHeader: 'Architecture',
      archText: 'Built on a recursive tree-rendering engine and powered by JSONata for high-performance transformations.',
      devName: 'Priyabrata Paul',
      devProfileUrl: 'https://github.com/priyabratapaul',
      devHeader: 'Developer',
      devRole: 'Senior Software Engineer',
      devSpecialty: 'High-Performance Web Systems',
      copyright: '© 2026 Priyabrata Paul',
      license: '',
    }
  },
  defaults: {
    theme: 'dark' as 'light' | 'dark' | 'system',
    corners: 'sharp' as 'rounded' | 'sharp',
    fontFamily: 'sans-serif',
    fontSize: 14,
    tab: 'Home' as 'Home' | 'Main' | 'Settings' | 'Help' | 'About',
    initialJson: defaultJson,
  }
};
