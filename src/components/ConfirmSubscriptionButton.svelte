<script>
  import { createEventDispatcher } from 'svelte'

  export let disabled
  
  const dispatch = createEventDispatcher()

  function click () {
    dispatch('click', true)
  }
</script>

<button
  on:click={click}
  class={`
    ${disabled ? 'cursor-not-allowed' : ''}
    ${disabled ? 'bg-green-300' : 'bg-green-700 hover:bg-green-500'}
    rounded-xl px-3 py-2 text-white font-bold
  `}
>
  Confirm subscription
</button>