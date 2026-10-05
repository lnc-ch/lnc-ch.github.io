/** Shared, dependency-free content rules. Used by Astro, rendering and tests. */
export const locales = Object.freeze(['ja', 'fr', 'en']);
export const localeLabels = Object.freeze({ ja: '日本語', fr: 'FR', en: 'EN' });
const palettes = Object.freeze({
  paper: Object.freeze({ background: '#f3f2ed', foreground: '#171917' }),
  clay: Object.freeze({ background: '#c87860', foreground: '#171917' }),
  moss: Object.freeze({ background: '#8c9c87', foreground: '#171917' }),
  rose: Object.freeze({ background: '#d9c1bc', foreground: '#171917' }),
  ink: Object.freeze({ background: '#202321', foreground: '#f3f2ed' }),
});
export const themeNames = Object.freeze(Object.keys(palettes));
export const themeFor = (name) => palettes[name] ?? palettes.paper;

export function safeHref(value) {
  if (typeof value !== 'string' || /[\x00-\x20\x7f\\]/.test(value)) return '';
  if (value.startsWith('//')) return '';
  if (value.startsWith('/') || value.startsWith('#')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? value : '';
  } catch { return ''; }
}

export function localizePath(href, locale) {
  if (!locales.includes(locale)) throw new Error(`Unsupported locale: ${locale}`);
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('#')) return href;
  const index = href.search(/[?#]/);
  const suffix = index < 0 ? '' : href.slice(index);
  let path = (index < 0 ? href : href.slice(0, index)).replace(/^\/+|\/+$/g, '');
  path = path.replace(/^(ja|fr|en)(\/|$)/, '');
  const parts = [locale === 'ja' ? '' : locale, path].filter(Boolean);
  return `/${parts.join('/')}${parts.length ? '/' : ''}${suffix}`;
}

export function copyFor(copy, locale) {
  const original = copy?.ja ?? {};
  const translated = copy?.[locale] ?? {};
  return Object.fromEntries(Object.keys({ ...original, ...translated }).map((key) => {
    const value = translated[key];
    return [key, typeof value === 'string' && value.trim() ? value : original[key] ?? ''];
  }));
}
export const copyLanguage = (copy, locale, field) => copy?.[locale]?.[field]?.trim() ? locale : 'ja';

export function validTimestamp(value) {
  if (typeof value !== 'string') return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return false;
  const [, y, m, d, h, min, sec] = parts;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(m) - 1 && date.getUTCDate() === Number(d)
    && Number(h) < 24 && Number(min) < 60 && Number(sec ?? 0) < 60 && Number.isFinite(Date.parse(value));
}

export function validateEvent(event) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug ?? '')) throw new Error(`Invalid event slug: ${event.slug}`);
  if (!validTimestamp(event.start)) throw new Error(`Invalid start date or missing timezone offset: ${event.slug}`);
  if (!validTimestamp(event.end)) throw new Error(`Invalid end date or missing timezone offset: ${event.slug}`);
  if (Date.parse(event.end) < Date.parse(event.start)) throw new Error(`Event end precedes its start: ${event.slug}`);
  return event;
}

export function eventState(event, now = new Date()) {
  if (event.status === 'cancelled') return 'cancelled';
  const time = Number(now);
  if (Date.parse(event.end) <= time) return 'past';
  return Date.parse(event.start) <= time ? 'ongoing' : 'upcoming';
}

export function selectEvents(events, now = new Date(), preview = false) {
  const all = events.filter((event) => preview || !event.draft).slice().sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const upcoming = all.filter((event) => Date.parse(event.end) > Number(now));
  const past = all.filter((event) => Date.parse(event.end) <= Number(now)).reverse();
  const featured = upcoming.find((event) => event.status !== 'cancelled') ?? past.find((event) => event.status !== 'cancelled') ?? null;
  return { all, upcoming, past, featured };
}

