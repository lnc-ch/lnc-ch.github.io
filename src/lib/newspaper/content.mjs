import { getLocalizedCopy, localizePath } from './i18n.mjs';

export const ui = {
  ja: { read: '続きを読む', back: '一面に戻る', specimen: '試作号・見本記事', sample: 'この記事はレイアウト確認用の仮原稿です。実際の催事・募集のお知らせではありません。', text: '横組で読む', paper: '紙面に戻す', language: '言語', skip: '本文へ', publisher: '発行', edition: '日本語版', edited: '編集・発行', issue: '第', noBody: '本文は準備中です。', next: '次の記事', previous: '前の記事' },
  fr: { read: 'Lire la suite', back: 'Retour à la une', specimen: 'Édition spécimen · textes de démonstration', sample: 'Texte de démonstration pour la maquette. Il ne constitue pas une annonce réelle d’événement ou d’inscription.', text: 'Vue lecture', paper: 'Vue journal', language: 'Langue', skip: 'Aller au contenu', publisher: 'Publication', edition: 'Édition française', edited: 'Rédaction & publication', issue: 'Nº', noBody: 'Texte à venir.', next: 'Article suivant', previous: 'Article précédent' },
  en: { read: 'Continue reading', back: 'Back to the front page', specimen: 'Specimen edition · placeholder articles', sample: 'Placeholder copy for the layout, not an announcement of a real event or an invitation to register.', text: 'Reading view', paper: 'Newspaper view', language: 'Language', skip: 'Skip to content', publisher: 'Published by', edition: 'English edition', edited: 'Edited & published by', issue: 'No.', noBody: 'Article text coming soon.', next: 'Next article', previous: 'Previous article' },
};

// Original, intentionally non-factual filler. Never injected into a real article.
export const lorem = {
  ja: 'これは紙面の組み方と文字の流れを確かめるための見本原稿です。ローザンヌの街に朝の光が差し、湖から届く風が新しい一日の始まりを知らせます。人と人との出会い、言葉と文化の交わり、小さな発見をこの一枚に集めました。\n\n遠い場所を身近に感じるきっかけは、何気ない会話の中にあるのかもしれません。一冊の本を開くように、知らなかった風景へと目を向けてみましょう。ここに入る文章は自由に差し替えることができます。見出しの大きさ、段組みのリズム、余白の形を確認してください。\n\n季節が移り、街の景色が変わっても、誰かと過ごした時間はゆっくりと記憶に残ります。今日の一言が明日のつながりになる。この文章は実際の催事や活動を紹介するものではなく、誌面制作のための仮の文章です。\n\nこの場所には、これから生まれる物語のための余白があります。読む人の目が右から左へ、見出しから本文へと自然に移るように、文字の大きさや行の間隔を調整しています。文字が並ぶことで一枚の紙面が形を持ち、いくつもの話題がひとつの風景になっていきます。\n\nここに書かれていることは、すべて組版を確かめるための仮の文章です。実際の記事を掲載する際には、この見本文を新しい原稿に置き換えてください。長い記事にも短いお知らせにも、それぞれの場所があります。日々の小さな発見を持ち寄りながら、この紙面を少しずつ育てていきましょう。',
  fr: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Au fil des colonnes, les mots dessinent un lieu de rencontre entre deux cultures. Ce texte de maquette permet d’apprécier le rythme des paragraphes, la largeur des colonnes et le contraste des caractères.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Une conversation, un livre ouvert, un détail aperçu au bord du lac : autant de points de départ pour imaginer le prochain article. Les informations définitives seront ajoutées par la rédaction.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Ces lignes sont provisoires et ne décrivent aucun événement réel. Elles peuvent être remplacées dans le CMS, sans modifier la mise en page ni écrire de code.',
  en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Between the columns, a small meeting place takes shape: a conversation, an open book, a glimpse of the lake. This specimen text lets the type, the measure and the rhythm of the page speak before the final stories arrive.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. There is room here for the familiar and the unexpected, for a short notice beside a longer read. The editors will replace these lines with the association’s own words.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. This is placeholder editorial copy, not a description of an actual event. Every headline and paragraph can be changed in the CMS without writing code.',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

/** Allow web, email and same-site links, never executable or control-character URLs. */
export function safeHref(value, fallback = '#main') {
  const href = String(value ?? '').trim();
  if (!href || /[\u0000-\u0020\u007f\\]/.test(href)) return fallback;
  if (/^(?:https?:\/\/|mailto:)/i.test(href)) return href;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith('#')) return href;
  return fallback;
}

export function safeImage(value) {
  const href = safeHref(value, '');
  return /^(?:https?:\/\/|\/(?!\/))/i.test(href) ? href : '';
}

export function storyCopy(story, locale) {
  const copy = getLocalizedCopy(story.copy, locale);
  // Filler is explicit, locale-specific, and only available on specimen articles.
  const ownBody = story.copy?.[locale]?.body;
  const body = story.placeholder && !ownBody?.trim() ? lorem[locale] : (copy.body || '');
  return { ...copy, body };
}

export function articlePath(slug, editionId, storyId) {
  const root = slug === '/' ? '' : slug.replace(/\/$/, '');
  return `${root}/journal/${encodeURIComponent(editionId)}/${encodeURIComponent(storyId)}`;
}

export function articleHref(slug, editionId, storyId, locale) {
  return localizePath(articlePath(slug, editionId, storyId), locale);
}

export function formatIssueDate(date, locale) {
  // Noon UTC avoids a previous-day date in the Lausanne timezone.
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) return '';
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : locale === 'fr' ? 'fr-CH' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Zurich',
  }).format(parsed);
}

export function excerpt(body, locale, amount = 1) {
  const text = String(body || '').replace(/\s+/g, ' ').trim();
  if (locale === 'ja') {
    const characters = Array.from(text);
    const limit = Math.round(250 * amount);
    return characters.length > limit ? characters.slice(0, limit).join('') + '…' : text;
  }
  const words = text.split(' ');
  const limit = Math.round(105 * amount);
  return words.length > limit ? words.slice(0, limit).join(' ') + '…' : text;
}

export function validateEdition(edition) {
  const ids = new Set();
  if (!/^[a-z0-9-]+$/.test(edition.id)) throw new Error('Newspaper edition IDs must use lowercase letters, digits or hyphens.');
  for (const story of edition.stories || []) {
    if (!/^[a-z0-9-]+$/.test(story.id)) throw new Error(`Invalid story ID: ${story.id}`);
    if (ids.has(story.id)) throw new Error(`Duplicate story ID in ${edition.id}: ${story.id}`);
    ids.add(story.id);
  }
  return edition;
}
