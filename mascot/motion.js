/**
 * Discrete axis-aligned steps only.
 * Walk: same y, change x. Climb: same x, change y.
 * Never lerp, never move diagonally, never slide through empty space.
 */

export const STEP_MS_MIN = 120;
export const STEP_MS_MAX = 220;
export const WALK_PX = 32;
export const EDGE = 8;
export const GROUND_PAD = 16;
/** Max hop between two text lines. */
export const MAX_HOP = 72;
/** Ground may hop once onto the nearest line at this x. */
export const MAX_GROUND_HOP = 220;

export function groundY(size) {
  return window.innerHeight - size - GROUND_PAD;
}

export function clampPos(x, y, size) {
  const g = groundY(size);
  return {
    x: Math.max(EDGE, Math.min(x, window.innerWidth - size - EDGE)),
    y: Math.max(EDGE, Math.min(y, g)),
  };
}

export function stepMs() {
  return STEP_MS_MIN + Math.random() * (STEP_MS_MAX - STEP_MS_MIN);
}

export function clingMs() {
  return 70 + Math.random() * 110;
}

function step(x, y, pose, state, ms, extra) {
  return Object.assign({ x, y, pose, state, ms: ms == null ? stepMs() : ms }, extra || {});
}

/** Horizontal hops along a fixed y. */
export function walkSteps(fromX, toX, y) {
  const steps = [];
  let x = fromX;
  const dir = toX < fromX ? -1 : 1;
  const pose = dir < 0 ? "walkLeft" : "walkRight";
  if (Math.abs(toX - fromX) < 3) return steps;
  while (Math.abs(toX - x) > 3) {
    const next = dir < 0 ? Math.max(toX, x - WALK_PX) : Math.min(toX, x + WALK_PX);
    steps.push(step(next, y, pose, pose));
    steps.push(step(next, y, "sit", "sit", clingMs()));
    x = next;
  }
  return steps;
}

export function canHop(fromY, toY, max = MAX_HOP) {
  return Math.abs(toY - fromY) <= max + 1;
}

export function hopLimit(fromY, toY, ground) {
  const fromGround = Math.abs(fromY - ground) < 14;
  const toGround = Math.abs(toY - ground) < 14;
  return fromGround || toGround ? MAX_GROUND_HOP : MAX_HOP;
}

/** One vertical hop. Same x. Rejects empty-air leaps. */
export function climbHop(x, fromY, toY, max = MAX_HOP) {
  if (!canHop(fromY, toY, max)) return [];
  const up = toY < fromY;
  const pose = up ? "climbUp" : "climbDown";
  return [
    step(x, toY, pose, pose),
    step(x, toY, "sit", "cling", clingMs()),
  ];
}

/**
 * Reach a line without diagonals.
 * Walk first (same y), then one short vertical hop (same x).
 * Never hops farther than MAX_HOP — that is sliding through air.
 */
export function stepsToLine(fromX, fromY, destX, destY, maxHop) {
  const steps = [];
  let x = fromX;
  let y = fromY;
  if (Math.abs(destX - x) > 3) {
    steps.push(...walkSteps(x, destX, y));
    x = destX;
  }
  if (Math.abs(destY - y) > 6) {
    const hop = climbHop(x, y, destY, maxHop == null ? MAX_HOP : maxHop);
    if (!hop.length) return steps;
    steps.push(...hop);
  }
  return steps;
}

export function hopInPlace(x, y, ms) {
  return [step(x, y, "hop", "hop", ms == null ? 420 : ms)];
}
