export const locales = ["ja", "fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  ja: "日本語",
  fr: "FR",
  en: "EN",
};

export function localizePath(slug: string, locale: Locale): string {
  const clean =
      slug === "/" ? "" : `/${slug.replace(/^\/+|\/+$/g, "")}`;

  if (locale === "ja") {
    return clean || "/";
  }

  return `/${locale}${clean || "/"}`;
}

export function localizeHref(
    href: string,
    locale: Locale,
): string {
  if (
      locale === "ja" ||
      !href.startsWith("/") ||
      href.startsWith("//") ||
      href.startsWith("/fr/") ||
      href.startsWith("/en/")
  ) {
    return href;
  }

  return localizePath(href, locale);
}

export function getLocalizedCopy<T extends object>(
    copy: {
      ja: T;
      fr?: Partial<T>;
      en?: Partial<T>;
    },
    locale: Locale,
): T {
  if (locale === "ja") {
    return copy.ja;
  }

  return {
    ...copy.ja,
    ...(copy[locale] ?? {}),
  } as T;
}