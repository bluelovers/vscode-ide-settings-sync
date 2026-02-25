# VSCode IDE Settings Sync

A Visual Studio Code extension that synchronizes IDE settings across multiple VS Code-based IDEs.

## Features

- **Multi-IDE Support**: Sync settings between:
  - Visual Studio Code
  - Visual Studio Code - Insiders
  - Antigravity
  - CodeBuddy CN
  - Custom IDE paths

- **Search & Discovery**: Easily search for settings and view current values across all detected IDEs

- **Pre-sync Preview**: See all setting values in each IDE before syncing

- **Setting Descriptions**: Built-in descriptions for common VS Code settings (using i18n data)

- **Custom IDE Support**: Add custom IDE paths for unsupported IDEs

- **Selective Sync**: Choose which settings to sync and which IDEs to target

- **Delete Settings**: Remove settings from specific IDEs

## Installation

```bash
npm install
```

## Usage

1. Open the Command Palette (Ctrl+Shift+P on Windows/Linux, Cmd+Shift+P on macOS)

2. Search for and run **"Open IDE Settings Sync Panel"**

3. In the panel:
   - Select the IDEs you want to sync between
   - Search for specific settings or browse all settings
   - Select the settings you want to sync
   - Choose a source IDE (the first selected IDE)
   - Click **"Sync Selected"** to perform the sync

## Development

### Build

```bash
npm run esbuild
```

### Watch Mode

```bash
npm run esbuild-watch
```

### Run Extension

- Press `F5` in VS Code to launch the extension in a new window

## Project Structure

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

## Features Detail

### IDE Detection

The extension automatically detects and lists:
- Standard VS Code installations
- VS Code Insiders builds
- Antigravity IDE
- CodeBuddy CN
- Custom paths you specify

### Settings Sync

- **Source IDE**: First selected IDE becomes the source
- **Target IDEs**: Other selected IDEs receive the setting values
- **Preservation**: Only specified settings are synced; others remain unchanged

### Settings Descriptions

Settings descriptions are provided for common VS Code settings. The system can be extended to include custom descriptions.

## Configuration

Settings are stored in each IDE's `settings.json` file located at:
- Windows: `%APPDATA%\{IDE_NAME}\User\settings.json`
- macOS: `~/Library/Application Support/{IDE_NAME}/User/settings.json`
- Linux: `~/.config/{IDE_NAME}/User/settings.json`

## Advanced Usage

### Add Custom IDE

1. Click **"Add Custom IDE Path"** in the IDE selection section
2. Enter the path to the IDE's user data folder (containing `settings.json`)
3. Give the IDE a display name
4. The IDE will be added to your sync list

### Remove Custom IDE

Click the **"Remove"** button next to any custom IDE entry

## Troubleshooting

- **Settings not syncing**: Ensure the target IDE's `settings.json` file is writable
- **IDE not detected**: Try adding a custom path or check the IDE's installation location
- **Settings not appearing**: Some settings may not be visible if they use special characters or are in nested objects

## Known Limitations

- Settings in `settings.json` comments are not preserved during sync
- Workspace-specific settings are not synced (only user settings)
- Some IDE-specific settings may not be compatible across different IDE types

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT

## Support

For issues and feature requests, please open an issue on the GitHub repository.
