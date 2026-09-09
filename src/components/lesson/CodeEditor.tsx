import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

// Real syntax highlighting (VS Code's own dark theme) instead of a plain
// <textarea>, which can only render flat, single-color monospace text.
export default function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      editable={!readOnly}
      theme={vscodeDark}
      extensions={[python(), EditorView.lineWrapping]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
      }}
      style={{ fontSize: "0.85rem" }}
    />
  );
}
