// Concentric ripple lines behind the closing call to action. Shader from "Shader Animation" by @designali-in
// (21st.dev, id 5625); its three color channels are mapped onto the logo's cyan, periwinkle and violet.
// The WebGL context only exists while the section is near the viewport, and it renders at a reduced resolution
// on phones (thin lines survive it well).
const host = document.querySelector('[data-ripples]')

if (host) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = window.matchMedia('(max-width: 700px)').matches || window.matchMedia('(pointer: coarse)').matches
  let session = null
  let starting = false
  let wanted = false
  let timer = 0

  const create = async () => {
    const THREE = await import('three')
    const stale = host.querySelector('canvas')
    const canvas = stale.cloneNode(false)
    stale.replaceWith(canvas)
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
    } catch {
      return null
    }
    renderer.setPixelRatio(small ? 0.7 : Math.min(window.devicePixelRatio || 1, 1.25))
    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const uniforms = {
      time: { value: 1 },
      resolution: { value: new THREE.Vector2() },
      cyan: { value: new THREE.Color('#5ad7ee') },
      mid: { value: new THREE.Color('#8191e7') },
      violet: { value: new THREE.Color('#a86be0') },
    }
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'void main() { gl_Position = vec4(position, 1.0); }',
      fragmentShader: `
        precision highp float;
        uniform vec2 resolution; uniform float time;
        uniform vec3 cyan; uniform vec3 mid; uniform vec3 violet;
        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          float t = time * 0.05;
          float lineWidth = 0.002;
          vec3 color = vec3(0.0);
          for (int j = 0; j < 3; j++) {
            for (int i = 0; i < 5; i++) {
              color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
            }
          }
          vec3 tinted = color.r * cyan + color.g * mid + color.b * violet;
          gl_FragColor = vec4(min(tinted, vec3(1.4)), 1.0);
        }`,
    })
    scene.add(new THREE.Mesh(geometry, material))

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height)
      if (reducedMotion) renderer.render(scene, camera)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    host.classList.add('is-live')

    let frame = 0
    let last = 0
    // phones render the ripples at 30 fps: the lines move slowly, and it halves the GPU work
    const interval = small ? 33 : 0
    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      if (now - last < interval) return
      last = now
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else if (!frame && !reducedMotion) frame = requestAnimationFrame(tick)
    }
    document.addEventListener('visibilitychange', onVisibility)
    if (reducedMotion) {
      uniforms.time.value = 40
      renderer.render(scene, camera)
    } else {
      frame = requestAnimationFrame(tick)
    }

    return {
      destroy() {
        stop()
        observer.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
        host.classList.remove('is-live')
      },
    }
  }

  const activate = async () => {
    if (session || starting) return
    starting = true
    const created = await create().catch((error) => {
      console.error(error)
      return null
    })
    starting = false
    if (!created) return
    if (wanted) session = created
    else created.destroy()
  }
  const deactivate = () => {
    session?.destroy()
    session = null
  }

  const begin = () =>
    new IntersectionObserver(([entry]) => {
      wanted = entry.isIntersecting
      clearTimeout(timer)
      if (wanted) activate()
      else timer = setTimeout(deactivate, 1200)
    }, { rootMargin: '300px 0px' }).observe(host)
  if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2500 })
  else setTimeout(begin, 900)
}
