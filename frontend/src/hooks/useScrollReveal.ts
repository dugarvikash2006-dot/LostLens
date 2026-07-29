import { useEffect, useRef, useState } from 'react'

// Landing page sections fade+translate in the first time they enter the
// viewport, then stay put — never re-hide on scroll-out. The observer
// disconnects itself after the first intersection so it never re-fires.
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
