import { propUrl } from "./assets.js";

export const NEST_AFTER_MS = 9000;

export function createNest(assets) {
  const el = document.createElement("div");
  el.className = "squirrel-mascot-nest";
  el.dataset.open = "false";
  el.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  img.src = propUrl("nest", assets);
  el.appendChild(img);
  return el;
}

export function placeNest(el, spriteX, spriteY, size) {
  const nw = size * 1.28;
  const nh = size * 0.74;
  el.style.width = `${nw}px`;
  el.style.height = `${nh}px`;
  el.style.left = `${Math.round(spriteX + size / 2 - nw / 2)}px`;
  el.style.top = `${Math.round(spriteY + size * 0.56)}px`;
}

export function setNestOpen(el, open) {
  el.dataset.open = open ? "true" : "false";
}

export function isInactive(lastActivity, now) {
  return (now == null ? performance.now() : now) - lastActivity >= NEST_AFTER_MS;
}
