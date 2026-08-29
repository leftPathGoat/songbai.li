/**
 * Hover = pet + open glove. Drag = grab glove + held.
 * Overlay stays pointer-events:none except the squirrel.
 * Never clicks page widgets.
 */

export function bindInput(opts) {
  const { actor, canDrag, onPet, onUnpet, onDragStart, onDrag, onDragEnd, onActivity } = opts;
  const offs = [];
  const on = (target, type, fn, extra) => {
    target.addEventListener(type, fn, extra);
    offs.push(() => target.removeEventListener(type, fn, extra));
  };

  let dragging = false;
  let pointerId = null;
  let ox = 0;
  let oy = 0;
  let moved = false;

  on(actor, "pointerenter", () => onPet());
  on(actor, "pointerleave", () => {
    if (!dragging) onUnpet();
  });

  on(actor, "pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onActivity(true);
    if (!canDrag()) return;
    dragging = true;
    moved = false;
    pointerId = e.pointerId;
    const r = actor.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    onDragStart();
    try {
      actor.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  on(window, "pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    onDrag(e.clientX - ox, e.clientY - oy);
    moved = true;
  });

  const end = (e) => {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    if (!dragging) return;
    dragging = false;
    pointerId = null;
    onDragEnd(moved);
  };
  on(window, "pointerup", end);
  on(window, "pointercancel", end);

  const activity = () => onActivity(false);
  on(window, "pointerdown", activity);
  on(window, "pointermove", activity);
  on(window, "keydown", activity);
  on(window, "scroll", activity, { passive: true, capture: true });
  on(window, "wheel", activity, { passive: true });

  return () => {
    for (const off of offs) off();
  };
}
