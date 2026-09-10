import Terminal, { type TerminalStep } from "./Terminal";

interface TerminalGroupProps {
  /** Stacked vertically, in order — e.g. "your machine" above "a teammate's machine" — not side by side: the point is comparing outcomes from the same script, not a literal split-terminal layout. */
  panes: { label: string; steps: TerminalStep[] }[];
}

export default function TerminalGroup({ panes }: TerminalGroupProps) {
  return (
    <div className="my-6 flex flex-col gap-3">
      {panes.map((pane, i) => (
        <Terminal key={i} label={pane.label} steps={pane.steps} />
      ))}
    </div>
  );
}
