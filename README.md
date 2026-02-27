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
pnpm install
```

> **Quick Start:** For a quick start guide, see [QUICKSTART.md](./QUICKSTART.md)
> **Copilot Instructions:** For AI coding assistance, see [.github/copilot-instructions.md](./.github/copilot-instructions.md)

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
pnpm run esbuild
```

### Watch Mode

```bash
pnpm run esbuild-watch
```

### Run Extension

- Press `F5` in VS Code to launch the extension in a new window

### Testing

Run unit tests with Jest:

```bash
# Run all tests
pnpm run test:unit

# Run tests in watch mode
pnpm run test:unit:watch

# Run tests with coverage
pnpm run test:unit:coverage
```

### Keybindings

| Command | Windows/Linux | macOS | Description |
|---------|---------------|-------|-------------|
| Open IDE Settings Sync Panel | `Ctrl+Shift+Alt+S` | `Cmd+Shift+Alt+S` | Open the settings sync panel |
| Refresh IDE List | `Ctrl+Shift+Alt+R` | `Cmd+Shift+Alt+R` | Refresh the detected IDE list |

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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes.

## FAQ

### Q: Why are some settings not syncing?
A: Some settings may not be visible if they use special characters or are in nested objects. Also, workspace-specific settings are not synced (only user settings are supported).

### Q: Can I sync settings between different types of IDEs?
A: Yes, but some IDE-specific settings may not be compatible across different IDE types. The extension will attempt to sync all selected settings.

### Q: Are comments in settings.json preserved?
A: Yes, comments are preserved during sync. The extension uses `jsonc-parser` which supports preserving comments in JSON files.

### Q: How do I report a bug or request a feature?
A: Please open an issue on the GitHub repository.

## Troubleshooting

- **Settings not syncing**: Ensure the target IDE's `settings.json` file is writable
- **IDE not detected**: Try adding a custom path or check the IDE's installation location
- **Settings not appearing**: Some settings may not be visible if they use special characters or are in nested objects

## Known Limitations

- Workspace-specific settings are not synced (only user settings)
- Some IDE-specific settings may not be compatible across different IDE types

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT

## Support

For issues and feature requests, please open an issue on the GitHub repository.
