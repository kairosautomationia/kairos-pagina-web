// Concentric ripple lines behind the closing call to action. Shader from "Shader Animation" by @designali-in
// (21st.dev, id 5625); its three color channels are mapped onto the logo's cyan, periwinkle and violet.
const host = document.querySelector('[data-ripples]')

if (host) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = async () => {
    const THREE = await import('three')
    const canvas = host.querySelector('canvas')
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const uniforms = {
      time: { value: 1 },
      resolution: { value: new THREE.Vector2() },
      cyan: { value: new THREE.Color('#5ad7ee') },
      mid: { value: new THREE.Color('#8191e7') },
      violet: { value: new THREE.Color('#a86be0') },
    }
    scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
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
      }),
    ))

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      renderer.setSize(width, height, false)
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height)
    }
    resize()
    new ResizeObserver(resize).observe(host)

    host.classList.add('is-live')
    if (reducedMotion) {
      uniforms.time.value = 40
      renderer.render(scene, camera)
      return
    }
    let frame = 0
    const tick = () => {
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame && !document.hidden) frame = requestAnimationFrame(tick)
      else if (!entry.isIntersecting) stop()
    }).observe(host)
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : null))
  }
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 })
  else setTimeout(start, 900)
}
