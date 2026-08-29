/** Each visual text line in main is a branch. Viewport coords. */

const HOSTS = "p, li, h1, h2, .label, .alias";
const MIN_W = 28;
const MIN_H = 8;

function visibleHost(el) {
  const s = getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") return false;
  if (Number(s.opacity) === 0) return false;
  return true;
}

function mergeLine(raw) {
  raw.sort((a, b) => a.top - b.top || a.left - b.left);
  const out = [];
  for (const r of raw) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.top - r.top) < 5 && r.left <= last.right + 16) {
      last.left = Math.min(last.left, r.left);
      last.right = Math.max(last.right, r.right);
      last.bottom = Math.max(last.bottom, r.bottom);
    } else {
      out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }
  return out;
}

/** @returns {{x:number,y:number,width:number,top:number,bottom:number,midY:number}[]} */
export function collectBranches(root) {
  const main = root || document.querySelector("main");
  if (!main) return [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const raw = [];

  for (const host of main.querySelectorAll(HOSTS)) {
    if (!visibleHost(host)) continue;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      for (const r of rects) {
        if (r.width < MIN_W || r.height < MIN_H) continue;
        if (r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) continue;
        raw.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }
  }

  return mergeLine(raw).map((r) => {
    const width = r.right - r.left;
    return {
      x: r.left,
      y: r.top,
      width,
      top: r.top,
      bottom: r.bottom,
      midY: (r.top + r.bottom) / 2,
    };
  });
}

export function overlapsX(line, spriteX, size, pad = 10) {
  const cx = spriteX + size * 0.5;
  return cx >= line.x - pad && cx <= line.x + line.width + pad;
}

export function linesAtX(branches, spriteX, size, pad = 10) {
  return branches.filter((b) => overlapsX(b, spriteX, size, pad));
}

/** Sprite top so feet rest on the line. */
export function perchY(line, size, groundY) {
  const y = line.top - size + 10;
  return Math.max(8, Math.min(y, groundY));
}

/** Sprite left so its center sits on the line. */
export function xToStandOn(line, size, preferX) {
  const edge = 8;
  const min = line.x - size * 0.35;
  const max = line.x + line.width - size * 0.65;
  const lo = Math.max(edge, Math.min(min, max));
  const hi = Math.min(window.innerWidth - size - edge, Math.max(min, max));
  const x = preferX == null ? (lo + hi) / 2 : preferX;
  return Math.max(lo, Math.min(hi, x));
}
