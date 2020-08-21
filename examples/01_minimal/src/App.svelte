<script>
  import PlayControls from './PlayControls.svelte'
  import { animationDriver } from 'svelte-animation-driver'
  const drv = animationDriver()
  let x
  new drv.addAnimation(0, 3000, (t) => (x = t))
  drv.play()
</script>

<div style="background-color:pink;width:{x*100 + 250}px;">
    t-value:{x}
</div>
<PlayControls {drv} />