export function dateParts(value, locale = 'ja') {
  const date = new Date(value);
  const language = { ja: 'ja-JP', fr: 'fr-CH', en: 'en-GB' }[locale] ?? 'en-GB';
  const zone = { timeZone: 'Europe/Zurich' };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { ...zone, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(date).map((part) => [part.type, part.value]));
  return {
    ...parts,
    numeric: `${parts.day}.${parts.month}.${parts.year.slice(-2)}`,
    time: new Intl.DateTimeFormat('en-GB', { ...zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date),
    long: new Intl.DateTimeFormat(language, { ...zone, day: 'numeric', month: 'long', year: 'numeric' }).format(date),
    weekday: new Intl.DateTimeFormat(language, { ...zone, weekday: 'long' }).format(date),
  };
}

/** One route registry prevents duplicate paths across pages/events/languages. */
export function routeEntries(pages, events, preview = false) {
  const source = [
    ...pages.filter((page) => preview || !page.draft).map((page) => ({ kind: page.kind ?? 'content', slug: page.slug, page })),
    ...events.filter((event) => preview || !event.draft).map((event) => ({ kind: 'event', slug: `/events/${validateEvent(event).slug}/`, event })),
  ];
  const paths = new Set();
  return source.flatMap((item) => locales.map((locale) => {
    if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9-]*\/?$/.test(item.slug)) throw new Error(`Invalid page slug: ${item.slug}`);
    const path = localizePath(item.slug, locale);
    if (paths.has(path)) throw new Error(`Duplicate route: ${path}`);
    paths.add(path);
    return { ...item, locale, path, param: path.slice(1).replace(/\/$/, '') || undefined };
  }));
}

export const ui = {
  ja: {
    events: '催事', about: 'サークルについて', join: '入会案内', home: 'ホーム', allEvents: 'すべての催事', nextEvent: '次回の催事', recentEvent: '最近の催事',
    upcoming: 'これから', past: 'これまで', ongoing: '開催中', cancelled: '開催中止', archived: '終了', date: '日付', time: '時間', location: '場所',
    registration: '参加申込', register: '申し込む', details: '詳細', empty: '現在、開催予定の催事はありません。', emptyPast: '過去の催事はまだありません。',
    contact: 'お問い合わせ', email: 'メール', follow: 'Instagram', back: '戻る', skip: '本文へ', language: '言語', nav: 'メインナビゲーション',
    preview: 'デザインプレビュー · 催事はサンプルです', sample: 'サンプル', illustration: 'イメージ画像',
    joinPending: '入会方法は準備中です。今後のお知らせをご確認ください。', membership: '入会手続き', noForm: '申込先が公開されるまでお待ちください。',
    notFound: 'ページが見つかりません', returnHome: 'ホームへ戻る', next: '次の催事', localTime: '時間はスイス現地時間です。',
  },
  fr: {
    events: 'Événements', about: 'Le cercle', join: 'Adhérer', home: 'Accueil', allEvents: 'Tous les événements', nextEvent: 'Prochain événement', recentEvent: 'Dernier événement',
    upcoming: 'À venir', past: 'Archives', ongoing: 'En cours', cancelled: 'Annulé', archived: 'Terminé', date: 'Date', time: 'Horaire', location: 'Lieu',
    registration: 'Inscription', register: 'S’inscrire', details: 'Détails', empty: 'Aucun événement annoncé pour le moment.', emptyPast: 'Aucun événement archivé pour le moment.',
    contact: 'Contact', email: 'E-mail', follow: 'Instagram', back: 'Retour', skip: 'Aller au contenu', language: 'Langue', nav: 'Navigation principale',
    preview: 'Aperçu du design · événements fictifs', sample: 'Exemple', illustration: 'Image d’illustration',
    joinPending: 'Les modalités d’adhésion seront publiées ici. Consultez les prochains événements.', membership: 'Adhésion', noForm: 'Le lien d’inscription n’est pas encore publié.',
    notFound: 'Page introuvable', returnHome: 'Retour à l’accueil', next: 'Événement suivant', localTime: 'Tous les horaires sont en heure suisse.',
  },
  en: {
    events: 'Events', about: 'About', join: 'Join', home: 'Home', allEvents: 'All events', nextEvent: 'Next event', recentEvent: 'Recent event',
    upcoming: 'Upcoming', past: 'Archive', ongoing: 'Happening now', cancelled: 'Cancelled', archived: 'Past event', date: 'Date', time: 'Time', location: 'Location',
    registration: 'Registration', register: 'Register', details: 'Details', empty: 'No events announced at the moment.', emptyPast: 'No past events yet.',
    contact: 'Contact', email: 'Email', follow: 'Instagram', back: 'Back', skip: 'Skip to content', language: 'Language', nav: 'Main navigation',
    preview: 'Design preview · sample events', sample: 'Sample', illustration: 'Illustrative image',
    joinPending: 'Membership details will be published here. Check the programme for upcoming events.', membership: 'Membership', noForm: 'The registration link has not been published yet.',
    notFound: 'Page not found', returnHome: 'Return home', next: 'Next event', localTime: 'All times are local to Switzerland.',
  },
};
