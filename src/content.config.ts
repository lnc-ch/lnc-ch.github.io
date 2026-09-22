import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const heroSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  heading: z.string(),
  subheading: z.string().optional(),
  image: z.string().optional(),
  layout: z.enum(["left", "center"]).default("left"),
});

const richTextSchema = z.object({
  type: z.literal("rich_text"),
  heading: z.string().optional(),
  body: z.string(),
});

const splitSchema = z.object({
  type: z.literal("split"),
  heading: z.string(),
  body: z.string(),
  image: z.string(),
  imageAlt: z.string().default(""),
  imagePosition: z.enum(["left", "right"]).default("right"),
});

const gallerySchema = z.object({
  type: z.literal("gallery"),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      image: z.string(),
      alt: z.string().default(""),
      caption: z.string().optional(),
    }),
  ),
});

const ctaSchema = z.object({
  type: z.literal("cta"),
  heading: z.string(),
  body: z.string().optional(),
  link: linkSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{yaml,yml}", base: "./src/data/pages" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    sections: z.array(
      z.discriminatedUnion("type", [
        heroSchema,
        richTextSchema,
        splitSchema,
        gallerySchema,
        ctaSchema,
      ]),
    ),
  }),
});

export const collections = { pages };
