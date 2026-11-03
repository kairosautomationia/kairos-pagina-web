// Second 3D piece: a torus knot made of light, floating behind the "control" section (Three.js, loaded on demand).
const host = document.querySelector('[data-knot]')

if (host) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = async () => {
    const THREE = await import('three')
    const canvas = host.querySelector('canvas')
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    } catch {
      return
    }
    const small = window.matchMedia('(max-width: 700px)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30)
    camera.position.z = 6

    const cyan = new THREE.Color('#5ad7ee')
    const violet = new THREE.Color('#a86be0')

    const geometry = new THREE.TorusKnotGeometry(1.1, 0.34, small ? 180 : 320, small ? 14 : 22, 2, 3)
    const positions = geometry.attributes.position
    const colors = new Float32Array(positions.count * 3)
    const mixed = new THREE.Color()
    for (let i = 0; i < positions.count; i++) {
      mixed.copy(cyan).lerp(violet, (positions.getX(i) + 1.6) / 3.2)
      colors.set([mixed.r, mixed.g, mixed.b], i * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const knot = new THREE.Group()
    knot.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending })))
    knot.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.07, depthWrite: false })))
    scene.add(knot)

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    window.addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2
    }, { passive: true })

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    new ResizeObserver(resize).observe(host)

    const render = (seconds) => {
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      knot.rotation.x = seconds * 0.18 + pointer.y * 0.5
      knot.rotation.y = seconds * 0.26 + pointer.x * 0.6
      renderer.render(scene, camera)
    }

    host.classList.add('is-live')
    if (reducedMotion) {
      render(3)
      return
    }
    let frame = 0
    let visible = false
    const begin = performance.now()
    const tick = (now) => {
      render((now - begin) / 1000)
      frame = requestAnimationFrame(tick)
    }
    const run = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      visible ? run() : stop()
    }).observe(host)
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()))
  }

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 })
  else setTimeout(start, 400)
}
