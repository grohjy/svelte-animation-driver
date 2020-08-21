import { tweened } from "svelte/motion";
import { writable } from "svelte/store";

export function animationDriver(delayStart = 0, delayEnd = 0) {
  let playhead;
  let duration = 100;
  let currentSpeed = 1;
  let cbSubAnimations = [];
  let isPlaying = false;
  let playingDir = "fwd";
  let playingMode = "once";

  let initProps = {
    speed: 1,
    playing: false,
    direction: "fwd",
    mode: "once",
  };
  /*
   * "store" is svelte-store "tweened" responsible of running actual t-value
   *
   * "propsStore" is svelte-store for animation properties
   * Properties:
   * speed : number, greater than 0
   * playing: true|false
   * direction: "fwd" | "rew"
   * mode: "once" | "loop" | "alternate"
   *
   * "playheadStore" is svelte-store for playhead position
   *
   */

  const store = tweened(0);
  const propsStore = writable();
  const playheadStore = writable(0);

  const tryNumber = (nb) => {
    try {
      if (typeof nb !== "number" || isNaN(nb))
        throw new SyntaxError("Value must be a number");
    } catch (error) {
      console.error(error);
    }
  };

  const getSubAnimationT = (delay, dur) => {
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

  const updatePlayhead = (tvalue) => {
    playhead = tvalue;
    if (isPlaying) {
      if (playingMode == "once") {
        if (playhead >= 1) {
          propsStore.set({ playing: false });
        }
        if (playhead <= 0) {
          propsStore.set({ playing: false });
        }
      } else if (playingMode == "loop") {
        if (playhead >= 1) {
          playheadStore.set(0.0001);
        }
        if (playhead <= 0) {
          playheadStore.set(0.9999);
        }
      } else if (playingMode == "alternate") {
        if (playhead >= 1) {
          propsStore.set({ direction: "rew" });
        }
        if (playhead <= 0) {
          propsStore.set({ direction: "fwd" });
        }
      }
    }
    playheadStore.update((oldValue) => {
      return playhead;
    });
    cbSubAnimations.forEach((subanim) => {
      subanim();
    });
  };

  const runUpdatedAnimation = () => {
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

  store.subscribe((tValue) => {
    updatePlayhead(tValue);
  });

  propsStore.subscribe((value) => {
    runUpdatedAnimation();
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
    if ("mode" in value && typeof value.mode === "string")
      playingMode = value.mode;
    else delete value.mode;
    propsStore.update((oldValue) => {
      return { ...oldValue, ...value };
    });
  };

  playheadStore.set = (value) => {
    tryNumber(value);
    if (value > 1) value = 1;
    if (value < 0) value = 0;
    if (playhead == value) {
      store.set(value + 0.0001, { duration: 0 });
    }
    store.set(value, { duration: 0 });
    propsStore.set({});
  };

  function addAnimation(delay, dur, fn) {
    let animdur = delay + dur;
    duration = duration < animdur ? animdur : duration;
    propsStore.set({ speed: currentSpeed });
    let tAnim, tAnimOrig;
    const cbUpdate = () => {
      let t = getSubAnimationT(delay, dur);
      tAnim = t;
      tAnimOrig = t;
      fn(t);
    };
    cbSubAnimations.push(cbUpdate);

    /*
     * Helper functions for manipulating sub-animation's t-value
     * "slice(startPos, endPos)" gives a new t-value (0->1) when original t-value is between "pos"es
     * "repeat(nb)" gives a new t-value nb times during original t-value
     * "steps(nb, [activate] )" changes original t-value to stepped value, optional "activate" defines will step
     * take place at "start", "middle" or "end" of value stream
     * "cycle" gives a new t-value 0->1->0 when original t-value runs 0->1
     * "valueOf" gives actual modified t-value and is needed in the end of every function chain.
     *
     */
    this.slice = function (startPos, endPos) {
      let tModified = 0;
      if (endPos < startPos) {
        let temp = endPos;
        endPos = startPos;
        startPos = temp;
      }
      if (tAnim < startPos) tModified = 0;
      else if (tAnim > endPos) tModified = 1;
      else {
        tModified = (tAnim - startPos) / (endPos - startPos);
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
    this.valueOf = function () {
      let t = tAnimOrig;
      if (tAnim !== tAnimOrig) t = tAnim;
      tAnim = tAnimOrig;
      return t;
    };
  }

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

  propsStore.set(initProps);
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

/*
 * Helper functions
 * "mapRange(t, startRange = 0, endRange = 1)" converts t-value 0->1 to different range (for ex. 1->10 or -5 -> 5 or even 5 -> -5)
 * "u(t)" reverses t 0->1 to 1->0
 */

export const mapRange = (t, startRange = 0, endRange = 1) => {
  if (startRange !== endRange) t = startRange + t * (endRange - startRange);
  return t;
};
export const u = (t) => 1 - t;
