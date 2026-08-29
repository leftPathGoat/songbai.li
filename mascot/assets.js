/** Pose / prop URL map. Paths resolve from this module so they work on the homepage. */

const art = (file) => new URL(`./art/${file}`, import.meta.url).href;

export const POSES = {
  sit: art("sit.png"),
  idle: art("idle.png"),
  blink: art("blink.png"),
  lookLeft: art("look-left.png"),
  lookRight: art("look-right.png"),
  walkLeft: art("walk-left.png"),
  walkRight: art("walk-right.png"),
  hop: art("hop.png"),
  climbUp: art("climb-up.png"),
  climbDown: art("climb-down.png"),
  eat: art("eat.png"),
  pet: art("pet.png"),
  held: art("held.png"),
  sleep: art("sleep-in-nest.png"),
  nest: art("nest.png"),
  point: art("point.png"),
  inspect: art("inspect.png"),
  excited: art("excited.png"),
};

export const PROPS = {
  nest: art("nest.png"),
  pineNut: art("pine-nut.png"),
  gloveOpen: art("glove-open.png"),
  gloveGrab: art("glove-grab.png"),
};

export function poseUrl(name, assets) {
  const extra = (assets && assets.poses) || {};
  return extra[name] || POSES[name] || POSES.sit;
}

export function propUrl(key, assets) {
  if (assets && assets[key]) return assets[key];
  if (assets && assets.poses && assets.poses[key]) return assets.poses[key];
  return PROPS[key];
}

export function preload(assets) {
  const urls = [
    ...Object.values(POSES),
    ...Object.values(PROPS),
    ...Object.values((assets && assets.poses) || {}),
  ];
  for (const src of urls) {
    if (typeof src === "string") {
      const img = new Image();
      img.src = src;
    }
  }
}
