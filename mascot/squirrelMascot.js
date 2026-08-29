/**
 * Tiny homepage API:
 *   mountSquirrelMascot(opts) -> { setEnabled, destroy }
 * Lives on the ground. Climbs only onto collected text-line branches.
 */

import { poseUrl, propUrl, preload } from "./assets.js";
import { collectBranches } from "./branches.js";
import { clampPos, groundY } from "./motion.js";
import { createNest, placeNest, setNestOpen, isInactive } from "./nest.js";
import { bindInput } from "./input.js";
import {
  pickNext,
  planNest,
  planSettle,
  nextClimbDelay,
  nextEatDelay,
  sitHold,
} from "./fsm.js";

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createNut(assets) {
  const el = document.createElement("div");
  el.className = "squirrel-mascot-nut";
  el.dataset.open = "false";
  el.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  img.src = propUrl("pineNut", assets);
  el.appendChild(img);
  return el;
}

export function mountSquirrelMascot(raw) {
  const opts = raw || {};
  const size = opts.size == null ? 96 : opts.size;
  const parent = opts.root || document.body;
  const assets = opts.assets;
  let enabled = opts.enabled !== false;
  let reducedOverride = opts.reducedMotionOverride;
  const dragEnabled = opts.dragEnabled !== false;

  const root = document.createElement("div");
  root.className = "squirrel-mascot-root";
  root.setAttribute("data-squirrel-mascot", "");
  root.dataset.enabled = enabled ? "true" : "false";
  root.style.setProperty("--sm-size", `${size}px`);
  root.style.setProperty("--sm-glove-open", `url("${propUrl("gloveOpen", assets)}")`);
  root.style.setProperty("--sm-glove-grab", `url("${propUrl("gloveGrab", assets)}")`);

  const nest = createNest(assets);
  const nut = createNut(assets);

  const actor = document.createElement("div");
  actor.className = "squirrel-mascot-actor";
  actor.setAttribute("role", "img");
  actor.setAttribute("aria-label", "Site companion");
  actor.tabIndex = 0;

  const stage = document.createElement("div");
  stage.className = "squirrel-mascot-stage";
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  stage.appendChild(img);
  actor.appendChild(stage);

  root.appendChild(nest);
  root.appendChild(nut);
  root.appendChild(actor);
  parent.appendChild(root);

  const dock = () => {
    const g = groundY(size);
    return { x: window.innerWidth - size - 24, y: g };
  };

  let x = dock().x;
  let y = dock().y;
  let pose = "sit";
  let state = "sit";
  let queue = [];
  let stepUntil = 0;
  let lastActivity = performance.now();
  let nextClimbAt = lastActivity + nextClimbDelay();
  let nextEatAt = lastActivity + nextEatDelay();
  let hovering = false;
  let dragging = false;
  let nestOpen = false;
  let nutOpen = false;
  let kind = null;
  let raf = 0;
  let lastTick = 0;
  let destroyed = false;
  let branches = [];
  let branchDirty = true;
  let branchRaf = 0;

  const reduced = () =>
    reducedOverride === true || (reducedOverride !== false && prefersReduced());

  function paint(next) {
    if (next === pose && img.src) {
      actor.dataset.pose = next;
      return;
    }
    pose = next;
    actor.dataset.pose = next;
    img.src = poseUrl(next, assets);
  }

  function place() {
    actor.style.left = `${Math.round(x)}px`;
    actor.style.top = `${Math.round(y)}px`;
    placeNest(nest, x, y, size);
    nut.style.left = `${Math.round(nut._x || 0)}px`;
    nut.style.top = `${Math.round(nut._y || 0)}px`;
  }

  function showNutAt(nx, ny) {
    nut._x = nx;
    nut._y = ny;
    nut.dataset.eaten = "false";
    nut.dataset.open = "true";
    nutOpen = true;
    nut.style.left = `${Math.round(nx)}px`;
    nut.style.top = `${Math.round(ny)}px`;
  }

  function hideNut(eaten) {
    nutOpen = false;
    nut.dataset.open = "false";
    nut.dataset.eaten = eaten ? "true" : "false";
  }

  function openNest(open) {
    nestOpen = open;
    setNestOpen(nest, open);
    placeNest(nest, x, y, size);
  }

  function setCursor(mode) {
    if (mode) {
      root.dataset.cursor = mode;
      actor.dataset.cursor = mode;
    } else {
      delete root.dataset.cursor;
      delete actor.dataset.cursor;
    }
    document.documentElement.classList.toggle("squirrel-mascot-grabbing", mode === "grab");
  }

  function refreshBranches() {
    if (!branchDirty) return branches;
    branches = collectBranches();
    branchDirty = false;
    return branches;
  }

  function markBranches() {
    branchDirty = true;
    if (branchRaf) return;
    branchRaf = requestAnimationFrame(() => {
      branchRaf = 0;
      refreshBranches();
    });
  }

  function clearMotion() {
    queue = [];
    kind = null;
    hideNut(false);
  }

  function startPlan(plan) {
    if (!plan || !plan.steps || !plan.steps.length) return false;
    queue = plan.steps.slice();
    kind = plan.kind || null;
    if (plan.nut) showNutAt(plan.nut.x, plan.nut.y);
    runStep(performance.now());
    return true;
  }

  function runStep(now) {
    const s = queue.shift();
    if (!s) {
      kind = null;
      state = "sit";
      paint("sit");
      stepUntil = now + sitHold();
      return;
    }
    const pos = clampPos(s.x, s.y, size);
    x = pos.x;
    y = pos.y;
    state = s.state || s.pose;
    paint(s.pose);
    stepUntil = now + (s.ms == null ? 160 : s.ms);
    if (s.showNest) openNest(true);
    if (s.hideNest) openNest(false);
    if (s.eatNut) hideNut(true);
    place();
  }

  function goSleep() {
    if (state === "sleep" || dragging || hovering) return;
    clearMotion();
    startPlan(planNest(x, y, size));
  }

  function wake(fromSquirrel) {
    openNest(false);
    lastActivity = performance.now();
    if (fromSquirrel && hovering) {
      clearMotion();
      state = "pet";
      paint("pet");
      setCursor("pet");
      stepUntil = 1e15;
      return;
    }
    clearMotion();
    if (reduced()) {
      y = groundY(size);
      state = "sit";
      paint("sit");
      stepUntil = lastActivity + 800;
      place();
      return;
    }
    startPlan(planSettle(x, y, size));
  }

  function noteActivity(fromSquirrel) {
    lastActivity = performance.now();
    if (state === "sleep" || nestOpen) wake(fromSquirrel);
  }

  function pickIdle(now) {
    const onGround = Math.abs(y - groundY(size)) < 12;
    const plan = pickNext({
      x,
      y,
      size,
      reduced: reduced(),
      now,
      nextClimbAt,
      nextEatAt,
      onGround,
      branches: refreshBranches(),
    });
    if (plan.kind === "climb") nextClimbAt = now + nextClimbDelay();
    else if (now >= nextClimbAt) nextClimbAt = now + 12000;
    if (plan.kind === "eat") nextEatAt = now + nextEatDelay();
    startPlan(plan);
  }

  function tick(t) {
    raf = 0;
    if (destroyed || !enabled || document.hidden) return;
    lastTick = t;
    root.dataset.reduced = reduced() ? "true" : "false";

    if (hovering) lastActivity = t;
    if (dragging) {
      place();
      raf = requestAnimationFrame(tick);
      return;
    }
    if (state === "pet") {
      place();
      raf = requestAnimationFrame(tick);
      return;
    }
    if (state === "sleep") {
      place();
      raf = requestAnimationFrame(tick);
      return;
    }

    if (!nestOpen && isInactive(lastActivity, t)) {
      goSleep();
    }

    if (queue.length || t < stepUntil) {
      if (t >= stepUntil) runStep(t);
      else place();
      raf = requestAnimationFrame(tick);
      return;
    }

    pickIdle(t);
    raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (raf || destroyed || !enabled) return;
    lastTick = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  paint("sit");
  place();
  root.dataset.reduced = reduced() ? "true" : "false";
  preload(assets);

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMq = () => {
    root.dataset.reduced = reduced() ? "true" : "false";
    if (reduced()) {
      clearMotion();
      y = groundY(size);
      state = "sit";
      paint("sit");
      place();
    }
  };
  if (mq.addEventListener) mq.addEventListener("change", onMq);
  else mq.addListener(onMq);

  const unbind = bindInput({
    actor,
    canDrag: () => enabled && dragEnabled && !reduced(),
    onPet: () => {
      hovering = true;
      noteActivity(true);
      if (!enabled || dragging) return;
      clearMotion();
      state = "pet";
      paint("pet");
      setCursor("pet");
      stepUntil = 1e15;
    },
    onUnpet: () => {
      hovering = false;
      if (dragging) return;
      if (state === "pet") {
        setCursor("");
        state = "sit";
        paint("sit");
        stepUntil = performance.now() + 700;
      }
    },
    onDragStart: () => {
      dragging = true;
      clearMotion();
      openNest(false);
      actor.dataset.dragging = "true";
      state = "held";
      paint("held");
      setCursor("grab");
      stepUntil = 1e15;
    },
    onDrag: (nx, ny) => {
      const pos = clampPos(nx, ny, size);
      x = pos.x;
      y = pos.y;
      if (state !== "held") {
        state = "held";
        paint("held");
      }
      place();
    },
    onDragEnd: (moved) => {
      dragging = false;
      actor.dataset.dragging = "false";
      lastActivity = performance.now();
      if (moved) {
        startPlan(planSettle(x, y, size));
        setCursor(hovering ? "pet" : "");
        return;
      }
      if (hovering) {
        state = "pet";
        paint("pet");
        setCursor("pet");
        stepUntil = 1e15;
      } else {
        setCursor("");
        y = groundY(size);
        state = "sit";
        paint("sit");
        stepUntil = performance.now() + 800;
        place();
      }
    },
    onActivity: (fromSquirrel) => noteActivity(fromSquirrel),
  });

  function onResize() {
    markBranches();
    const pos = clampPos(x, y, size);
    x = pos.x;
    if (!dragging) {
      y = groundY(size);
      if (state !== "pet" && state !== "held" && state !== "sleep") {
        clearMotion();
        state = "sit";
        paint("sit");
      }
    }
    place();
  }

  function onScroll() {
    markBranches();
    noteActivity(false);
    if (kind === "climb") {
      clearMotion();
      y = groundY(size);
      state = "sit";
      paint("sit");
      place();
    }
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  const onVis = () => {
    if (document.hidden) stopLoop();
    else startLoop();
  };
  document.addEventListener("visibilitychange", onVis);

  if (enabled) startLoop();

  return {
    setEnabled(on) {
      enabled = !!on;
      root.dataset.enabled = enabled ? "true" : "false";
      if (enabled) {
        y = groundY(size);
        const pos = clampPos(x, y, size);
        x = pos.x;
        y = pos.y;
        lastActivity = performance.now();
        nextClimbAt = lastActivity + nextClimbDelay();
        state = "sit";
        paint("sit");
        place();
        startLoop();
      } else {
        clearMotion();
        openNest(false);
        hideNut(false);
        setCursor("");
        stopLoop();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      setCursor("");
      unbind();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      if (mq.removeEventListener) mq.removeEventListener("change", onMq);
      else mq.removeListener(onMq);
      if (branchRaf) cancelAnimationFrame(branchRaf);
      root.remove();
    },
  };
}
