import test from 'node:test';
import assert from 'node:assert/strict';
import { rectToClip, fullClip, isHistoryTrigger, resolveScroll, normalisedPath } from '../src/lib/motion/rules.mjs';

test('the transition starts at the exact clicked card rectangle', () => {
  assert.equal(rectToClip({left:24,top:320,width:740,height:360},{width:1536,height:1024}), 'inset(320px 772px 344px 24px round 6px)');
  assert.equal(fullClip,'inset(0px 0px 0px 0px round 0px)');
});
test('partly offscreen cards produce valid viewport-clamped clip geometry', () => {
  assert.equal(rectToClip({left:-20,top:-150,width:500,height:400},{width:390,height:844}), 'inset(0px 0px 594px 0px round 6px)');
});
test('invisible and degenerate cards use the non-spatial transition', () => {
  for (const rect of [{left:0,top:1200,width:100,height:100},{left:0,top:0,width:0,height:10},{left:NaN,top:0,width:10,height:10}]) {
    assert.equal(rectToClip(rect,{width:390,height:844}),null);
  }
});
test('back and forward restore bounded positions, fresh visits start at zero', () => {
  assert.equal(isHistoryTrigger('back'),true);
  assert.equal(isHistoryTrigger('forward'),true);
  assert.equal(isHistoryTrigger('barba'),false);
  assert.deepEqual(resolveScroll(true,{x:0,y:400},700),{x:0,y:400});
  assert.deepEqual(resolveScroll(true,{x:0,y:1200},700),{x:0,y:700});
  assert.deepEqual(resolveScroll(true,{x:-4,y:NaN},700),{x:0,y:0});
  assert.deepEqual(resolveScroll(false,{x:0,y:400},700),{x:0,y:0});
});
test('normalised paths ignore hashes and query strings only for routing comparisons', () => {
  assert.equal(normalisedPath('https://lnc-ch.github.io/en/events/?x=1#archive'),'/en/events/');
  assert.equal(normalisedPath('/en/events'),'/en/events/');
});

test('request recovery never turns a failed speculative hover into navigation', async () => {
  const {shouldRecoverRequest} = await import('../src/lib/motion/rules.mjs');
  assert.equal(shouldRecoverRequest('enter','https://site/en/about/',null),false);
  assert.equal(shouldRecoverRequest('prefetch','https://site/en/about/','https://site/en/events/'),false);
  assert.equal(shouldRecoverRequest('click','https://site/en/about/',null),true);
  assert.equal(shouldRecoverRequest('enter','https://site/en/about/','https://site/en/about/'),true);
});
