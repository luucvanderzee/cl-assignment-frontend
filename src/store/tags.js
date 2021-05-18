import { writable } from 'svelte/store'
import tagsData from './api/tags.json'

export function fetchTags () {
  return new Promise((resolve, reject) => {
    tags.set(tagsData)
    resolve()
  })
}

export const tags = writable()
