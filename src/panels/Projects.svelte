<script>
  import { onMount } from 'svelte'
  import { fetchProjects, projects } from '../store/projects.js'
  import SubscribeButton from '../components/SubscribeButton.svelte'
  import ConfirmSubscriptionButton from '../components/ConfirmSubscriptionButton.svelte'
  import ProjectCard from '../components/ProjectCard.svelte'

  let mounted = false
  let subscribeOn = false
  let subscribeDone = false
  let selectedCards = {}

  onMount(async () => {
    await fetchProjects()
    mounted = true
  })

  function handleCheck (value, id) {
    if (value) {
      selectedCards[id] = true
    }

    if (!value) {
      delete selectedCards[id]
    }
  }
</script>

{#if mounted}

  <div class="max-w-7xl mx-auto px-2 py-8">
  
    <div class="flex flex-row justify-between items-center p-3 pb-7">
      <h1 class="text-xl font-bold text-gray-800">Projects</h1>

      {#if !subscribeDone}
        {#if !subscribeOn}
          <SubscribeButton on:click={() => { subscribeOn = true }} />
        {/if}

        {#if subscribeOn}
          <ConfirmSubscriptionButton
             on:click={() => { subscribeDone = true }}
             disabled={Object.keys(selectedCards).length === 0}
          />
        {/if}
      {/if}

      {#if subscribeDone}
        Thanks for subscribing!
      {/if}
    </div>

    <div class="grid grid-flow-row grid-cols-2 gap-4">
      {#each $projects as project}
        <ProjectCard
          {project}
          showCheckbox={subscribeOn && !subscribeDone}
          on:check={value => { handleCheck(value, project.id) } }
        />
      {/each}
    </div>
  </div>
{/if}