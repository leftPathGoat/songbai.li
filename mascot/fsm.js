/**
 * Homepage squirrel brain.
 * Lives on the ground. Rare short climbs (1–3 text lines), then back down.
 */

import {
  collectBranches,
  linesAtX,
  overlapsX,
  perchY,
  xToStandOn,
} from "./branches.js";
import { walkSteps, climbHop, stepsToLine, hopInPlace, groundY, canHop, hopLimit } from "./motion.js";

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function nextClimbDelay() {
  return rand(45000, 90000);
}

export function nextEatDelay() {
  return rand(18000, 40000);
}

export function sitHold() {
  return rand(800, 1800);
}

function usable(line, size, gY) {
  const py = perchY(line, size, gY);
  return gY - py > 28;
}

function stackAt(branches, x, size, gY) {
  return linesAtX(branches, x, size)
    .filter((b) => usable(b, size, gY))
    .map((b) => ({ b, py: perchY(b, size, gY) }))
    .sort((a, c) => c.py - a.py);
}

function walkThenClimb(steps, cur, destX, destY, ground) {
  const max = hopLimit(cur.y, destY, ground);
  if (Math.abs(destY - cur.y) > 6 && !canHop(cur.y, destY, max)) return false;
  const add = stepsToLine(cur.x, cur.y, destX, destY, max);
  if (!add.length) return false;
  steps.push(...add);
  cur.x = destX;
  cur.y = destY;
  return true;
}

/**
 * Climb 1–3 overlapping lines, then reverse back to the ground.
 * If this x has no line, walk the ground to a column that does — never climb empty air.
 */
export function planClimb(x, y, size, withNut) {
  const gY = groundY(size);
  const branches = collectBranches().filter((b) => usable(b, size, gY));
  if (!branches.length) return null;

  const steps = [];
  const cur = { x, y };
  let stack = stackAt(branches, cur.x, size, gY);

  if (!stack.length) {
    if (Math.abs(cur.y - gY) > 12) return null;
    const nearby = branches.filter((b) => canHop(gY, perchY(b, size, gY), hopLimit(gY, perchY(b, size, gY), gY)));
    if (!nearby.length) return null;
    const target = pick(nearby);
    const destX = xToStandOn(target, size, cur.x);
    if (!walkThenClimb(steps, cur, destX, gY, gY)) return null;
    stack = stackAt(branches, cur.x, size, gY);
  }
  if (!stack.length) return null;

  const above = stack
    .filter((o) => o.py < cur.y - 16 && canHop(cur.y, o.py, hopLimit(cur.y, o.py, gY)))
    .sort((a, c) => c.py - a.py);
  if (!above.length) return null;

  const trip = [];
  let prevY = cur.y;
  const n = 1 + Math.floor(Math.random() * Math.min(3, above.length));
  for (const item of above) {
    if (trip.length >= n) break;
    if (!canHop(prevY, item.py, hopLimit(prevY, item.py, gY))) break;
    trip.push(item);
    prevY = item.py;
  }
  if (!trip.length) return null;
  let nut = null;

  for (const { b, py } of trip) {
    const destX = overlapsX(b, cur.x, size) ? cur.x : xToStandOn(b, size, cur.x);
    if (!walkThenClimb(steps, cur, destX, py, gY)) return null;
  }

  const top = trip[trip.length - 1];
  if (top && Math.random() < 0.55) {
    const destX = xToStandOn(top.b, size, rand(top.b.x, top.b.x + top.b.width - size * 0.3));
    if (Math.abs(destX - cur.x) > 8) {
      steps.push(...walkSteps(cur.x, destX, cur.y));
      cur.x = destX;
    }
  }

  if (withNut && top) {
    nut = {
      x: Math.min(top.b.x + top.b.width - 22, window.innerWidth - 30),
      y: top.b.top - 18,
    };
    steps.push({
      x: cur.x,
      y: cur.y,
      pose: "eat",
      state: "eat",
      ms: rand(2200, 3400),
      eatNut: true,
    });
  } else {
    steps.push({ x: cur.x, y: cur.y, pose: "sit", state: "sit", ms: rand(500, 1100) });
  }

  for (let i = trip.length - 2; i >= 0; i--) {
    const { b, py } = trip[i];
    const destX = overlapsX(b, cur.x, size) ? cur.x : xToStandOn(b, size, cur.x);
    if (!walkThenClimb(steps, cur, destX, py, gY)) break;
  }

  if (canHop(cur.y, gY, hopLimit(cur.y, gY, gY))) {
    walkThenClimb(steps, cur, cur.x, gY, gY);
  }
  steps.push({ x: cur.x, y: cur.y, pose: "sit", state: "sit", ms: sitHold() });
  return { steps, nut, kind: "climb" };
}

