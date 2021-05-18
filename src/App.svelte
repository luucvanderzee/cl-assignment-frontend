<script>
  import { onMount } from 'svelte'
  import { fetchProjects } from './store/projects.js'
  import { fetchTags } from './store/tags.js'

  import Header from './panels/Header.svelte'
  import MainContent from './panels/MainContent.svelte'
</script>

<div class="bg-gray-200 h-screen">
  <Header />
  <MainContent />
</div>
