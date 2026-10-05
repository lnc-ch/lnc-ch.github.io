/** Pure geometry/history rules; browser integration lives in scripts/. */
export const fullClip = 'inset(0px 0px 0px 0px round 0px)';
export const isHistoryTrigger = (trigger) => trigger === 'back' || trigger === 'forward';
const clamp = (value, min, max) => Math.max(min,Math.min(max,value));
export function rectToClip(rect, viewport, radius = 6) {
  if (![rect.left,rect.top,rect.width,rect.height,viewport.width,viewport.height].every(Number.isFinite)
      || rect.width <= 0 || rect.height <= 0 || viewport.width <= 0 || viewport.height <= 0) return null;
  const top=clamp(rect.top,0,viewport.height), left=clamp(rect.left,0,viewport.width);
  const bottom=clamp(rect.top+rect.height,0,viewport.height), right=clamp(rect.left+rect.width,0,viewport.width);
  if (bottom<=top || right<=left) return null;
  const values=[top,viewport.width-right,viewport.height-bottom,left].map(value=>Math.round(value*100)/100);
  return `inset(${values.map(value=>`${value}px`).join(' ')} round ${radius}px)`;
}
export function resolveScroll(restore, saved, maxY) {
  return {x:0,y:restore && Number.isFinite(saved?.y) ? clamp(saved.y,0,Math.max(0,maxY)) : 0};
}
export function normalisedPath(url) {
  const path=new URL(url,'https://lnc.invalid').pathname;
  return path.endsWith('/') ? path : `${path}/`;
}
export const shouldRecoverRequest = (action,url,activeTarget) => action==='click' || (Boolean(activeTarget) && url===activeTarget);
