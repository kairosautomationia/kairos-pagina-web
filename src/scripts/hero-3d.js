// 3D hero: the KAIROS logo as a volumetric hologram (Three.js). The real logo artwork is stacked in thin layers with
// depth, so it reads as a solid object when it turns, with a glow behind it and data motes rising around it.
// three is loaded on demand so it never blocks the first paint.
const host = document.querySelector('[data-hero-3d]')

if (host) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = async () => {
    const THREE = await import('three')
    const canvas = host.querySelector('canvas')
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      return
    }

    const small = window.matchMedia('(max-width: 700px)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)
    camera.position.set(0, 0, 9)

    const cyan = new THREE.Color('#5ad7ee')
    const violet = new THREE.Color('#a86be0')
    const periwinkle = new THREE.Color('#8191e7')

    const world = new THREE.Group()
    scene.add(world)

    // Soft brand glow behind the logo.
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = glowCanvas.height = 256
    const glowContext = glowCanvas.getContext('2d')
    const gradient = glowContext.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(129, 145, 231, .55)')
    gradient.addColorStop(0.45, 'rgba(129, 145, 231, .18)')
    gradient.addColorStop(1, 'rgba(129, 145, 231, 0)')
    glowContext.fillStyle = gradient
    glowContext.fillRect(0, 0, 256, 256)
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    glow.position.z = -1.2
    world.add(glow)

    const logo = new THREE.Group()
    world.add(logo)
    const width = 4.3
    const height = (width * 372) / 432
    const layers = small ? 14 : 26
    const depth = 0.62
    const slices = []
    const loader = new THREE.TextureLoader()
    loader.load('/Documentos/Logo%20final.png', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      for (let i = 0; i < layers; i++) {
        const t = i / (layers - 1)
        const front = i === layers - 1
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.04,
          depthWrite: false,
          color: front ? '#ffffff' : new THREE.Color().copy(cyan).lerp(violet, t),
          opacity: front ? 1 : 0.22,
          blending: front ? THREE.NormalBlending : THREE.AdditiveBlending,
        })
        const slice = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material)
        slice.position.z = (t - 0.5) * depth
        slice.renderOrder = i
        logo.add(slice)
        slices.push(slice)
      }
      host.classList.add('is-live')
      if (reducedMotion) render(4)
    })

    // Data motes rising around the logo.
    const count = small ? 90 : 220
    const motes = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const moteColors = new Float32Array(count * 3)
    const mix = new THREE.Color()
    for (let i = 0; i < count; i++) {
      motes.set([(Math.random() - 0.5) * 6.4, (Math.random() - 0.5) * 5.2, (Math.random() - 0.5) * 2.4], i * 3)
      speeds[i] = 0.12 + Math.random() * 0.34
      mix.copy(cyan).lerp(violet, Math.random())
      moteColors.set([mix.r, mix.g, mix.b], i * 3)
    }
    const moteGeometry = new THREE.BufferGeometry()
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motes, 3))
    moteGeometry.setAttribute('color', new THREE.BufferAttribute(moteColors, 3))
    world.add(new THREE.Points(moteGeometry, new THREE.PointsMaterial({ size: small ? 0.085 : 0.06, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })))

    // A thin scan line that sweeps the logo, as if the circuit were being read.
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.9, 0.04),
      new THREE.MeshBasicMaterial({ color: periwinkle, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    scan.position.z = depth * 0.55
    logo.add(scan)

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    window.addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2
    }, { passive: true })

    const resize = () => {
      const { width: boxWidth, height: boxHeight } = host.getBoundingClientRect()
      renderer.setSize(boxWidth, boxHeight, false)
      camera.aspect = boxWidth / Math.max(boxHeight, 1)
      const wide = camera.aspect > 1.15
      const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const halfWidth = halfHeight * camera.aspect
      const scale = wide ? Math.min(1.05, (halfWidth * 0.68) / width) : Math.min(0.9, (halfWidth * 1.3) / width)
      world.scale.setScalar(scale)
      world.position.set(wide ? halfWidth * 0.62 : 0, wide ? 0.1 : halfHeight * 0.5, 0)
      camera.updateProjectionMatrix()
    }
    resize()
    new ResizeObserver(resize).observe(host)

    function render(seconds) {
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1)
      logo.rotation.y = Math.sin(seconds * 0.45) * 0.28 + pointer.x * 0.5 + scroll * 0.9
      logo.rotation.x = Math.cos(seconds * 0.35) * 0.08 + pointer.y * 0.28
      logo.position.y = Math.sin(seconds * 0.8) * 0.1
      glow.material.opacity = 0.85 + Math.sin(seconds * 0.9) * 0.15

      // Layers breathe apart slightly so the depth is visible while it floats.
      const spread = 1 + Math.sin(seconds * 0.7) * 0.08
      slices.forEach((slice, index) => {
        slice.position.z = (index / (layers - 1) - 0.5) * depth * spread
      })

      const sweep = (seconds * 0.32) % 1.6
      scan.position.y = (0.5 - sweep / 1.0) * height * 1.0
      scan.material.opacity = sweep < 1 ? 0.3 * Math.sin(Math.PI * sweep) : 0

      for (let i = 0; i < count; i++) {
        let y = motes[i * 3 + 1] + speeds[i] * 0.016
        if (y > 2.8) y = -2.8
        motes[i * 3 + 1] = y
        motes[i * 3] += Math.sin(seconds * 0.6 + i) * 0.0008
      }
      moteGeometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }

    if (reducedMotion) {
      new ResizeObserver(() => render(4)).observe(host)
      return
    }

    let frame = 0
    let visible = true
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
    host.classList.add('is-live')
    run()
  }

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 600 })
  else setTimeout(start, 120)
}