export function planToGround(x, y, size) {
  const gY = groundY(size);
  const steps = [];
  const cur = { x, y };
  if (Math.abs(cur.y - gY) < 10) {
    cur.y = gY;
    return { steps, kind: "ground" };
  }
  const branches = collectBranches();
  const below = stackAt(branches, cur.x, size, gY)
    .filter((o) => o.py > cur.y + 16)
    .sort((a, c) => a.py - c.py);
  for (const { b, py } of below) {
    const destX = overlapsX(b, cur.x, size) ? cur.x : xToStandOn(b, size, cur.x);
    if (!walkThenClimb(steps, cur, destX, py, gY)) break;
  }
  if (Math.abs(cur.y - gY) > 8 && canHop(cur.y, gY, hopLimit(cur.y, gY, gY))) {
    steps.push(...climbHop(cur.x, cur.y, gY, hopLimit(cur.y, gY, gY)));
    cur.y = gY;
  }
  return { steps, kind: "ground" };
}

export function planNest(x, y, size) {
  const gY = groundY(size);
  const plan = planToGround(x, y, size);
  const steps = plan.steps.slice();
  const lastX = steps.length ? steps[steps.length - 1].x : x;
  steps.push({ x: lastX, y: gY, pose: "sleep", state: "sleep", ms: 1e12 });
  return { steps, kind: "nest" };
}

export function planGroundWalk(x, y, size) {
  const gY = groundY(size);
  const destX = rand(16, Math.max(20, window.innerWidth - size - 16));
  const steps = walkSteps(x, destX, gY);
  if (!steps.length) return null;
  steps.push({ x: destX, y: gY, pose: "sit", state: "sit", ms: sitHold() });
  return { steps, kind: "walk" };
}

export function planGroundSnack(x, y) {
  return {
    steps: [{ x, y, pose: "eat", state: "eat", ms: rand(2200, 3800) }],
    kind: "eat",
  };
}

export function planSettle(x, y, size) {
  const gY = groundY(size);
  const steps = [];
  if (Math.abs(y - gY) > 10) {
    steps.push(...hopInPlace(x, gY, 420));
  } else {
    steps.push(...hopInPlace(x, gY, 420));
  }
  steps.push({ x, y: gY, pose: "sit", state: "sit", ms: sitHold() });
  return { steps, kind: "settle" };
}

export function pickFidget(x, y) {
  const roll = Math.random();
  if (roll < 0.38) return { steps: [{ x, y, pose: "blink", state: "blink", ms: 160 }], kind: "fidget" };
  if (roll < 0.72) {
    const pose = Math.random() < 0.5 ? "lookLeft" : "lookRight";
    return { steps: [{ x, y, pose, state: pose, ms: rand(600, 1300) }], kind: "fidget" };
  }
  if (roll < 0.86) return { steps: [{ x, y, pose: "idle", state: "idle", ms: rand(700, 1400) }], kind: "fidget" };
  if (roll < 0.94) return { steps: hopInPlace(x, y, 420).concat([{ x, y, pose: "sit", state: "sit", ms: 700 }]), kind: "fidget" };
  return { steps: [{ x, y, pose: "sit", state: "sit", ms: sitHold() }], kind: "fidget" };
}

export function pickReduced(x, y) {
  return { steps: [{ x, y, pose: "blink", state: "blink", ms: 180 }], kind: "fidget" };
}

export function pickNext(ctx) {
  const { x, y, size, reduced, now, nextClimbAt, nextEatAt, onGround } = ctx;
  if (reduced) return pickReduced(x, y);

  if (now >= nextClimbAt) {
    const withNut = Math.random() < 0.4;
    const climb = planClimb(x, y, size, withNut);
    if (climb) return climb;
  }

  if (now >= nextEatAt && onGround) return planGroundSnack(x, y);

  if (onGround && Math.random() < 0.38) {
    const walk = planGroundWalk(x, y, size);
    if (walk) return walk;
  }

  return pickFidget(x, y);
}
