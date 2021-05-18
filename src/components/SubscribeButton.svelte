<script>
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher()

  function click () {
    dispatch('click', true)
  }
</script>

<button
  on:click={click}
  class="bg-blue-700 rounded-xl px-3 py-2 text-white font-bold hover:bg-blue-500"
>
  Subscribe to projects
</button>