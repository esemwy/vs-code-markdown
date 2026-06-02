import * as vscode from 'vscode';

// Called once when the extension is first activated (opening any .md file).
// Register every command here and push it onto context.subscriptions so VS Code
// disposes it automatically when the extension is deactivated.
//
// To add a new command:
//   1. Register it here:       vscode.commands.registerCommand('vs-code-markdown.<name>', handler)
//   2. Declare it in package.json under contributes.commands
//   3. Optionally bind a key in package.json under contributes.keybindings
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        // delta -1 = promote (remove one #, e.g. H2 → H1)
        vscode.commands.registerCommand('vs-code-markdown.headerPromote', () => shiftHeaderLevel(-1)),
        // delta +1 = demote  (add one #,    e.g. H1 → H2)
        vscode.commands.registerCommand('vs-code-markdown.headerDemote', () => shiftHeaderLevel(1)),
        vscode.commands.registerCommand('vs-code-markdown.toggleBulletList', () => toggleList('bullet')),
        vscode.commands.registerCommand('vs-code-markdown.toggleNumberedList', () => toggleList('numbered')),
    );
}

// Returns 1–6 for a header line ("## Foo" → 2), or 0 for plain text.
// Requires a space after the hashes so "#hashtag" is not treated as H1.
function getHeaderLevel(text: string): number {
    const match = text.match(/^(#{1,6}) /);
    return match ? match[1].length : 0;
}

// Removes the leading "### " prefix from a header line, leaving just the body.
function stripHeaderPrefix(text: string): string {
    return text.replace(/^#{1,6} /, '');
}

// Shifts the header level of every line touched by any active selection.
// delta = +1 → demote (more #s), delta = -1 → promote (fewer #s).
// Clamps at 0 (plain text) and 6 (H6), so extra keypresses are harmless.
// A Set is used to deduplicate lines when multiple selections overlap.
function shiftHeaderLevel(delta: number): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const document = editor.document;
    editor.edit(editBuilder => {
        // Collect all line numbers covered by every cursor / selection.
        const affectedLines = new Set<number>();
        for (const selection of editor.selections) {
            for (let i = selection.start.line; i <= selection.end.line; i++) {
                affectedLines.add(i);
            }
        }

        for (const lineNum of affectedLines) {
            const line = document.lineAt(lineNum);
            const text = line.text;
            const level = getHeaderLevel(text);
            const newLevel = Math.max(0, Math.min(6, level + delta));

            if (newLevel === level) { continue; } // already at boundary, nothing to do

            const body = stripHeaderPrefix(text);
            // newLevel 0 means plain text (no prefix); otherwise prepend "### " etc.
            const newText = newLevel === 0 ? body : '#'.repeat(newLevel) + ' ' + body;
            editBuilder.replace(line.range, newText);
        }
    });
}

// Toggles a list marker on every line in each selection.
//
// Toggle logic (applied per selection block, not per line):
//   - If every line already has the requested marker → strip all markers (toggle off).
//   - Otherwise → apply the requested marker, replacing any existing list marker first
//     so switching between bullet and numbered always produces clean output.
//
// Numbered lists restart at 1 for each selection block; extend the numbered
// branch if you need to continue an existing list count.
function toggleList(type: 'bullet' | 'numbered'): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const document = editor.document;
    editor.edit(editBuilder => {
        // Iterate over each selection independently so multi-cursor works naturally.
        for (const selection of editor.selections) {
            const start = selection.start.line;
            const end = selection.end.line;

            // Snapshot the text of every line in this selection up-front.
            // We need all lines before we can decide whether to toggle on or off.
            const lines = Array.from({ length: end - start + 1 }, (_, i) =>
                document.lineAt(start + i).text
            );

            const isBullet   = (t: string) => /^[-*] /.test(t);
            const isNumbered = (t: string) => /^\d+\. /.test(t);
            // Strips either a bullet marker ("- " / "* ") or a numbered marker ("12. ").
            const stripList  = (t: string) => t.replace(/^([-*]|\d+\.) /, '');

            // "all match" means the shortcut acts as a toggle-off; otherwise toggle-on.
            const allMatch = type === 'bullet'
                ? lines.every(isBullet)
                : lines.every(isNumbered);

            for (let i = 0; i < lines.length; i++) {
                const line = document.lineAt(start + i);
                const stripped = stripList(lines[i]); // body without any list marker
                let newText: string;

                if (allMatch) {
                    newText = stripped;                          // remove marker
                } else if (type === 'bullet') {
                    newText = '- ' + stripped;                   // add bullet
                } else {
                    newText = `${i + 1}. ` + stripped;           // add number
                }

                // Skip the edit if nothing changes (avoids dirtying the buffer unnecessarily).
                if (newText !== lines[i]) {
                    editBuilder.replace(line.range, newText);
                }
            }
        }
    });
}

export function deactivate() {}
