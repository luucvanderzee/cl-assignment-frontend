<script>
  import { onMount } from 'svelte'
  import { fetchProjects, projects } from '../store/projects.js'
  import ProjectCard from '../components/ProjectCard.svelte'

  let mounted = false

  onMount(async () => {
    await fetchProjects()
    mounted = true
  })
</script>

{#if mounted}
  <div class="">
    {#each $projects as project}
      <ProjectCard {project} />
    {/each}
  </div>
{/if}