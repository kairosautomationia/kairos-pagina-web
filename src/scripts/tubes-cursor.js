// Tubes cursor trail in the hero. This is the real "Tubes Cursor" component from 21st.dev (id 8130, @jod49034),
// which wraps `threejs-components` (Kevin Levron). Colors follow the KAIROS logo instead of random ones, and a click
// cycles through the brand palette. It only runs with a fine pointer, on screen, and without reduced motion.
const host = document.querySelector('[data-tubes]')
const wanted = host && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (wanted) {
  const cyan = '#5ad7ee'
  const mid = '#8191e7'
  const violet = '#a86be0'
  const palettes = [
    { tubes: [cyan, mid, violet], lights: [cyan, violet, mid, '#ffffff'] },
    { tubes: [violet, cyan, mid], lights: [violet, mid, cyan, '#ffffff'] },
    { tubes: [mid, violet, cyan], lights: [mid, cyan, violet, '#ffffff'] },
  ]
  let index = 0
  let app = null
  let loading = false

  const start = async () => {
    if (app || loading) return
    loading = true
    try {
      const { default: TubesCursor } = await import('threejs-components/build/cursors/tubes1.min.js')
      const old = host.querySelector('canvas')
      const canvas = document.createElement('canvas')
      old.replaceWith(canvas)
      const palette = palettes[index]
      app = TubesCursor(canvas, { tubes: { colors: palette.tubes, lights: { intensity: 160, colors: palette.lights } } })
      host.classList.add('is-live')
    } catch {
      host.remove()
    }
    loading = false
  }
  const stop = () => {
    app?.dispose?.()
    app = null
    host.classList.remove('is-live')
  }

  const section = host.closest('section')
  section.addEventListener('click', (event) => {
    if (!app || event.target.closest('a, button')) return
    index = (index + 1) % palettes.length
    app.tubes.setColors(palettes[index].tubes)
    app.tubes.setLightsColors(palettes[index].lights)
  })
  const begin = () => new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(section)
  if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2500 })
  else setTimeout(begin, 1200)
}
