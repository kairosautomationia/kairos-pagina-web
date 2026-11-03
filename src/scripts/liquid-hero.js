// Liquid shader for the hero. Based on "WebGL Liquid" by @componentry (21st.dev, id 18531),
// ported to plain JS and recolored to the KAIROS logo: highlights drift from cyan to violet.
const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorHighlight;
uniform vec3 u_colorAccent;
uniform float u_speed;
uniform float u_flowStrength;
uniform float u_grain;
uniform float u_contrast;
uniform float u_opacity;
uniform float u_reveal;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.86, 0.51, -0.51, 0.86);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * (0.14 * u_speed);
  vec2 aspect = vec2(u_res.x / max(u_res.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  vec2 flowP = vec2(p.x * 1.1, p.y - t * 0.35);
  float n1 = fbm(flowP * 2.8 + vec2(0.0, t * 0.2));
  float n2 = fbm((flowP + n1 * 0.45) * 4.0 - vec2(0.0, t * 0.35));
  float n3 = fbm((flowP + n2 * 0.4) * 6.5 + vec2(t * 0.15, 0.0));

  float structure = n3 * 1.15 + (n2 - 0.5) * 0.5;
  structure += (n1 - 0.5) * 0.3 * u_flowStrength;

  float lowBand = smoothstep(0.18, 0.6, structure);
  float highBand = smoothstep(0.62, 1.08, structure);
  vec3 highlight = mix(u_colorHighlight, u_colorAccent, smoothstep(0.1, 0.95, uv.x + (n1 - 0.5) * 0.35));
  vec3 col = mix(u_colorDeep, u_colorMid, lowBand);
  col = mix(col, highlight, highBand);

  float glow = smoothstep(0.52, 0.95, structure) * (0.35 + 0.5 * u_flowStrength);
  col += glow * highlight * 0.3;

  float verticalMask = pow(smoothstep(0.78, 0.02, uv.y), 1.2);
  float vignette = smoothstep(1.28, 0.36, length(uv - 0.5));
  col *= mix(0.9, 1.05, vignette);
  col = clamp((col - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  col += (hash(gl_FragCoord.xy + t * 10.0) - 0.5) * u_grain;

  float alpha = verticalMask * smoothstep(0.08, 0.95, structure);
  alpha *= smoothstep(0.0, 0.28, u_reveal - uv.x);
  alpha *= u_opacity;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`

const COLORS = {
  deep: '#0a0d1c',
  mid: '#1f2a78',
  highlight: '#5ad7ee',
  accent: '#a86be0',
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function start(host) {
  const canvas = host.querySelector('canvas')
  const gl = canvas?.getContext('webgl', { antialias: false, alpha: true })
  if (!canvas || !gl) return

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const u = (name) => gl.getUniformLocation(program, name)
  gl.uniform3fv(u('u_colorDeep'), rgb(COLORS.deep))
  gl.uniform3fv(u('u_colorMid'), rgb(COLORS.mid))
  gl.uniform3fv(u('u_colorHighlight'), rgb(COLORS.highlight))
  gl.uniform3fv(u('u_colorAccent'), rgb(COLORS.accent))
  gl.uniform1f(u('u_speed'), 0.9)
  gl.uniform1f(u('u_flowStrength'), 1)
  gl.uniform1f(u('u_grain'), 0.045)
  gl.uniform1f(u('u_contrast'), 1.08)
  gl.uniform1f(u('u_opacity'), 0.85)
  const uRes = u('u_res')
  const uTime = u('u_time')
  const uReveal = u('u_reveal')

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const smallScreen = window.matchMedia('(max-width: 700px)')

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2) * (smallScreen.matches ? 0.6 : 0.85)
    const { width, height } = host.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(width * scale))
    canvas.height = Math.max(1, Math.floor(height * scale))
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uRes, canvas.width, canvas.height)
  }

  const draw = (seconds, reveal) => {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(uTime, seconds)
    gl.uniform1f(uReveal, reveal)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  resize()
  new ResizeObserver(() => {
    resize()
    if (reducedMotion) draw(7, 1)
  }).observe(host)

  host.classList.add('is-live')
  if (reducedMotion) {
    draw(7, 1)
    return
  }

  const begin = performance.now()
  let frame = 0
  let visible = true
  const tick = (now) => {
    const seconds = Math.max(0, (now - begin - 150) / 1000)
    draw(seconds, Math.min(1, seconds / 1.4))
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

document.querySelectorAll('[data-liquid]').forEach(start)
