import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Renders a plain string prop (task/hint/explanation), turning any
 * `[text](url)` markdown link into a real anchor — the only markdown this
 * parses. `hint`/`explanation`/`task` are plain strings (not MDX), so a
 * callback link written the same way as page prose otherwise renders as
 * inert bracket-and-paren text; this is what makes it clickable.
 */
export default function LinkedText({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  LINK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const url = match[2];
    const href = url.startsWith("/") ? `${base}${url}` : url;
    parts.push(
      <a key={key++} href={href}>
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <>{parts}</>;
}
