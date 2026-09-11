import { useState } from "react";

interface DockerBuildDemoProps {
  dockerfile: string;
  /**
   * When true, every RUN step in the log is rendered as an instant cache
   * hit ("Using cache") instead of actually "running" — for demonstrating
   * what a cached rebuild looks like, fast, right next to an uncached one.
   */
  cacheHit?: boolean;
  /** Overrides the button's resting label, e.g. "Rebuild (no changes)". Defaults to "Build". */
  buildLabel?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseInstructions(dockerfile: string): string[] {
  return dockerfile
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function fakeHash(length = 12): string {
  const chars = "0123456789abcdef";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface LogLine {
  text: string;
  delayMs: number;
}

/**
 * Builds a plausible-looking `docker build` log from the Dockerfile shown
 * above it — not a canned transcript. Each instruction becomes its own
 * "Step N/M" line verbatim, so the log always matches whatever Dockerfile
 * this instance was given, without needing a real Docker daemon.
 *
 * Per-line delays are deliberate, not decorative: a real `pip install`
 * takes real time, so RUN steps play back slower than structural steps
 * (FROM/WORKDIR/COPY/CMD) — the whole point of a cache hit is that it
 * skips that real work, which only reads as "skipped" if the uncached
 * version was slow enough in the first place for the contrast to
 * actually register (multi-second, not a few hundred milliseconds —
 * the whole point is a human watching it feels the difference).
 */
function buildLogFor(instructions: string[], cacheHit: boolean): LogLine[] {
  const lines: LogLine[] = [];
  instructions.forEach((instruction, i) => {
    lines.push({ text: `Step ${i + 1}/${instructions.length} : ${instruction}`, delayMs: 100 });
    const isRun = /^RUN\s+/i.test(instruction);
    const pipInstall = instruction.match(/^RUN\s+pip install\s+(.+)/i);

    if (isRun && cacheHit) {
      lines.push({ text: " ---> Using cache", delayMs: 200 });
      lines.push({ text: ` ---> ${fakeHash()}`, delayMs: 100 });
    } else if (pipInstall) {
      const packages = pipInstall[1].split(/\s+/).filter((pkg) => pkg && !pkg.startsWith("-"));
      lines.push({ text: ` ---> Running in ${fakeHash()}`, delayMs: 1200 });
      for (const pkg of packages) {
        lines.push({ text: `Collecting ${pkg}`, delayMs: 1800 });
        lines.push({ text: `  Downloading ${pkg}`, delayMs: 1800 });
      }
      lines.push({ text: `Installing collected packages: ${packages.join(", ")}`, delayMs: 1500 });
      lines.push({ text: `Successfully installed ${packages.join(" ")}`, delayMs: 1000 });
      lines.push({ text: ` ---> ${fakeHash()}`, delayMs: 300 });
    } else if (isRun) {
      lines.push({ text: ` ---> Running in ${fakeHash()}`, delayMs: 1500 });
      lines.push({ text: ` ---> ${fakeHash()}`, delayMs: 1500 });
    } else {
      lines.push({ text: ` ---> ${fakeHash()}`, delayMs: 100 });
    }
  });
  lines.push({ text: `Successfully built ${fakeHash()}`, delayMs: 100 });
  lines.push({ text: "Successfully tagged my-app:latest", delayMs: 0 });
  return lines;
}

/**
 * Shows a Dockerfile (read-only) with a Build button that streams a
 * generated log line by line. Not a real `docker build` — see
 * Terminal/TerminalGroup's doc comment for the same rationale — just a
 * typical Dockerfile and a look at what running it actually produces.
 */
export default function DockerBuildDemo({ dockerfile, cacheHit = false, buildLabel }: DockerBuildDemoProps) {
  const [log, setLog] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [building, setBuilding] = useState(false);

  const build = async () => {
    const lines = buildLogFor(parseInstructions(dockerfile), cacheHit);
    setBuilding(true);
    setLog(lines.map((l) => l.text));
    setRevealed(0);
    for (let i = 0; i < lines.length; i++) {
      await sleep(lines[i].delayMs);
      setRevealed(i + 1);
    }
    setBuilding(false);
  };

  const restingLabel = buildLabel ?? (revealed > 0 ? "Build again" : "Build");

  return (
    <div className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-sandbox-light)] px-3 py-1.5">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-sandbox-dark)] uppercase">Dockerfile</span>
        <button
          onClick={build}
          disabled={building}
          className="rounded-md bg-[var(--color-sandbox)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {building ? "Building…" : restingLabel}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-code-bg)] p-3 font-mono text-[0.8rem] leading-relaxed whitespace-pre text-gray-100">
        {dockerfile}
      </pre>
      <pre className="m-0 min-h-[3rem] overflow-x-auto bg-[var(--color-code-bg)] p-3 font-mono text-[0.75rem] leading-relaxed whitespace-pre-wrap text-gray-400">
        {revealed > 0 ? log.slice(0, revealed).join("\n") : `click "${restingLabel}" to see the build log`}
      </pre>
    </div>
  );
}
