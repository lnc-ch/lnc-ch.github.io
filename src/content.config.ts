import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { safeHref, validTimestamp } from './lib/content.mjs';

const optionalText = z.string().optional();
const text = z.object({ text: z.string().min(1) });
const localized = <T extends z.ZodRawShape>(shape: T) => z.object({
  ja: z.object(shape), fr: z.object(shape).partial().optional(), en: z.object(shape).partial().optional(),
});
const link = z.string().refine((value) => value === '' || Boolean(safeHref(value)), 'Use a local path or an http(s), mailto or tel URL.');
const image = z.string().refine((value) => !value || (/^(\/(?!\/)|https?:\/\/)/.test(value) && Boolean(safeHref(value))), 'Use a local image path or an https:// image URL.');
const theme = z.enum(['paper', 'clay', 'moss', 'rose', 'ink']);
const review = z.object({ fr: z.enum(['draft','reviewed']).default('draft'), en: z.enum(['draft','reviewed']).default('draft') }).default({ fr:'draft', en:'draft' });
const sections = z.discriminatedUnion('type', [
  z.object({ type: z.literal('event_index') }),
  z.object({ type: z.literal('programme'), limit: z.number().int().min(1).max(4).default(4) }),
  z.object({ type: z.literal('rich_text'), variant: z.enum(['standard','statement']).default('standard'), copy: localized({ heading: optionalText, body: z.string() }) }),
  z.object({ type: z.literal('split'), image, imagePosition: z.enum(['left','right']).default('right'), copy: localized({ heading: optionalText, body: z.string(), imageAlt: optionalText }) }),
  z.object({ type: z.literal('gallery'), copy: localized({ heading: optionalText }), items: z.array(z.object({ image, copy: localized({ alt: optionalText, caption: optionalText }) })) }),
  z.object({ type: z.literal('cta'), href: link, copy: localized({ heading: optionalText, body: optionalText, label: z.string().min(1) }) }),
  z.object({ type: z.literal('membership') }),
]);
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/data/pages' }),
  schema: z.object({
    key: z.string().regex(/^[a-z0-9-]+$/), slug: z.string().startsWith('/'),
    kind: z.enum(['home','programme','content']).default('content'), theme: theme.default('paper'), draft: z.boolean().default(true),
    title: localized(text.shape), description: localized({ text: optionalText }), translationReview: review,
    sections: z.array(sections).default([]),
  }),
});
const events = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/data/events' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), draft: z.boolean().default(true),
    status: z.enum(['scheduled','cancelled']).default('scheduled'), theme: theme.default('clay'),
    start: z.string().refine(validTimestamp, 'Use an ISO date/time with an explicit timezone offset.'),
    end: z.string().refine(validTimestamp, 'Use an ISO date/time with an explicit timezone offset.'),
    location: z.string().min(1),
    registrationUrl: z.string().refine((value) => !value || (value.startsWith('https://') && Boolean(safeHref(value))), 'Registration must use HTTPS.').default(''),
    image: image.default(''), imageIllustration: z.boolean().default(false), translationReview: review,
    copy: localized({ title: z.string().min(1), body: z.string(), imageAlt: optionalText }),
  }).refine((event) => Date.parse(event.end) >= Date.parse(event.start), { path: ['end'], message: 'End must not precede start.' }),
});
export const collections = { pages, events };
