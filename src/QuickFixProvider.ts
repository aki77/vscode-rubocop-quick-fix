import {
  CodeActionProvider,
  Selection,
  TextDocument,
  Range,
  CodeActionContext,
  CancellationToken,
  CodeAction,
  DiagnosticSeverity,
  Diagnostic,
  CodeActionKind,
  WorkspaceEdit,
  Position,
} from 'vscode';

const FIXABLE_SEVERITIES = [
  DiagnosticSeverity.Warning,
  DiagnosticSeverity.Information,
];

const createFixLine = (
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction => {
  const line = document.lineAt(diagnostic.range.start.line);
  const disabledLine = line.text.includes(' # rubocop:disable ');

  const fix = new CodeAction(
    `Disable ${diagnostic.code} for this line`,
    CodeActionKind.QuickFix
  );
  fix.edit = new WorkspaceEdit();
  fix.edit.insert(
    document.uri,
    new Position(line.lineNumber, line.range.end.character + 1),
    disabledLine
      ? `,${diagnostic.code}`
      : ` # rubocop:disable ${diagnostic.code}`
  );
  return fix;
};

const createFixFile = (
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction => {
  const fix = new CodeAction(
    `Disable ${diagnostic.code} for this entire file`,
    CodeActionKind.QuickFix
  );
  fix.edit = new WorkspaceEdit();
  fix.edit.insert(
    document.uri,
    new Position(0, 0),
    `# rubocop:disable ${diagnostic.code}\n`
  );
  fix.edit.insert(
    document.uri,
    new Position(document.lineCount + 1, 0),
    `# rubocop:enable ${diagnostic.code}\n`
  );
  return fix;
};

const createFix = (
  document: TextDocument,
  diagnostics: Diagnostic[]
): CodeAction[] => {
  return diagnostics.flatMap((diagnostic) => [
    createFixLine(document, diagnostic),
    createFixFile(document, diagnostic),
  ]);
};

export const provideCodeActions = (
  document: TextDocument,
  range: Range | Selection,
  context: CodeActionContext,
  token: CancellationToken
): CodeAction[] => {
  const diagnostics = context.diagnostics.filter(
    (diagnostic) =>
      (diagnostic.source === 'rubocop' || diagnostic.source === 'RuboCop') &&
      FIXABLE_SEVERITIES.includes(diagnostic.severity)
  );
  return diagnostics.length > 0 ? createFix(document, diagnostics) : [];
};
