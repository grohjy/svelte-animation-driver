<script>
  export let anim
  let props = anim.propsStore
  let ph = anim.playheadStore
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
    <button class="sel" on:click={() => anim.pause()}>||</button>
  {:else}
    <button on:click={() => anim.rewind()}>&lt</button>
  {/if}
  <button on:click={() => anim.reset()}>Reset</button>
  {#if $props.playing && $props.direction == 'fwd'}
    <button class="sel" on:click={() => anim.pause()}>||</button>
  {:else}
    <button on:click={() => anim.play()}>&gt</button>
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
