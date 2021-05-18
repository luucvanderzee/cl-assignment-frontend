<script>
  import User from '../icons/User.svelte'
  import Idea from '../icons/Idea.svelte'

  export let project
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden grid grid-cols-2">
  <div class="flex w-1/1">
    <img 
      src={`img/${project.img}`}
      alt={project.img}
    />
  </div>
  
  <div class="px-6 py-4 space-y-2">
    <h3 class="text-blue-800 text-lg font-bold">{project.title}</h3>

    <div class="text-gray-800">
      {project.description}
    </div>

    <div class="flex flex-row justify-between border rounded p-2">
      <div class="text-gray-800 font-bold text-sm">Period:</div>
      <div class="text-gray-700 text-sm">{project.startAt} - {project.endAt}</div>
    </div>

    <div class="space-y-2">
      <div class="">
        <User />
        {project.users}
      </div>
      <div class="">
        <Idea />
        {project.ideas}
      </div>
    </div>
  </div>
</div>