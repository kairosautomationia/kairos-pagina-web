// 3D hero: a particle sphere wrapped in orbit rings and traveling nodes (Three.js).
// Concept from "Orbital Sphere Background" by @mengto (21st.dev, id 25503), written from scratch
// with the KAIROS logo colors. three is loaded on demand so it never blocks the first paint.
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
    const mixed = new THREE.Color()

    const world = new THREE.Group()
    const core = new THREE.Group()
    world.add(core)
    scene.add(world)

    // Particle shell on a Fibonacci sphere.
    const count = small ? 1100 : 2600
    const radius = 2.1
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const golden = Math.PI * (3 - Math.sqrt(5))
    const shell = []
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const ring = Math.sqrt(1 - y * y)
      const theta = golden * i
      const jitter = 1 + (Math.random() - 0.5) * 0.05
      const x = Math.cos(theta) * ring * radius * jitter
      const z = Math.sin(theta) * ring * radius * jitter
      const py = y * radius * jitter
      positions.set([x, py, z], i * 3)
      mixed.copy(cyan).lerp(violet, Math.min(1, Math.max(0, (y + 1) / 2 + (Math.random() - 0.5) * 0.25)))
      colors.set([mixed.r, mixed.g, mixed.b], i * 3)
      sizes[i] = 0.7 + Math.random() * 1.3
      if (i % 12 === 0) shell.push(new THREE.Vector3(x, py, z))
    }
    const shellGeometry = new THREE.BufferGeometry()
    shellGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    shellGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    shellGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    const shellMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixel: { value: renderer.getPixelRatio() * (small ? 105 : 70) } },
      vertexShader: `
        attribute float aSize; attribute vec3 aColor; varying vec3 vColor;
        uniform float uTime; uniform float uPixel;
        void main() {
          vec3 p = position;
          float wave = sin(p.y * 2.2 + uTime * 0.8) * 0.05 + sin(p.x * 3.0 - uTime * 0.6) * 0.04;
          p += normalize(position) * wave;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * uPixel / -mv.z;
          gl_Position = projectionMatrix * mv;
          vColor = aColor;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, a * 0.85);
        }`,
    })
    core.add(new THREE.Points(shellGeometry, shellMaterial))

    // Network lines between nearby sampled points.
    const links = []
    for (let a = 0; a < shell.length; a++) {
      for (let b = a + 1; b < shell.length; b++) {
        if (shell[a].distanceTo(shell[b]) < 0.82) links.push(shell[a], shell[b])
      }
    }
    const linkGeometry = new THREE.BufferGeometry().setFromPoints(links)
    core.add(new THREE.LineSegments(linkGeometry, new THREE.LineBasicMaterial({ color: periwinkle, transparent: true, opacity: 0.22, depthWrite: false })))

    // Inner wireframe core.
    const inner = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.15, 1)),
      new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.28, depthWrite: false }),
    )
    core.add(inner)

    // Orbit rings with a traveling node each.
    const orbits = []
    ;[
      { r: 2.75, tilt: [1.15, 0.2, 0.0], speed: 0.45, color: cyan },
      { r: 3.15, tilt: [0.35, 0.0, 0.9], speed: -0.32, color: violet },
      { r: 3.55, tilt: [-0.7, 0.4, -0.25], speed: 0.22, color: periwinkle },
    ].forEach((orbit, index) => {
      const pivot = new THREE.Group()
      pivot.rotation.set(...orbit.tilt)
      const points = []
      for (let i = 0; i <= 160; i++) {
        const angle = (i / 160) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(angle) * orbit.r, 0, Math.sin(angle) * orbit.r))
      }
      pivot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: orbit.color, transparent: true, opacity: 0.3, depthWrite: false })))
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), new THREE.MeshBasicMaterial({ color: orbit.color }))
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), new THREE.MeshBasicMaterial({ color: orbit.color, transparent: true, opacity: 0.16, depthWrite: false }))
      node.add(halo)
      pivot.add(node)
      core.add(pivot)
      orbits.push({ node, radius: orbit.r, speed: orbit.speed, offset: index * 2.1 })
    })

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    window.addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2
    }, { passive: true })

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      const wide = camera.aspect > 1.15
      const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const halfWidth = halfHeight * camera.aspect
      const scale = wide ? 0.84 : 0.58
      world.scale.setScalar(scale)
      world.position.set(wide ? Math.min(halfWidth - 2.3 * scale, halfWidth * 0.55) : 0, wide ? 0.3 : halfHeight * 0.5, 0)
      camera.updateProjectionMatrix()
    }
    resize()
    new ResizeObserver(resize).observe(host)

    const render = (seconds) => {
      shellMaterial.uniforms.uTime.value = seconds
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1)
      core.rotation.y = seconds * 0.12 + pointer.x * 0.5 + scroll * 1.2
      core.rotation.x = pointer.y * 0.28 + scroll * 0.4
      inner.rotation.y = -seconds * 0.25
      inner.rotation.z = seconds * 0.1
      orbits.forEach((orbit) => {
        const angle = seconds * orbit.speed + orbit.offset
        orbit.node.position.set(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius)
      })
      renderer.render(scene, camera)
    }

    host.classList.add('is-live')
    if (reducedMotion) {
      render(4)
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
    run()
  }

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 600 })
  else setTimeout(start, 120)
}
