<script>
  import { onMount } from 'svelte'
  import { cubicInOut } from 'svelte/easing'
  import { animationDriver } from 'svelte-animation-driver'
  import PlayControls from './PlayControls.svelte'

  const drv = animationDriver()
  let x, x2
  let drvInstance = new drv.addAnimation(0, 2000, (t) => {
    x = t
    x2 = t
  })

  let drvProps = drv.propsStore
  let drvHead = drv.playheadStore
  let div
  let div2
  let dist
  let isDrag = false
  let dragXStart = 0
  let dragX = 0
  let drvHeadStart = 0
  let drvHeadStart2 = 0
  onMount(() => {
    dist = div.parentElement.clientWidth - div.clientWidth
  })
  const move = (e) => {
    if (!isDrag) {
      if ($drvHead == 0) drv.play()
      else if ($drvHead == 1) drv.rewind()
      else if ($drvProps.playing) drv.pause()
      else drv.start()
    }
  }
  const mdown = (e) => {
    e.preventDefault()
    dragXStart = e.clientX
    drvHeadStart = $drvHead
    drvHeadStart2 = cubicInOut($drvHead)
  }
  const mmove = (e) => {
    dragX = e.clientX - dragXStart
    if (dragXStart !== 0 && Math.abs(dragX) > 1) {
      e.preventDefault()
      isDrag = true
      drv.pause()
      if (dragX / dist > 0) $drvProps.direction = 'fwd'
      else $drvProps.direction = 'rew'
      $drvHead = drvHeadStart + dragX / dist
    }
  }
  const calcHeadPos = (dragDist, headStart) => {
    let step = 0.001
    for (let i = 0; i <= 1; i = i + step) {
      if (Math.abs(cubicInOut(i) - (headStart + dragDist)) < 0.01) {
        return i
      }
    }
    return headStart + dragDist
  }
  const mmove2 = (e) => {
    dragX = e.clientX - dragXStart
    if (dragXStart !== 0 && Math.abs(dragX) > 0) {
      e.preventDefault()
      isDrag = true
      drv.pause()
      if (dragX / dist > 0) $drvProps.direction = 'fwd'
      else $drvProps.direction = 'rew'
      $drvHead = calcHeadPos(dragX / dist, drvHeadStart2)
    }
  }
  const mup = (e) => {
    if (dragXStart !== 0 && isDrag) {
      e.preventDefault()
      if (dragX > 0) drv.play()
      else drv.rewind()
    }
    dragXStart = 0
    dragX = 0
    setTimeout(() => (isDrag = false), 100) // to prevent click-event
  }

  $: if (div) div.style.transform = 'translate(' + x * dist + 'px, 0)'
  $: if (div2)
    div2.style.transform = 'translate(' + cubicInOut(x2) * dist + 'px, 0)'
</script>

<div style="width:400px;border:1px solid;">
  <div
    bind:this={div}
    on:click={move}
    on:mousedown={mdown}
    on:mousemove={mmove}
    on:mouseup={mup}
    on:mouseout={mup}
    style="background-color:hsl({x*40+20}, 100%, 50%);width:150px;height:50px;text-align:center">
    click or drag me
  </div>
  <div
    bind:this={div2}
    on:click={move}
    on:mousedown={mdown}
    on:mousemove={mmove2}
    on:mouseup={mup}
    on:mouseout={mup}
    style="background-color:hsl(0, {x2*80}%,50%);width:150px;height:50px;text-align:center">
    easing
  </div>
</div>
<PlayControls {drv} />
