import { tweened } from "svelte/motion";
import { writable } from "svelte/store";

export function animationDriver(delayStart = 0, delayEnd = 0) {
  const store = tweened(0);

  let playhead;
  let duration = 100;
  let currentSpeed = 1;
  let cbSubAnimations = [];
  let isPlaying = false;
  let playingDir = "fwd";

  const propsStore = writable();
  const playheadStore = writable(0);

  let originalPlayheadStoreSet = playheadStore.set;
  playheadStore.set = (value) => {
    tryNumber(value);
    if (value > 1) value = 1;
    if (value < 0) value = 0;
    if (playhead == value) {
      store.set(value + 0.0001, { duration: 0 });
      store.set(value, { duration: 0 });
    }
    store.set(value, { duration: 0 });
    if (isPlaying) run();
  };

  const tryNumber = (nb) => {
    try {
      if (typeof nb !== "number" || isNaN(nb))
        throw new SyntaxError("Value must be a number");
    } catch (error) {
      console.error(error);
    }
  };

  const run = () => {
    if (isPlaying) {
      if (playingDir == "fwd" && playhead < 1) {
        store.set(1, {
          duration:
            ((duration + delayStart + delayEnd) / currentSpeed) *
            (1 - playhead),
        });
      } else if (playingDir == "rew" && playhead > 0) {
        store.set(0, {
          duration:
            ((duration + delayStart + delayEnd) / currentSpeed) * playhead,
        });
      }
    }
  };

  propsStore.subscribe((value) => {
    run();
  });
  propsStore.set = (value) => {
    if (typeof value !== "object") value = {};
    if ("speed" in value && typeof value.speed === "number" && value.speed > 0)
      currentSpeed = value.speed;
    else delete value.speed;
    if ("playing" in value && typeof value.playing === "boolean")
      isPlaying = value.playing;
    else delete value.playing;
    if ("direction" in value && typeof value.direction === "string")
      playingDir = value.direction;
    else delete value.direction;
    propsStore.update((oldValue) => {
      return { ...oldValue, ...value };
    });
  };

  const updateStatus = (tvalue) => {
    playhead = tvalue;
    if (playhead >= 1) {
      propsStore.set({ playing: false });
    }
    if (playhead <= 0) {
      propsStore.set({ playing: false });
    }
    originalPlayheadStoreSet(playhead);
    cbSubAnimations.forEach((subanim) => {
      subanim();
    });
  };

  store.subscribe((v) => {
    updateStatus(v);
  });

  function addAnimation(delay, dur, fn) {
    let animdur = delay + dur;
    duration = duration < animdur ? animdur : duration;
    propsStore.set({ speed: currentSpeed });
    let tAnim, tAnimOrig;
    const cbUpdate = () => {
      let t = getAnimationT(delay, dur);
      tAnim = t;
      tAnimOrig = t;
      fn(t, 1 - t);
    };
    cbSubAnimations.push(cbUpdate);

    this.slice = function (startFrame, endFrame) {
      let tModified = 0;
      if (endFrame < startFrame) {
        let temp = endFrame;
        endFrame = startFrame;
        startFrame = temp;
      }
      if (tAnim < startFrame) tModified = 0;
      else if (tAnim > endFrame) tModified = 1;
      else {
        tModified = (tAnim - startFrame) / (endFrame - startFrame);
      }
      tAnim = tModified;
      return this;
    };
    this.repeat = function (repeat) {
      if (repeat < 1) repeat = 1;
      let tModified = 0;
      tModified = (tAnim % (1 / repeat)) * repeat;
      if (tModified == 0 && tAnim !== 0) tModified = 1;
      tAnim = tModified;
      return this;
    };
    this.steps = function (steps, activate = "end") {
      if (steps < 1) steps = 1;
      let tModified = 0;
      if (activate == "start")
        tModified = Math.floor(tAnim * steps + 0.9999) / steps;
      else if (activate == "middle")
        tModified = Math.round(tAnim * steps) / steps;
      else if (activate == "end") tModified = Math.floor(tAnim * steps) / steps;
      tAnim = tModified;
      return this;
    };
    this.cycle = function () {
      let tModified = 0;
      if (tAnim <= 0.5) tModified = tAnim * 2;
      else tModified = (1 - tAnim) * 2;
      tAnim = tModified;
      return this;
    };
    this.valueOf = function (startRange = 0, endRange = 1) {
      let t = tAnimOrig;
      if (tAnim !== tAnimOrig) t = tAnim;
      tAnim = tAnimOrig;
      if (startRange !== endRange) t = startRange + t * (endRange - startRange);
      return t;
    };
  }

  const getAnimationT = (delay, dur) => {
    let t;
    delay = (delay + delayStart) / currentSpeed;
    dur = dur / currentSpeed;
    let driverDur = (duration + delayStart + delayEnd) / currentSpeed;
    if (delay > 0) {
      t =
        (((playhead - delay / driverDur) / ((driverDur - delay) / driverDur)) *
          (driverDur - delay)) /
        dur;
    } else {
      t = (playhead * driverDur) / dur;
    }
    if (t <= 0) t = 0;
    if (t > 1) t = 1;

    return t;
  };

  const pause = () => {
    propsStore.set({
      playing: false,
    });
    playheadStore.set(playhead);
  };

  const play = () => {
    propsStore.set({
      playing: playhead < 1 ? true : false,
      direction: "fwd",
    });
  };

  const rewind = () => {
    propsStore.set({
      playing: playhead > 0 ? true : false,
      direction: "rew",
    });
  };

  const reset = () => {
    propsStore.set({
      playing: false,
      direction: "fwd",
    });
    playheadStore.set(0);
  };

  const start = () => {
    propsStore.set({ playing: true });
  };

  return {
    propsStore,
    playheadStore,
    addAnimation,
    pause,
    start,
    play,
    rewind,
    reset,
  };
}

// Copy from https://github.com/AndrewRayCode/easing-utils
import {
  linear,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
} from "./easing.js";
export {
  linear,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
};
