'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.mapSelectionWithJsFunc', async () => {
        // The code you place here will be executed every time your command is executed

        const defaultValue = '(v) => v';
        // Display a message box to the user
        const func = await vscode.window.showInputBox({
            placeHolder: defaultValue,
            value: defaultValue,
            prompt: 'JavaScript Function'
        });

        const editor: vscode.TextEditor = vscode.window.activeTextEditor;

        const selections: vscode.Selection[] = editor.selections;
        const textDocument: vscode.TextDocument = editor.document;
        const evalFunc : (any) => any = eval(func);
        const mappedResults = selections.map(sel => textDocument.getText(sel)).map(evalFunc).map(String);

        editor.edit((builder) => {
            let replaceRanges : vscode.Selection[] = [];
            selections.forEach((selection, index) => {
                const replaceText : string = mappedResults[index];
                builder.replace(selection, replaceText);
            });
        })
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
