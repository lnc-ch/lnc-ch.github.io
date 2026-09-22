import { z } from 'astro/zod';
import { formatIssueDate } from './content.mjs';

const editionCopy = z.object({
  masthead: z.string().min(1),
  subtitle: z.string().optional(),
  season: z.string().optional(),
  edition: z.string().optional(),
  publisherName: z.string().optional(),
  publisherNote: z.string().optional(),
  railLabel: z.string().optional(),
  bottomLabel: z.string().optional(),
  colophon: z.string().optional(),
});
const articleCopy = z.object({
  title: z.string().min(1),
  label: z.string().optional(),
  deck: z.string().optional(),
  body: z.string().optional(),
  meta: z.string().optional(),
  byline: z.string().optional(),
  imageAlt: z.string().optional(),
  action: z.string().optional(),
});
const id = z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens.');
export const newspaperStorySchema = z.object({
  id,
  area: z.enum(['main', 'rail', 'bottom']).default('main'),
  kind: z.enum(['article', 'poster', 'lead', 'brief']).default('article'),
  span: z.number().int().min(1).max(12).default(4),
  tone: z.enum(['paper', 'ink']).default('paper'),
  placeholder: z.boolean().default(false),
  href: z.string().optional(),
  image: z.string().optional(),
  copy: z.object({ ja: articleCopy, fr: articleCopy.partial().optional(), en: articleCopy.partial().optional() }),
});
export const newspaperSchema = z.object({
  type: z.literal('newspaper'),
  id,
  issue: z.string().min(1),
  date: z.string().refine(date => Boolean(formatIssueDate(date, 'en')), 'Use a real calendar date in YYYY-MM-DD format.'),
  logo: z.string().optional(),
  copy: z.object({ ja: editionCopy, fr: editionCopy.partial().optional(), en: editionCopy.partial().optional() }),
  stories: z.array(newspaperStorySchema),
});
export type NewspaperSection = z.infer<typeof newspaperSchema>;
export type NewspaperStory = z.infer<typeof newspaperStorySchema>;
