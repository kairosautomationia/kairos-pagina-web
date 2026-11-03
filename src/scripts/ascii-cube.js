// ASCII cube in the process section. Port of "ASCII Cube" by @montekkundan (21st.dev, id 2513) from React state
// to a canvas, so it does not rebuild a 7,000-node tree every frame. Faces take the logo colors.
const host = document.querySelector('[data-ascii-cube]')

if (host) {
  const canvas = host.querySelector('canvas')
  const context = canvas.getContext('2d')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const W = 120
  const H = 60
  const CELL_W = 6
  const CELL_H = 10
  const CUBE = 1.32
  const DISTANCE = 4
  const K1 = 27
  const STEP = 0.024
  const faceChars = ['@', '$', '~', '#', ';', '+']
  const faceColors = ['#5ad7ee', '#8191e7', '#a86be0', '#5ad7ee', '#8191e7', '#a86be0']
  const normals = [[0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 1, 0]]
  const corners = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map((c) => c.map((n) => n * CUBE))
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]

  canvas.width = W * CELL_W
  canvas.height = H * CELL_H
  context.font = `bold ${CELL_H}px "Courier New", monospace`
  context.textBaseline = 'top'

  const draw = (A, B, C) => {
    const zbuf = new Float32Array(W * H)
    const chars = new Array(W * H)
    const colors = new Array(W * H)
    const rotate = (i, j, k) => {
      const x1 = i * Math.cos(C) - j * Math.sin(C)
      const y1 = i * Math.sin(C) + j * Math.cos(C)
      const y2 = y1 * Math.cos(A) - k * Math.sin(A)
      const z2 = y1 * Math.sin(A) + k * Math.cos(A)
      return [z2 * Math.sin(B) + x1 * Math.cos(B), y2, z2 * Math.cos(B) - x1 * Math.sin(B)]
    }
    const plot = (x, y, z, char, color, bias = 0) => {
      const ooz = 1 / (z + DISTANCE)
      const xp = Math.floor(W / 2 + K1 * ooz * x * 2)
      const yp = Math.floor(H / 2 + K1 * ooz * y)
      if (xp < 0 || xp >= W || yp < 0 || yp >= H) return
      const index = xp + yp * W
      if (ooz + bias > zbuf[index]) {
        zbuf[index] = ooz + bias
        chars[index] = char
        colors[index] = color
      }
    }

    for (let face = 0; face < 6; face++) {
      const [ni, nj, nk] = normals[face]
      const nz = -ni * Math.sin(B) + nj * Math.sin(A) * Math.cos(B) + nk * Math.cos(A) * Math.cos(B)
      if (nz > 0) continue
      for (let u = -CUBE; u < CUBE; u += STEP) {
        for (let v = -CUBE; v < CUBE; v += STEP) {
          let i = 0
          let j = 0
          let k = 0
          if (face === 0) { i = u; j = v; k = -CUBE }
          else if (face === 1) { i = CUBE; j = v; k = u }
          else if (face === 2) { i = -CUBE; j = v; k = -u }
          else if (face === 3) { i = -u; j = v; k = CUBE }
          else if (face === 4) { i = u; j = -CUBE; k = -v }
          else { i = u; j = CUBE; k = v }
          const [x, y, z] = rotate(i, j, k)
          plot(x, y, z, faceChars[face], faceColors[face])
        }
      }
    }
    for (const [a, b] of edges) {
      const from = rotate(...corners[a])
      const to = rotate(...corners[b])
      for (let s = 0; s <= 160; s++) {
        const t = s / 160
        plot(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t, '+', '#e9ecf4', 1e-6)
      }
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    for (let index = 0; index < chars.length; index++) {
      if (!chars[index]) continue
      context.fillStyle = colors[index]
      context.fillText(chars[index], (index % W) * CELL_W, Math.floor(index / W) * CELL_H)
    }
  }

  let A = 0.5
  let B = 0.4
  let C = 0
  let frame = 0
  let last = 0
  const tick = (now) => {
    if (now - last > 40) {
      last = now
      A += 0.03
      B += 0.02
      C += 0.008
      draw(A, B, C)
    }
    frame = requestAnimationFrame(tick)
  }
  draw(A, B, C)
  host.classList.add('is-live')
  if (!reducedMotion) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame && !document.hidden) frame = requestAnimationFrame(tick)
      else if (!entry.isIntersecting) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }).observe(host)
  }
}
