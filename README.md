# Markdown Shortcuts

A VS Code extension providing keyboard shortcuts for common Markdown editing tasks.

## Shortcuts

All shortcuts are active only when editing a `.md` file.

| Action | Windows / Linux | Mac |
|---|---|---|
| Promote header (fewer `#`) | `Ctrl+Shift+[` | `Cmd+Shift+[` |
| Demote header (more `#`) | `Ctrl+Shift+]` | `Cmd+Shift+]` |
| Toggle bullet list | `Ctrl+Shift+8` | `Cmd+Shift+8` |
| Toggle numbered list | `Ctrl+Shift+7` | `Cmd+Shift+7` |

Header promote/demote works on the current line or every line in a selection. It clamps at plain text and H6. List toggle treats a selection as a block: if every line already has the marker it removes them all, otherwise it adds them (replacing any existing list marker).

Shortcuts can be rebound in **File → Preferences → Keyboard Shortcuts**.

## Build and install

Requires [Node.js](https://nodejs.org) and the [vsce](https://github.com/microsoft/vscode-vsce) packaging tool.

```bash
npm install
npm run compile
npx vsce package          # produces vs-code-markdown-0.1.0.vsix
```

Install the resulting `.vsix` from the command line:

```bash
code --install-extension vs-code-markdown-0.1.0.vsix
```

Or inside VS Code: **Extensions → ⋯ → Install from VSIX…** and select the file.
