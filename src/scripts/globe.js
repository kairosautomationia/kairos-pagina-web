// Interactive globe in the "reach" section. Based on "Globe" by @dillionverma (21st.dev, id 1128), which uses COBE.
// Dark palette from the logo; it auto-rotates, can be dragged, and is torn down when it leaves the screen.
const host = document.querySelector('[data-globe]')

if (host) {
  const canvas = host.querySelector('canvas')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = window.matchMedia('(max-width: 700px)').matches
  let globe = null
  let phi = 3.6
  let drag = null
  let offset = 0
  let loading = false

  const markers = [
    { location: [-1.2417, -78.6197], size: 0.12 }, // Ambato
    { location: [-0.1807, -78.4678], size: 0.07 }, // Quito
    { location: [-2.1710, -79.9224], size: 0.07 }, // Guayaquil
    { location: [4.7110, -74.0721], size: 0.06 }, // Bogotá
    { location: [-12.0464, -77.0428], size: 0.06 }, // Lima
    { location: [19.4326, -99.1332], size: 0.06 }, // Ciudad de México
    { location: [-33.4489, -70.6693], size: 0.05 }, // Santiago
    { location: [-34.6037, -58.3816], size: 0.05 }, // Buenos Aires
    { location: [40.4168, -3.7038], size: 0.05 }, // Madrid
  ]

  const start = async () => {
    if (globe || loading) return
    loading = true
    const { default: createGlobe } = await import('cobe')
    const size = canvas.offsetWidth || 560
    globe = createGlobe(canvas, {
      devicePixelRatio: small ? 1.5 : 2,
      width: size * 2,
      height: size * 2,
      phi,
      theta: 0.28,
      scale: 0.9,
      dark: 1,
      diffuse: 1.6,
      mapSamples: small ? 9000 : 16000,
      mapBrightness: 9,
      baseColor: [0.3, 0.38, 0.8],
      markerColor: [0.35, 0.84, 0.93],
      glowColor: [0.42, 0.36, 0.86],
      markers,
      onRender: (state) => {
        if (!drag && !reducedMotion) phi += 0.004
        state.phi = phi + offset
        state.width = (canvas.offsetWidth || size) * 2
        state.height = (canvas.offsetWidth || size) * 2
      },
    })
    host.classList.add('is-live')
    loading = false
  }
  const stop = () => {
    globe?.destroy()
    globe = null
    host.classList.remove('is-live')
  }

  canvas.addEventListener('pointerdown', (event) => {
    drag = event.clientX - offset * 200
    canvas.style.cursor = 'grabbing'
    canvas.setPointerCapture(event.pointerId)
  })
  canvas.addEventListener('pointermove', (event) => {
    if (drag !== null) offset = (event.clientX - drag) / 200
  })
  const release = () => {
    if (drag === null) return
    phi += offset
    offset = 0
    drag = null
    canvas.style.cursor = 'grab'
  }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  const begin = () => new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(host)
  if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2000 })
  else setTimeout(begin, 800)
}
