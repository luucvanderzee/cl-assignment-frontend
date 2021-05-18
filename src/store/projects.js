import { writable } from 'svelte/store'
import projectsData from './api/projects.json'

export function fetchProjects () {
  return new Promise((resolve, reject) => {
    projects.set(projectsData)
    resolve()
  })
}

export const projects = writable()
