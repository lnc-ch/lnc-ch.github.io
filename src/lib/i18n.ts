import * as shared from './newspaper/i18n.mjs';

export const locales = ['ja', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const localeLabels: Record<Locale, string> = shared.localeLabels;

export function localizePath(slug: string, locale: Locale): string {
  return shared.localizePath(slug, locale);
}
export function localizeHref(href: string, locale: Locale): string {
  return shared.localizeHref(href, locale);
}
export function getLocalizedCopy<T extends object>(
  copy: { ja: T; fr?: Partial<T>; en?: Partial<T> }, locale: Locale,
): T {
  return shared.getLocalizedCopy(copy, locale) as T;
}
