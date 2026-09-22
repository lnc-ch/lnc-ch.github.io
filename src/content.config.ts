import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { newspaperSchema } from './lib/newspaper/schema';

const titleCopy = z.object({ text: z.string() });
const descriptionCopy = z.object({ text: z.string().optional() });
const heroCopy = z.object({ eyebrow: z.string().optional(), heading: z.string(), subheading: z.string().optional() });
const richTextCopy = z.object({ heading: z.string().optional(), body: z.string() });
const splitCopy = z.object({ heading: z.string(), body: z.string(), imageAlt: z.string().optional() });
const galleryHeadingCopy = z.object({ heading: z.string().optional() });
const galleryItemCopy = z.object({ alt: z.string().optional(), caption: z.string().optional() });
const ctaCopy = z.object({ heading: z.string(), body: z.string().optional(), label: z.string() });
const heroSchema = z.object({
  type: z.literal('hero'), layout: z.enum(['default', 'center']).default('default'), image: z.string().optional(),
  copy: z.object({ ja: heroCopy, fr: heroCopy.partial().optional(), en: heroCopy.partial().optional() }),
});
const richTextSchema = z.object({
  type: z.literal('rich_text'), variant: z.enum(['standard', 'statement']).default('standard'),
  copy: z.object({ ja: richTextCopy, fr: richTextCopy.partial().optional(), en: richTextCopy.partial().optional() }),
});
const splitSchema = z.object({
  type: z.literal('split'), image: z.string(), imagePosition: z.enum(['left', 'right']).default('right'),
  copy: z.object({ ja: splitCopy, fr: splitCopy.partial().optional(), en: splitCopy.partial().optional() }),
});
const galleryItemSchema = z.object({ image: z.string(), copy: z.object({ ja: galleryItemCopy, fr: galleryItemCopy.partial().optional(), en: galleryItemCopy.partial().optional() }) });
const gallerySchema = z.object({
  type: z.literal('gallery'), items: z.array(galleryItemSchema),
  copy: z.object({ ja: galleryHeadingCopy, fr: galleryHeadingCopy.partial().optional(), en: galleryHeadingCopy.partial().optional() }),
});
const ctaSchema = z.object({
  type: z.literal('cta'), href: z.string(),
  copy: z.object({ ja: ctaCopy, fr: ctaCopy.partial().optional(), en: ctaCopy.partial().optional() }),
});
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/data/pages' }),
  schema: z.object({
    key: z.string(),
    title: z.object({ ja: titleCopy, fr: titleCopy.partial().optional(), en: titleCopy.partial().optional() }),
    slug: z.string(),
    description: z.object({ ja: descriptionCopy, fr: descriptionCopy.partial().optional(), en: descriptionCopy.partial().optional() }),
    translationReview: z.object({ fr: z.enum(['draft', 'reviewed']).default('draft'), en: z.enum(['draft', 'reviewed']).default('draft') }).default({ fr: 'draft', en: 'draft' }),
    sections: z.array(z.discriminatedUnion('type', [heroSchema, richTextSchema, splitSchema, gallerySchema, ctaSchema, newspaperSchema])),
  }).superRefine((page, context) => {
    const editions = new Set<string>();
    page.sections.forEach((section, sectionIndex) => {
      if (section.type !== 'newspaper') return;
      if (editions.has(section.id)) context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'id'], message: `Duplicate newspaper ID: ${section.id}` });
      editions.add(section.id);
      const stories = new Set<string>();
      section.stories.forEach((story, storyIndex) => {
        if (stories.has(story.id)) context.addIssue({ code: 'custom', path: ['sections', sectionIndex, 'stories', storyIndex, 'id'], message: `Duplicate story ID: ${story.id}` });
        stories.add(story.id);
      });
    });
  }),
});
export const collections = { pages };
