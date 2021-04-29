import * as vscode from 'vscode';
import { provideCodeActions } from './QuickFixProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      "ruby",
      { provideCodeActions },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
      }
    )
  );
}

export function deactivate() {}
