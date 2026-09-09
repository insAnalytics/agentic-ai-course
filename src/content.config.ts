import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const modules = defineCollection({
  loader: glob({ pattern: "*/_module.yaml", base: "./src/content/modules" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: "*/*/_lesson.yaml", base: "./src/content/modules" }),
  schema: z.object({
    title: z.string(),
    module: z.string(),
    order: z.number(),
    /** Whole-lesson fallback for exercises too heavy for the browser — separate from the
     * per-exercise LiveDemo/GradedExercise components used inline in the lesson body. */
    projectDownload: z
      .object({
        enabled: z.boolean().default(false),
        repo: z.string().optional(),
      })
      .default({ enabled: false }),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*/*/*.mdx", base: "./src/content/modules" }),
  schema: z.object({
    title: z.string(),
    lesson: z.string(),
    order: z.number(),
  }),
});

export const collections = { modules, lessons, pages };
