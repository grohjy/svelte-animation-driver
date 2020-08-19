import { tweened } from "svelte/motion";
import { writable } from "svelte/store";

export function animationDriver() {
  const store = tweened(0);

  let playhead;
  let duration = 100;
  let speedAdjDuration = duration;
  let currentSpeed = 1;
  let cbSubAnimations = [];
  let isPlaying = false;
  let playingDir = "fwd";

  const propsStore = writable({
    totalDuration: duration,
    speed: currentSpeed,
    playing: isPlaying,
    direction: playingDir,
  });

  const tryNumber = (nb) => {
    try {
      if (typeof nb !== "number" || isNaN(nb))
        throw new SyntaxError("Value must be a number");
    } catch (error) {
      console.error(error);
    }
  };
  const tryGtZero = (nb) => {
    try {
      if (nb <= 0) throw new SyntaxError("Value must be greater than 0");
    } catch (error) {
      console.error(error);
    }
  };

  const setSpeed = (speed) => {
    tryNumber(speed);
    tryGtZero(speed);
    currentSpeed = speed;
    speedAdjDuration = duration / currentSpeed;
  };

  const run = () => {
    if (isPlaying) {
      if (playingDir == "fwd" && playhead < 1) {
        store.set(1, { duration: speedAdjDuration * (1 - playhead) });
      } else if (playingDir == "rew" && playhead > 0) {
        store.set(0, { duration: speedAdjDuration * playhead });
      }
    }
  };

  propsStore.subscribe((value) => {
    run();
  });
  propsStore.set = (value) => {
    if (typeof value !== "object") value = {};
    if ("speed" in value && typeof value.speed === "number")
      setSpeed(value.speed);
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
    cbSubAnimations.forEach((subanim) => {
      // let { t, u } = getAnimationT(subanim.delay, subanim.dur);
      // subanim.fn(t, u);
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
    let tAnim;
    const upd = () => {
      let t = getAnimationT(delay, dur);
      tAnim = t;
      fn(t, 1 - t);
    };
    cbSubAnimations.push(upd);
    // cbSubAnimations.push({ delay: delay, dur: dur, fn: fn });

    this.keyframes = function (startFrame, endFrame) {
      if (startFrame > 1) {
        startFrame = startFrame / 100;
        endFrame = endFrame / 100;
      }
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
      tAnim = tModified;
      return this;
    };
    this.steps = function (steps) {
      if (steps < 1) steps = 1;
      let tModified = 0;
      tModified = Math.round(tAnim * steps) / steps;
      tAnim = tModified;
      return this;
    };
    this.cycle = function () {
      let tModified = 0;
      if (tAnim <= 0.5) tModified = tAnim;
      else tModified = 1 - tAnim;
      tAnim = tModified;
      return this;
    };
    this.valueOf = function () {
      return tAnim;
    };
  }

  const addAnimation2 = (delay, dur, fn) => {
    let animdur = delay + dur;
    duration = duration < animdur ? animdur : duration;
    propsStore.set({ speed: currentSpeed });
    cbSubAnimations.push({ delay: delay, dur: dur, fn: fn });
  };

  const getAnimationT = (delay, dur) => {
    let t;
    delay = delay / currentSpeed;
    dur = dur / currentSpeed;
    let driverDur = speedAdjDuration;
    if (delay > 0)
      t =
        (((playhead - delay / driverDur) / ((driverDur - delay) / driverDur)) *
          (driverDur - delay)) /
        dur;
    else t = (playhead * driverDur) / dur;
    if (t <= 0) t = 0;
    if (t > 1) t = 1;
    return t;
  };

  const setPlayhead = (value) => {
    tryNumber(value);
    if (value > 1) value = 1;
    if (value < 0) value = 0;
    if (playhead == value) {
      store.set(value + 0.0001, { duration: 0 });
    }
    store.set(value, { duration: 0 });
    if (isPlaying) run();
  };

  const getPlayhead = () => {
    return playhead;
  };

  const pause = () => {
    propsStore.set({
      playing: false,
    });
    setPlayhead(playhead);
  };

  const play = () => {
    propsStore.set({
      playing: true,
      direction: "fwd",
    });
  };

  const rewind = () => {
    propsStore.set({
      playing: true,
      direction: "rew",
    });
  };

  const reset = () => {
    propsStore.set({
      playing: false,
      direction: "fwd",
    });
    setPlayhead(0);
  };

  const start = () => {
    propsStore.set({ playing: true });
  };

  return {
    propsStore,
    addAnimation,
    setPlayhead,
    getPlayhead,
    pause,
    start,
    play,
    rewind,
    reset,
  };
}
