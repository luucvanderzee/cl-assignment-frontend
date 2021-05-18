<script>
  import { onMount } from 'svelte'
  import { fetchProjects, projects } from '../store/projects.js'
  import SubscribeButton from '../components/SubscribeButton.svelte'
  import ConfirmSubscriptionButton from '../components/ConfirmSubscriptionButton.svelte'
  import ProjectCard from '../components/ProjectCard.svelte'

  let mounted = false
  let subscribeOn = false

  onMount(async () => {
    await fetchProjects()
    mounted = true
  })
</script>

{#if mounted}

  <div class="max-w-7xl mx-auto px-2 py-8">
  
    <div class="flex flex-row justify-between items-center p-3 pb-7">
      <h1 class="text-xl font-bold text-gray-800">Projects</h1>

      {#if !subscribeOn}
        <SubscribeButton on:click={() => { subscribeOn = true }} />
      {/if}

      {#if subscribeOn}
        <ConfirmSubscriptionButton on:click={() => { subscribeOn = false }} />
      {/if}
    </div>

    <div class="grid grid-flow-row grid-cols-2 gap-4">
      {#each $projects as project}
        <ProjectCard {project} showCheckbox={subscribeOn} />
      {/each}
    </div>
  </div>
{/if}