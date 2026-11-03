// Neon line that follows the cursor behind the contact form. Component from `threejs-components` (21st.dev family of
// the Tubes Cursor), recolored with the logo gradient. At rest it traces a slow loop on its own. Fine pointer only.
const host = document.querySelector('[data-neon]')
const wanted = host && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (wanted) {
  let app = null
  let loading = false
  const start = async () => {
    if (app || loading) return
    loading = true
    try {
      const { default: Neon } = await import('../vendor/neon-cursor.js')
      const canvas = document.createElement('canvas')
      host.querySelector('canvas')?.replaceWith(canvas)
      app = Neon(canvas, { colors: ['#5ad7ee', '#8191e7', '#a86be0'] })
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
  const begin = () => new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(section)
  window.addEventListener('pointermove', begin, { once: true, passive: true })
}
