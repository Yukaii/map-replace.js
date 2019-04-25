'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface PreviewRangesWithContent {
    previewRange: vscode.Range;
    originalRange: vscode.Range;
    originalContent: string;
    textToWrapInPreview: string[];
}

function validateInputFunction (inputFunctionString: string | undefined) : boolean {
    if (typeof inputFunctionString === 'undefined') {
        return false;
    }

    let inputFunction;
    try {
        inputFunction = eval(inputFunctionString);
    } catch (e) {
        return false;
    }

    if (typeof inputFunction !== 'function') {
        return false;
    }

    return true;
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('map-replacejs.mapSelectionWithJsFunc', async () => {
        const editor : vscode.TextEditor = vscode.window.activeTextEditor as vscode.TextEditor;
        let inPreview = false
        const defaultFunctionString : string = vscode.workspace.getConfiguration().get('map-replacejs.default') || '(v, i) => `${v}`';
        let currentFunctionString = defaultFunctionString

        let rangesToReplace:PreviewRangesWithContent[] = editor.selections.sort((a: vscode.Selection, b: vscode.Selection) => { return a.start.compareTo(b.start); }).map(selection => {
            let rangeToReplace: vscode.Range = selection.isReversed ? new vscode.Range(selection.active, selection.anchor) : selection;
            if (!rangeToReplace.isSingleLine && rangeToReplace.end.character === 0) {
                const previousLine = rangeToReplace.end.line - 1;
                const lastChar = editor.document.lineAt(previousLine).text.length;
                rangeToReplace = new vscode.Range(rangeToReplace.start, new vscode.Position(previousLine, lastChar));
            } else if (rangeToReplace.isEmpty) {
                rangeToReplace = new vscode.Range(rangeToReplace.start.line, 0, rangeToReplace.start.line, editor.document.lineAt(rangeToReplace.start.line).text.length);
            }
    
            const firstLineOfSelection = editor.document.lineAt(rangeToReplace.start).text.substr(rangeToReplace.start.character);
            const matches = firstLineOfSelection.match(/^(\s*)/);
            const extraWhiteSpaceSelected = matches ? matches[1].length : 0;
            rangeToReplace = new vscode.Range(rangeToReplace.start.line, rangeToReplace.start.character + extraWhiteSpaceSelected, rangeToReplace.end.line, rangeToReplace.end.character);
    
            let textToWrapInPreview: string[];
            let textToReplace = editor.document.getText(rangeToReplace);
            textToWrapInPreview = textToReplace.split('\n').map(x => x.trim());
    
            return {
                previewRange: rangeToReplace,
                originalRange: rangeToReplace,
                originalContent: textToReplace,
                textToWrapInPreview
            };
        });

        function applyPreview (replacer : Function) : Thenable<boolean> {
            let lastOldPreviewRange = new vscode.Range(0, 0, 0, 0);
            let lastNewPreviewRange = new vscode.Range(0, 0, 0, 0);
            let totalLinesInserted = 0;

            return editor.edit(builder => {
                for (let i = 0; i < rangesToReplace.length; i++) {
                    const oldPreviewRange = rangesToReplace[i].previewRange;
                    const newText = String(replacer(rangesToReplace[i].originalContent, i))
                    builder.replace(oldPreviewRange, newText);

                    const expandedTextLines = newText.split('\n');
                    const oldPreviewLines = oldPreviewRange.end.line - oldPreviewRange.start.line + 1;
                    const newLinesInserted = expandedTextLines.length - oldPreviewLines;

                    let newPreviewLineStart = oldPreviewRange.start.line + totalLinesInserted;
                    let newPreviewStart = oldPreviewRange.start.character;
                    const newPreviewLineEnd = oldPreviewRange.end.line + totalLinesInserted + newLinesInserted;
                    let newPreviewEnd = expandedTextLines[expandedTextLines.length - 1].length;
                    if (i > 0 && newPreviewLineEnd === lastNewPreviewRange.end.line) {
                        // If newPreviewLineEnd is equal to the previous expandedText lineEnd,
                        // set newPreviewStart to the length of the previous expandedText in that line
                        // plus the number of characters between both selections.
                        newPreviewStart = lastNewPreviewRange.end.character + (oldPreviewRange.start.character - lastOldPreviewRange.end.character);
                        newPreviewEnd += newPreviewStart;
                    }
                    else if (i > 0 && newPreviewLineStart === lastNewPreviewRange.end.line) {
                        // Same as above but expandedTextLines.length > 1 so newPreviewEnd keeps its value.
                        newPreviewStart = lastNewPreviewRange.end.character + (oldPreviewRange.start.character - lastOldPreviewRange.end.character);
                    }
                    else if (expandedTextLines.length === 1) {
                        // If the expandedText is single line, add the length of preceeding text as it will not be included in line length.
                        newPreviewEnd += oldPreviewRange.start.character;
                    }

                    lastOldPreviewRange = rangesToReplace[i].previewRange;
                    rangesToReplace[i].previewRange = lastNewPreviewRange = new vscode.Range(newPreviewLineStart, newPreviewStart, newPreviewLineEnd, newPreviewEnd);

                    totalLinesInserted += newLinesInserted;
                }
            }, { undoStopBefore: false, undoStopAfter: false });
        }

        function revertPreview (): Thenable<any> {
            return editor.edit(builder => {
                for (let i = 0; i < rangesToReplace.length; i++) {
                    builder.replace(rangesToReplace[i].previewRange, rangesToReplace[i].originalContent);
                    rangesToReplace[i].previewRange = rangesToReplace[i].originalRange;
                }
            }, { undoStopBefore: false, undoStopAfter: false });
        }

        function inputChanged (inputFunctionString : string) : string {
            if (inputFunctionString !== currentFunctionString) {
                currentFunctionString = inputFunctionString;
                makeChanges(inputFunctionString, false).then(out => {
                    if (typeof out === 'boolean') {
                        inPreview = out;
                    }
                })
            }
            return '';
        }

        function makeChanges (inputFunctionString: string, definitive: boolean) : Thenable<boolean> {
            if (!validateInputFunction(inputFunctionString)) {
                return inPreview ? revertPreview().then(() => { return false; }) : Promise.resolve(inPreview);
            }
        
            const inputFunction : Function = eval(inputFunctionString);
        
            // apply real changes
            if (definitive) {
                const revertPromise = inPreview ? revertPreview() : Promise.resolve();
                return revertPromise.then(() => {
                    return editor.edit(builder => {
                        for (let i = 0; i < rangesToReplace.length; i++) {
                            const oldPreviewRange = rangesToReplace[i].previewRange;
                            const newText = String(inputFunction(rangesToReplace[i].originalContent, i))
                            builder.replace(oldPreviewRange, newText);
                        }                        
                    });
                });
            } else {
                return applyPreview(inputFunction);
            }
        }

        // Display a message box to the user
        const func : string = await vscode.window.showInputBox({
            placeHolder: '(v, i) => `${v}`',
            value: defaultFunctionString,
            prompt: 'JavaScript Function',
            validateInput: inputChanged,
        }) as string;

        return makeChanges(func, true);
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}
