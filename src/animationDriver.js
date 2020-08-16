import { tweened } from "svelte/motion";

export function animationDriver() {
  const store = tweened(0);

  let playhead;
  let duration = 100;
  let speedAdjDuration = duration;
  let currentSpeed = 1;
  let cbSubAnimations = [];
  let isPlaying = false;
  let playingDir = "fwd";

  const updateStatus = (tvalue) => {
    playhead = tvalue;
    if (playhead >= 1) isPlaying = false;
    if (playhead <= 0) isPlaying = false;
    cbSubAnimations.forEach((subanim) => {
      let subAnimT = getAnimationT(subanim.delay, subanim.dur);
      subanim.fn(subAnimT);
    });
  };

  store.subscribe((v) => {
    updateStatus(v);
  });

  const addAnimation = (delay, dur, fn) => {
    let animdur = delay + dur;
    duration = duration < animdur ? animdur : duration;
    setSpeed(currentSpeed);
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
    if (t <= 0) return 0;
    if (t > 1) return 1;
    return t;
  };

  const run = () => {
    if (playingDir == "fwd") {
      store.set(1, { duration: speedAdjDuration * (1 - playhead) });
      isPlaying = true;
    } else if (playingDir == "rew") {
      store.set(0, { duration: speedAdjDuration * playhead });
      isPlaying = true;
    }
  };

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
    if (isPlaying) run();
  };

  const getSpeed = () => {
    return currentSpeed;
  };

  const setPlayhead = (value) => {
    tryNumber(value);
    if (value > 1) value = 1;
    if (value < 0) value = 0;
    if (playhead == value) {
      console.log('sama')
      store.set(value + 0.0001, { duration: 0 });
    }
    store.set(value, { duration: 0 });
    if (isPlaying) run();
  };

  const getPlayhead = () => {
    return playhead;
  };

  const pause = () => {
    isPlaying = false;
    setPlayhead(playhead);
  };

  const play = () => {
    playingDir = "fwd";
    run();
  };

  const rewind = () => {
    playingDir = "rew";
    run();
  };

  const start = () => {
    run();
  };
  const animPlaying = () => {
    return isPlaying;
  };

  return {
    addAnimation,
    setSpeed,
    getSpeed,
    setPlayhead,
    getPlayhead,
    pause,
    start,
    play,
    rewind,
    animPlaying,
  };
}
