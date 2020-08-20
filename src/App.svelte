<script>
  import PlayControls from './PlayControls.svelte'
  import {
    animationDriver,
    easeOutElastic,
    easeOutSine,
    easeOutBounce,
  } from './animation-driver.js'

  const anim = animationDriver(0, 0)

  let x1, x2, x3, x4, x5, x6, x7, x8, x9
  let cb1 = (t, u) => {
    x1 = springy.valueOf()
  }
  let springy = new anim.addAnimation(0, 2000, cb1)
  let cb2 = (t, u) => {
    x2 = delay.slice(0, 0.5).valueOf()
    x3 = delay.slice(0, 0.5).steps(4).valueOf()
    x4 = delay.slice(0.5, 1).repeat(1.5).cycle().valueOf()
  }
  let delay = new anim.addAnimation(1000, 2000, cb2)
  let cb3 = (t, u) => {
    x5 = key.slice(0, 0.4).valueOf()
    x6 = key.slice(0.3, 0.8).valueOf()
    x7 = key.slice(0.2, 0.5).valueOf()
    x8 = key.slice(0.41, 1).valueOf()
    x9 = key.slice(0.41, 0.9).valueOf()
  }
  let key = new anim.addAnimation(3000, 3000, cb3)
</script>

<div
  style="position:relative; border:1px
  solid;overflow:hidden;width:450px;">
  <div
    style="position:relative;background-color:hsl({x6 * 40 + 300}deg, 100%,
    70%);width:{x5 * 200 + 50}px;padding:5px;margin:5px 0;">
    <div
      style="position:absolute;top:0;right:0;opacity:{x7};transform:translate({x8 * 280}px,
      {easeOutBounce(x8) * 140}px);">
      &#11088
    </div>
    <div
      style="position:absolute;top:0;right:0;opacity:{x7};transform:translate({x9 * 230}px,
      {easeOutBounce(x9) * 140}px);">
      &#11088
    </div>
    Keyframed
  </div>
  <div
    style="background-color:lightblue;width:{x4 * 200 + 50}px;padding:5px;margin:5px
    0;">
    Cycle
  </div>
  <div
    style="background-color:lightgreen;width:{x3 * 200 + 50}px;padding:5px;margin:5px
    0;">
    Stepped
  </div>
  <div
    style="background-color:yellow;width:{easeOutSine(x2) * 200 + 50}px;padding:5px;margin:5px
    0;">
    Delay
  </div>
  <div
    style="width:{easeOutElastic(x1, 0.8) * 200 + 50}px;
    background-color:pink;padding:5px;margin:5px 0;">
    Springy
  </div>
</div>

<PlayControls {anim} />
