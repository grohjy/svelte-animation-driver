<script>
  import { animationDriver } from 'svelte-animation-driver'
  import PlayControls from './PlayControls.svelte'

  const drv = animationDriver()
  let x, x2, x3
  let drvInstance = new drv.addAnimation(0, 1000, (t) => {
    x = t
    x2 = drvInstance.slice(0, 0.45).valueOf()
    x3 = drvInstance.slice(0.55, 1).valueOf()
  })

  let drvHead = drv.playheadStore
  let div
  let div2

  $: if (div) div.style.transform = 'translate(' + x * -20 + '%, 0)'
  $: if (div2) div2.style.transform = 'translate(' + x * -100 + '%, 0)'
</script>

<div style="width:200px;border:1px solid;">
  <header
    style="background-color:gray;height:50px;color:white;display:flex;align-items:center;justify-content:center;position:relative;">
    <div
      style="position: absolute; padding: 10px; opacity:{1 - x2};
      transform:translate({x * -80}%,0);">
      Header
    </div>
    {#if $drvHead > 0}
      <div
        on:click={() => drv.rewind()}
        style="position: absolute; padding: 10px; left:{(1 - x) * 25}%; opacity:{x3};cursor:pointer;">
        &lt header
      </div>
    {/if}
    <div
      style="position: absolute; padding: 10px; opacity:{x3};
      transform:translate({(1 - x) * 80}%,0);">
      Details
    </div>
  </header>
  <div style="position:relative;overflow:hidden;height:300px;">
    <div
      bind:this={div}
      style="background-color:hsl(0,0%,90%);width:100%;height:100%;position:absolute;">
      <div style="padding:10px;">
        <div>
          Main page
          <div
            on:click={() => drv.play()}
            style="position: absolute;
            right:0;top:0;padding:10px;cursor:pointer;">
            details &gt
          </div>
        </div>
      </div>
    </div>
    <div
      bind:this={div2}
      style="background-color:lightyellow;width:100%;height:100%;position:relative;left:100%;">
      <div style="padding:10px;">
        <div>Here are some details</div>
      </div>
    </div>
  </div>
</div>
<PlayControls {drv} />
