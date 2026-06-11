import { useEffect, useMemo, useRef } from 'react'

/** Debounce estável para salvar edições sem martelar a API. */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 600,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return useMemo(
    () =>
      (...args: Args) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
      },
    [delayMs],
  )
}
