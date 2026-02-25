# VS Code IDE Settings Sync Extension

## Project Overview
A VS Code Extension for syncing IDE settings across multiple VS Code-based IDEs (Antigravity, VS Code Insiders, CodeBuddy CN, custom paths).

## Features Implemented

### Core Features
- **IDE Detection**: Automatically detects VS Code, VS Code Insiders, Antigravity, CodeBuddy CN
- **Custom IDE Support**: Add custom IDE paths via UI
- **Settings Search**: Search for specific VS Code settings
- **Settings Preview**: View current values of settings across all detected IDEs before syncing
- **Settings Sync**: Sync selected settings from a source IDE to multiple target IDEs
- **Settings Deletion**: Remove specific settings from IDEs
- **Settings Descriptions**: Built-in descriptions for common VS Code settings

### Project Structure
```
src/
├── extension.ts              # Main extension entry point
├── types.ts                  # TypeScript type definitions
├── providers/
│   └── ideProvider.ts       # IDE detection and settings management
├── webview/
│   └── settingsSyncPanel.ts # WebView UI component
└── utils/
    └── settingsDescriptions.ts  # Settings descriptions mapping
```

## Build Configuration
- **Package Manager**: npm
- **Language**: TypeScript
- **Extension Type**: Command-based with WebView UI
- **Build Tool**: esbuild
- **Min VS Code version**: 1.85.0

## Build Artifacts
- `dist/extension.js` - Bundled extension (~30KB)
- `dist/extension.js.map` - Source map for debugging

## How to Run

### Development Mode (F5 in VS Code)
1. Press `F5` to launch the extension in a new VS Code window
2. The extension will load automatically
3. Open Command Palette and search for "Open IDE Settings Sync Panel"
4. Navigate through the panel to:
   - Select multiple IDEs to sync between
   - Search for specific settings
   - View current values across IDEs
   - Sync selected settings or delete them

### Build for Publication
```bash
npm run vscode:prepublish
```

## Testing
1. Press F5 in VS Code
2. Run command: "Open IDE Settings Sync Panel"
3. The extension will:
   - Auto-detect all compatible IDEs
   - Display a WebView panel with sync interface
   - Allow searching and syncing settings


