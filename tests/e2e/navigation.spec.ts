import { test, expect, type Page } from '@playwright/test';

import site from '../../src/data/site.json' with { type: 'json' };

const origin='http://127.0.0.1:4173';
async function ready(page:Page,path:string) {
  await expect(page.locator('.page-shell')).toHaveCount(1);
  await expect(page.locator('.page-shell')).toHaveAttribute('data-page-path',path);
  await expect(page.locator('html')).not.toHaveClass(/is-transitioning/);
  await expect(page.locator('html')).not.toHaveAttribute('aria-busy','true');
}

async function overflowReport(page:Page) {
  return page.evaluate(() => {
    const viewport=document.documentElement.clientWidth;
    return [...document.querySelectorAll<HTMLElement>('body *')]
      .map((element) => {
        const rect=element.getBoundingClientRect();
        return {tag:element.tagName.toLowerCase(),className:element.className,left:rect.left,right:rect.right,width:rect.width,text:(element.textContent ?? '').trim().replace(/\s+/g,' ').slice(0,80)};
      })
      .filter((item) => item.left < -1 || item.right > viewport + 1)
      .slice(0,12);
  });
}

async function home(page:Page) {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-lnc-ready','true');
  await page.evaluate(()=>document.fonts.ready);
}

test('home → card expands → matching full-colour page → Back contracts and restores focus',async({page},testInfo)=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await home(page);
  await page.evaluate(()=>{(window as any).__lncNavigationProbe='same-document';});
  const card=page.locator('[data-card-key="autumn-gathering"]').first();
  await card.scrollIntoViewIfNeeded();
  const color=await card.evaluate(element=>getComputedStyle(element).backgroundColor);
  const y=await page.evaluate(()=>window.scrollY);
  await page.screenshot({path:testInfo.outputPath('home.png'),fullPage:true});
  await card.click();
  await expect(page.locator('#transition-layer')).toBeVisible();
  await expect(page.locator('#transition-layer')).toHaveCSS('background-color',color);
  await ready(page,'/en/events/autumn-gathering/');
  await expect(page.locator('.page-shell')).toHaveCSS('background-color',color);
  await expect(page.locator('[data-page-focus]')).toBeFocused();
  await expect(page).toHaveTitle('Autumn Gathering — LNC');
  expect(await page.evaluate(()=>(window as any).__lncNavigationProbe)).toBe('same-document');
  await page.screenshot({path:testInfo.outputPath('event.png'),fullPage:true});
  await page.goBack();
  await ready(page,'/en/');
  await expect(page.locator('[data-card-key="autumn-gathering"]').first()).toBeFocused();
  expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(4);
  expect(errors).toEqual([]);
});

test('language switches update content, HTML lang, title, canonical and alternate links',async({page})=>{
  await home(page);
  await page.locator('[data-card-key="film-screening"]').first().click();
  await ready(page,'/en/events/film-screening/');
  await page.locator('.language-switch a[hreflang="fr"]').click();
  await ready(page,'/fr/events/film-screening/');
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await expect(page).toHaveTitle('Soirée cinéma — LNC');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new URL('/fr/events/film-screening/',site.url).href);
  await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveAttribute('href',new URL('/events/film-screening/',site.url).href);
  await expect(page.locator('.language-switch a[hreflang="fr"]')).toHaveAttribute('aria-current','page');
});

test('history keeps separate scroll positions for repeat visits to the same route',async({page})=>{
  await home(page);
  await page.locator('[data-card-key="year-end-party"]').first().scrollIntoViewIfNeeded();
  const y=await page.evaluate(()=>scrollY);
  await page.locator('[data-card-key="year-end-party"]').first().click();
  await ready(page,'/en/events/year-end-party/');
  await page.locator('.compact-brand > a').click();
  await ready(page,'/en/');
  expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
  await page.goBack();
  await ready(page,'/en/events/year-end-party/');
  await page.goBack();
  await ready(page,'/en/');
  expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(4);
});

test('twenty navigations do not duplicate containers, overlays, Lenis wrappers or metadata',async({page})=>{
  await home(page);
  for(let i=0;i<10;i++) {
    await page.locator('[data-card-key="autumn-gathering"]').first().click();
    await ready(page,'/en/events/autumn-gathering/');
    await page.locator('.compact-brand > a').click();
    await ready(page,'/en/');
  }
  await expect(page.locator('[data-barba="container"]')).toHaveCount(1);
  await expect(page.locator('#transition-layer')).toHaveCount(1);
  await expect(page.locator('.lenis')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('title')).toHaveCount(1);
});

test('reduced motion keeps native scrolling and skips spatial transitions',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await home(page);
  await expect(page.locator('.lenis')).toHaveCount(0);
  await page.locator('[data-card-key="autumn-gathering"]').first().click();
  await ready(page,'/en/events/autumn-gathering/');
  await expect(page.locator('#transition-layer')).toBeHidden();
  await expect(page.locator('[data-page-focus]')).toBeFocused();
});

test('all content and links work with JavaScript disabled',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto(`${origin}/en/`);
  await expect(page.locator('h1')).toContainText('LAUSANNE NIHONJIN');
  await page.locator('[data-card-key="autumn-gathering"]').first().click();
  await expect(page).toHaveURL(`${origin}/en/events/autumn-gathering/`);
  await expect(page.locator('h1')).toContainText('秋の交流会');
  await context.close();
});

test('a failed hover prefetch does not navigate; a failed click falls back to native loading',async({page})=>{
  await home(page);
  const route='**/en/about/';
  await page.route(route,handler=>handler.request().resourceType()==='xhr' ? handler.abort() : handler.continue());
  await page.locator('.site-nav__link[href="/en/about/"]').hover();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(`${origin}/en/`);
  await expect(page.locator('#transition-layer')).toBeHidden();
  await page.locator('.site-nav__link[href="/en/about/"]').click();
  await expect(page).toHaveURL(`${origin}/en/about/`);
  await expect(page.locator('h1')).toContainText('About');
  await expect(page.locator('html')).not.toHaveAttribute('aria-busy','true');
});

test('section anchors and deep links reach and focus the intended section',async({page})=>{
  await home(page);
  await page.locator('.site-nav__link[href="/en/events/"]').click();
  await ready(page,'/en/events/');
  await page.locator('.programme-index a[href="#archive"]').click();
  await expect(page).toHaveURL(/#archive$/);
  await expect(page.locator('#archive')).toBeFocused();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-lnc-ready','true');
  await expect(page.locator('#archive')).toBeInViewport();
});

test('every viewport and locale stays inside the viewport with readable real content',async({page})=>{
  for(const width of [360,390,768,1024,1536]) {
    await page.setViewportSize({width,height:900});
    for(const locale of ['','fr/','en/']) {
      await page.goto(`/${locale}`);
      await expect(page.locator('html')).toHaveAttribute('data-lnc-ready','true');
      await page.evaluate(()=>document.fonts.ready);
      const overflow=await overflowReport(page);
      expect(overflow,`horizontal overflow at ${width}px /${locale || 'ja'}: ${JSON.stringify(overflow)}`).toEqual([]);
      await expect(page.locator('h1')).toBeVisible();
    }
  }
});
