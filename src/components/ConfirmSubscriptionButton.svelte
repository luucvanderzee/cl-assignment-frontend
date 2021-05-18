<script>
  import { createEventDispatcher } from 'svelte'

  export let disabled = true
  
  const dispatch = createEventDispatcher()

  function click () {
    dispatch('click', true)
  }
</script>

<button
  on:click={click}
  class={`
    ${disabled ? 'cursor-not-allowed' : ''}
    ${disabled ? 'bg-green-500' : 'bg-green-700'}
    rounded-xl px-3 py-2 text-white font-bold hover:bg-green-500
  `}
>
  Confirm subscription
</button>