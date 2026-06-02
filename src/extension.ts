import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('vs-code-markdown.headerPromote', () => shiftHeaderLevel(-1)),
        vscode.commands.registerCommand('vs-code-markdown.headerDemote', () => shiftHeaderLevel(1)),
        vscode.commands.registerCommand('vs-code-markdown.toggleBulletList', () => toggleList('bullet')),
        vscode.commands.registerCommand('vs-code-markdown.toggleNumberedList', () => toggleList('numbered')),
    );
}

function getHeaderLevel(text: string): number {
    const match = text.match(/^(#{1,6}) /);
    return match ? match[1].length : 0;
}

function stripHeaderPrefix(text: string): string {
    return text.replace(/^#{1,6} /, '');
}

function shiftHeaderLevel(delta: number): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const document = editor.document;
    editor.edit(editBuilder => {
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

            if (newLevel === level) { continue; }

            const body = stripHeaderPrefix(text);
            const newText = newLevel === 0 ? body : '#'.repeat(newLevel) + ' ' + body;
            editBuilder.replace(line.range, newText);
        }
    });
}

function toggleList(type: 'bullet' | 'numbered'): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const document = editor.document;
    editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            const start = selection.start.line;
            const end = selection.end.line;

            const lines = Array.from({ length: end - start + 1 }, (_, i) =>
                document.lineAt(start + i).text
            );

            const isBullet = (t: string) => /^[-*] /.test(t);
            const isNumbered = (t: string) => /^\d+\. /.test(t);
            const stripList = (t: string) => t.replace(/^([-*]|\d+\.) /, '');

            const allMatch = type === 'bullet'
                ? lines.every(isBullet)
                : lines.every(isNumbered);

            for (let i = 0; i < lines.length; i++) {
                const line = document.lineAt(start + i);
                const stripped = stripList(lines[i]);
                let newText: string;

                if (allMatch) {
                    newText = stripped;
                } else if (type === 'bullet') {
                    newText = '- ' + stripped;
                } else {
                    newText = `${i + 1}. ` + stripped;
                }

                if (newText !== lines[i]) {
                    editBuilder.replace(line.range, newText);
                }
            }
        }
    });
}

export function deactivate() {}
