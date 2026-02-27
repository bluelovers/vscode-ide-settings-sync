# Quick Start Guide

## Prerequisites
- Visual Studio Code 1.85.0 or higher
- Node.js and pnpm

> **Note:** For detailed documentation, see [README.md](./README.md)

## Running in Development Mode

1. **Build the extension**:
   ```bash
   pnpm run esbuild
   ```

2. **Launch the extension** (in VS Code):
   - Press `F5` to open the Extension Development Host
   - A new VS Code window will open with the extension loaded

3. **Test the extension**:
   - In the extension window, open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Search for and run: **"Open IDE Settings Sync Panel"**
   - The Settings Sync panel should appear

## Building for Production

Create a minified production build:
```bash
pnpm run vscode:prepublish
```

## Watch Mode (Development)

For continuous development with auto-rebuild:
```bash
pnpm run esbuild-watch
```

## Available Commands

- `editor.fontFamily` - Default font used in editor
- `editor.fontSize` - Font size for editor
- `editor.tabSize` - Number of spaces per tab
- `files.autoSave` - Auto-save configuration
- (And many more - see `settingsDescriptions.ts` for the full list)

## Troubleshooting

**Extension doesn't load?**
- Check the "Extension" output panel in the VS Code console
- Verify the dist/extension.js file exists

**Settings not syncing?**
- Ensure target IDE's settings.json is writable
- Check that the IDE path is correctly configured

**Can't find an IDE?**
- Use "Add Custom IDE Path" to specify the IDE's user data folder

## Project Structure

- `src/extension.ts` - Main entry point
- `src/providers/ideProvider.ts` - IDE detection and settings management
- `src/webview/settingsSyncPanel.ts` - UI panel
- `src/utils/settingsDescriptions.ts` - Setting descriptions
- `dist/extension.js` - Compiled extension

## Testing

Run unit tests:
```bash
pnpm run test:unit
```

For more testing options, see [README.md](./README.md)
