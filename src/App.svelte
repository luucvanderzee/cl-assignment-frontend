<script>
  import { onMount } from 'svelte'
  import { fetchProjects } from './store/projects.js'
  import { fetchTags } from './store/tags.js'

  import Header from './panels/Header.svelte'
  import MainContent from './panels/MainContent.svelte'
</script>

<svelte:body class="overflow-x-hidden" />

<div class="bg-gray-100 antialiased h-full">
  <Header />
  <MainContent />
</div>
