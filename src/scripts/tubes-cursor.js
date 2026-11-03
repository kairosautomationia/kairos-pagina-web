// Tubes cursor trail across the whole page. This is the real "Tubes Cursor" component from 21st.dev (id 8130,
// @jod49034), which wraps `threejs-components` (Kevin Levron). It lives in one fixed, full-screen layer above the
// content (pointer-events: none), so the trail follows the cursor over every section. Colors follow the KAIROS logo
// instead of random ones, and a click on empty space cycles through the brand palette. It only runs with a fine
// pointer and full motion, and it is paused while the tab is hidden.
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
    if (app || loading || document.hidden) return
    loading = true
    try {
      const { default: TubesCursor } = await import('threejs-components/build/cursors/tubes1.min.js')
      const canvas = document.createElement('canvas')
      host.querySelector('canvas')?.replaceWith(canvas)
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

  document.addEventListener('click', (event) => {
    if (!app || event.target.closest('a, button, input, textarea, select, summary, label')) return
    index = (index + 1) % palettes.length
    app.tubes.setColors(palettes[index].tubes)
    app.tubes.setLightsColors(palettes[index].lights)
  })
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 })
  else setTimeout(start, 1200)
}
