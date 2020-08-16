<script>
  import { bounceIn } from 'svelte/easing'
  import { animationDriver } from './animationDriver.js'
  let name = 'world'
  const anim = animationDriver()
  let x1, x2
  let mouseXStart
  let mouseX
  let playheadPos
  let isDrag = false
  let wasPlaying = false
  anim.addAnimation(1000, 2000, (t) => (x1 = t))
  anim.addAnimation(0, 6000, (t) => (x2 = t))
  anim.setPlayhead(0)
  const down = (e) => {
    isDrag = true
    mouseXStart = e.clientX
    playheadPos = anim.getPlayhead()
    wasPlaying = anim.animPlaying()
    anim.pause()
  }
  const move = (e) => {
    if (isDrag) {
      mouseX = e.clientX - mouseXStart
      let w = e.target.clientWidth
      let frac = (mouseX / w) * 2
      anim.setPlayhead(playheadPos + frac)
    }
  }
  const up = (e) => {
    if (isDrag) {
      if (wasPlaying) anim.start()
      isDrag = false
    }
  }
</script>

<!-- <h1 on:click={() => anim.setPlayhead(2)}>0.1</h1> -->
<span on:click={() => anim.rewind()}>Rewind</span>
<span on:click={() => anim.pause()}>Pause</span>
<span on:click={() => anim.play()}>Play</span>
<br />
<span on:click={() => anim.setSpeed(0.5)}>x0.5</span>
<span on:click={() => anim.setSpeed(1)}>x1</span>
<span on:click={() => anim.setSpeed(4)}>x4</span>
<p>Drag mouse to run animation</p>
<div
  on:mousedown={down}
  on:mousemove={move}
  on:mouseup={up}
  on:mouseout={up}
  style="background-color:pink;width:300px;height:50px;">
  &nbsp
</div>
<div style="position:relative">
  <p
    style="background-color:yellow;width:100px;transform: translate({x1 * 100}px,
    0)">
    x1
  </p>
  <p
    style="background-color:gray;width:100px;transform: translate({x2 * 150}px, {bounceIn(1 - x2) * -100}px)">
    x2
  </p>
</div>
