<script>
  import { bounceIn } from 'svelte/easing'
  import { animationDriver } from './animationDriver.js'

  let name = 'world'
  const anim = animationDriver()
  let props = anim.propsStore

  let x1, x2, yWidth
  let playheadPosition
  let ko = (t, u) => {
    x1 = t
    yWidth = divYellow.repeat(2).cycle().valueOf() * 70
  }
  let divYellow = new anim.addAnimation(0, 8000, ko)
  let divGray = new anim.addAnimation(1000, 6000, (t, u) => (x2 = t))
  new anim.addAnimation(0, 6000, (t, u) => (playheadPosition = t))
  anim.setPlayhead(0)
</script>

<style>
  .b {
    width: 30px;
    padding: 3px;
    border: 1px solid black;
    text-align: center;
  }
  .b.sel {
    background-color: lightgray;
  }
</style>

<div
  style="display: flex;width:150px;height:
  40px;justify-content:center;align-items: center;">
  {#if $props.playing && $props.direction == 'rew'}
    <div on:click={() => anim.pause()}>⏸</div>
  {:else}
    <div on:click={() => anim.rewind()}>◀️</div>
  {/if}
  <div on:click={() => anim.reset()}>⏹</div>
  {#if $props.playing && $props.direction == 'fwd'}
    <div on:click={() => anim.pause()}>⏸</div>
  {:else}
    <div on:click={() => anim.play()}>▶️</div>
  {/if}
</div>
<div
  style="display: flex;width: 200px;height: 40px;justify-content:
  space-around;align-items: center;">
  Speed:
  <div
    class="b"
    class:sel={$props.speed == 0.5}
    on:click={() => ($props.speed = 0.5)}>
    x0.5
  </div>
  <div
    class="b"
    class:sel={$props.speed == 1}
    on:click={() => ($props.speed = 1)}>
    x1
  </div>
  <div
    class="b"
    class:sel={$props.speed == 4}
    on:click={() => ($props.speed = 4)}>
    x4
  </div>
</div>
<p>
  <span>Playhead:</span>
  <br />
  <input
    on:input={(e) => anim.setPlayhead(e.target.value / 1000)}
    type="range"
    min="0"
    max="1000"
    value={playheadPosition * 1000} />
</p>

<div style="position:relative; height:60px;border:1px solid;padding:2px;padding-top:70px">
  <div
    style="background-color:yellow;width:{30 + yWidth}px;height:30px;transform:
    translate({x1 * 300}px, 0)">
    x1
  </div>
  <div
    style="border:1px solid red;width:100px;height:30px;transform: translate({x2 * 300}px,
    {bounceIn(1 - x2) * -100}px)">
    x2
  </div>
</div>
