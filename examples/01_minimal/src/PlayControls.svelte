<script>
  export let drv
  let props = drv.propsStore
  let ph = drv.playheadStore
  $ph = 0
</script>

<style>
  button {
    margin: 2px;
    padding: 3px;
    min-width: 50px;
  }
  .sel {
    font-weight: bold;
  }
</style>

<hr />
<div>
  <div style="display:inline-block;width:60px;">Controls:</div>
  {#if $props.playing && $props.direction == 'rew'}
    <button class="sel" on:click={() => drv.pause()}>||</button>
  {:else}
    <button on:click={() => drv.rewind()}>&lt</button>
  {/if}
  <button on:click={() => drv.reset()}>Reset</button>
  {#if $props.playing && $props.direction == 'fwd'}
    <button class="sel" on:click={() => drv.pause()}>||</button>
  {:else}
    <button on:click={() => drv.play()}>&gt</button>
  {/if}
</div>
<div>
  <div style="display:inline-block;width:60px;">Speed:</div>
  <button class:sel={$props.speed == 0.5} on:click={() => ($props.speed = 0.5)}>
    x0.5
  </button>
  <button class:sel={$props.speed == 1} on:click={() => ($props.speed = 1)}>
    x1
  </button>
  <button class:sel={$props.speed == 2} on:click={() => ($props.speed = 2)}>
    x2
  </button>
</div>
<p>
  <span>Playhead:{Math.floor($ph * 100) / 100}</span>
  <br />
  <input
    on:input={(e) => {
      $ph = e.target.value / 500
    }}
    type="range"
    min="0"
    max="500"
    value={$ph * 500} />
</p>
