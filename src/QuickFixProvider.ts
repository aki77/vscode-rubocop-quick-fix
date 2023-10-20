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
} from "vscode";

const FIXABLE_SEVERITIES = [
  DiagnosticSeverity.Warning,
  DiagnosticSeverity.Information,
];

const createFixLine = (
  code: string | number,
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction => {
  const line = document.lineAt(diagnostic.range.start.line);
  const disabledLine = line.text.includes(" # rubocop:disable ");

  const fix = new CodeAction(
    `Disable ${code} for this line`,
    CodeActionKind.QuickFix
  );
  fix.edit = new WorkspaceEdit();
  fix.edit.insert(
    document.uri,
    new Position(line.lineNumber, line.range.end.character + 1),
    disabledLine ? `,${code}` : ` # rubocop:disable ${code}`
  );
  return fix;
};

const createFixFile = (
  code: string | number,
  document: TextDocument
): CodeAction => {
  const fix = new CodeAction(
    `Disable ${code} for this entire file`,
    CodeActionKind.QuickFix
  );
  fix.edit = new WorkspaceEdit();
  fix.edit.insert(
    document.uri,
    new Position(0, 0),
    `# rubocop:disable ${code}\n`
  );
  fix.edit.insert(
    document.uri,
    new Position(document.lineCount + 1, 0),
    `# rubocop:enable ${code}\n`
  );
  return fix;
};

const createFix = (
  document: TextDocument,
  diagnostics: Diagnostic[]
): CodeAction[] => {
  return diagnostics.flatMap((diagnostic) => {
    const code =
      typeof diagnostic.code === "object"
        ? diagnostic.code.value
        : diagnostic.code;

    if (code === null || code === undefined || code === "") {
      return [];
    } else {
      return [
        createFixLine(code, document, diagnostic),
        createFixFile(code, document),
      ];
    }
  });
};

export const provideCodeActions = (
  document: TextDocument,
  range: Range | Selection,
  context: CodeActionContext,
  token: CancellationToken
): CodeAction[] => {
  const diagnostics = context.diagnostics.filter(
    (diagnostic) =>
      (diagnostic.source === "rubocop" || diagnostic.source === "RuboCop") &&
      FIXABLE_SEVERITIES.includes(diagnostic.severity)
  );
  return diagnostics.length > 0 ? createFix(document, diagnostics) : [];
};
