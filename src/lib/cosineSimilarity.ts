/**
 * Vectors from src/data/embedding-sentences.json are already unit-normalized
 * (generated with normalize_embeddings=True), so cosine similarity reduces
 * to a plain dot product — no separate magnitude division needed.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
