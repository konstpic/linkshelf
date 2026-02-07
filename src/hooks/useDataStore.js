import { useState, useEffect, useCallback } from 'react'
import { loadLinks, saveLinks } from '../api/linkShelf'
import { normalizeData } from '../utils/links'

export function useDataStore() {
  const [data, setData] = useState({ categories: ['Всё'], links: [] })
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    return loadLinks()
      .then((d) => {
        setData(normalizeData(d ?? {}))
        setLoaded(true)
        return d
      })
      .catch(() => {
        setData({ categories: ['Всё'], links: [] })
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback((newDataOrUpdater) => {
    if (typeof newDataOrUpdater === 'function') {
      setData((prev) => {
        const next = newDataOrUpdater(prev)
        saveLinks(next)
        return next
      })
    } else {
      setData(newDataOrUpdater)
      saveLinks(newDataOrUpdater)
    }
  }, [])

  const reload = useCallback(() => {
    return loadLinks().then((d) => {
      setData(normalizeData(d))
      return d
    })
  }, [])

  return { data, save, loaded, reload }
}
