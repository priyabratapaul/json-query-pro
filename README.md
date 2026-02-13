# 🚀 JSON Query Pro

**JSON Query Pro** is a high-performance, developer-first tool designed for exploring, querying, and transforming massive JSON data structures with zero latency. Built for speed and aesthetics, it handles everything from small API snippets to multi-hundred-megabyte database exports directly in your browser.

## ✨ Key Features

- **🌲 Virtualized Tree Engine**: Navigate through millions of nested rows at 60fps. Our custom virtualization engine only renders what's on screen.
- **⚙️ Background Processing**: All heavy lifting (parsing and querying) happens in a dedicated Web Worker, keeping the UI responsive even during complex operations.
- **🎯 Select Mode**: Simply click on any field in the tree to instantly generate its path and paste it into the editor.
- **⚡ Dual-Engine Querying**:
  - **PATH Mode**: Fast, native JavaScript path traversal for standard navigation.
  - **JSONATA Mode**: High-performance transformations using [JSONata](https://jsonata.org/) for filtering, mapping, and math.
- **💾 Local-First Persistence**:
  - **IndexedDB**: Large JSON datasets are persisted locally in IndexedDB, surviving page refreshes.
  - **LocalStorage**: Your settings, themes, and query history are always saved.
- **🎨 Immersive UI**: Modern design with support for **Light**, **Dark**, and **System** modes, plus adjustable typography and corner styles.
- **📥 Professional Export**: Extract your results to **JSON** or **CSV** formats, even for datasets too large for the browser to preview.

## 🚀 Performance & Scale

JSON Query Pro is engineered to push the limits of the browser:
- **Streaming Logic**: Uses modern browser APIs like `Response.json()` to minimize memory overhead during initial loads.
- **Memory Guarding**: Implements defensive strategies to handle Chromium's internal ~512MB string allocation limits.
- **Privacy**: Your data never leaves your machine. All processing is 100% local.

## 🛠 How to Use

1. **Load Data**: In the "Main" tab, click "Load" to upload a `.json` file or use "EDIT" mode to paste raw text.
2. **Navigate**: Scroll the tree. Use the `+` icon on rows for recursive expansion of specific branches.
3. **Query**: Write your expression and hit "RUN". Results appear instantly in the preview pane.
4. **Save & History**: Save your favorite queries for later use via the history popover.
5. **Backup**: Use the Settings tab to export a full backup of your queries and data.

---
*Built for engineers who value speed, privacy, and clarity.*
