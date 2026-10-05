import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

import { parse } from 'yaml';
const drafts=readdirSync('src/data/events').filter(file=>/\.ya?ml$/.test(file)).map(file=>parse(readFileSync(join('src/data/events',file),'utf8'))).filter(event=>event.draft!==false).map(event=>event.slug);

for (const locale of ['', 'fr/', 'en/']) {
  for (const page of ['', 'about/', 'events/', 'join/']) {
    const path=join('dist',locale,page,'index.html');
    assert.ok(existsSync(path),`Missing production route: ${path}`);
    const html=readFileSync(path,'utf8');
    assert.equal((html.match(/data-barba="container"/g)||[]).length,1,`Wrong container count in ${path}`);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,`Wrong heading count in ${path}`);
    assert.doesNotMatch(html,/class="preview-banner"|Design preview · sample events/);
    // Included examples are drafts, not announcements.
    for (const slug of drafts) {
      assert.doesNotMatch(html,new RegExp(`href="[^"]*/events/${slug}/`),`Draft leaked in ${path}`);
      assert.ok(!existsSync(join('dist',locale,'events',slug,'index.html')),`Draft page was emitted: ${slug}`);
    }
  }
}
console.log('Production audit passed: 12 required routes, one H1/container each, no draft-event pages or links.');
