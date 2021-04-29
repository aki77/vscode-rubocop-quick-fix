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
  const fix = new CodeAction(
    `Disable ${diagnostic.source} for this line`,
    CodeActionKind.QuickFix
  );
  fix.edit = new WorkspaceEdit();
  fix.edit.insert(
    document.uri,
    new Position(line.lineNumber, line.range.end.character + 1),
    ` # rubocop:disable ${diagnostic.source}`
  );
  return fix;
};

const createFixFile = (
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction => {
  const fix = new CodeAction(
    `Disable ${diagnostic.source} for this entire file`,
    CodeActionKind.QuickFix
  );
  fix.edit = new WorkspaceEdit();
  fix.edit.insert(
    document.uri,
    new Position(0, 0),
    `# rubocop:disable ${diagnostic.source}\n`
  );
  fix.edit.insert(
    document.uri,
    new Position(document.lineCount + 1, 0),
    `# rubocop:enable ${diagnostic.source}\n`
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
      diagnostic.source?.includes('/') &&
      FIXABLE_SEVERITIES.includes(diagnostic.severity)
  );
  return diagnostics.length > 0 ? createFix(document, diagnostics) : [];
};
