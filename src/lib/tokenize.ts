import { decode, encode } from "gpt-tokenizer";

/**
 * Splits text into its real token pieces (o200k_base, the default OpenAI
 * encoding) by decoding one token id at a time. An exotic multi-byte
 * character split across several tokens can yield an empty-string piece
 * mid-sequence before the full character resolves on a later piece —
 * filtered out here since it renders nothing anyway.
 */
export function tokenizePieces(text: string): string[] {
  if (!text) return [];
  return encode(text)
    .map((id) => decode([id]))
    .filter((piece) => piece.length > 0);
}
