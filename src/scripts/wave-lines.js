// Silky lines that part around the pointer. Based on "Wave Lines" by @balick (21st.dev, id 39083),
// ported to plain JS. The lines take the CSS color of the canvas.
function start(canvas) {
  const context = canvas.getContext('2d')
  const parent = canvas.parentElement
  if (!context || !parent) return

  const lines = Number(canvas.dataset.lines || 30)
  const amplitude = Number(canvas.dataset.amplitude || 26)
  const speed = Number(canvas.dataset.speed || 1)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let width = 0
  let height = 0
  let frame = 0
  let visible = true
  let time = 0
  let last = 0
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, target: 0 }

  const draw = () => {
    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.strokeStyle = getComputedStyle(canvas).color
    context.lineWidth = 1
    const gap = height / lines
    const reach = Math.min(width, height) / 4
    for (let line = 0; line < lines; line++) {
      const base = (line + 0.5) * gap
      context.globalAlpha = 0.1 + 0.4 * Math.sin((Math.PI * (line + 0.5)) / lines)
      context.beginPath()
      for (let x = -8; x <= width + 8; x += 8) {
        let y =
          base +
          amplitude * Math.sin(x * 0.004 + time * 0.6 + line * 0.18) * Math.cos(x * 0.0017 - time * 0.35 + line * 0.07) +
          amplitude * 0.35 * Math.sin(x * 0.011 - time * 0.9 + line * 0.33)
        if (pointer.strength > 0.001) {
          const dx = x - pointer.x
          const dy = y - pointer.y
          const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * reach * reach))
          y += Math.sign(dy || 1) * falloff * reach * 0.6 * pointer.strength
        }
        if (x === -8) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.stroke()
    }
    context.globalAlpha = 1
  }

  const resize = () => {
    const ratio = window.devicePixelRatio || 1
    const bounds = canvas.getBoundingClientRect()
    width = bounds.width
    height = bounds.height
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    draw()
  }

  const tick = (now) => {
    const elapsed = Math.min((now - last) / 1000, 0.1)
    last = now
    time += elapsed * speed
    const ease = 1 - Math.exp(-elapsed * 6)
    pointer.x += (pointer.targetX - pointer.x) * ease
    pointer.y += (pointer.targetY - pointer.y) * ease
    pointer.strength += (pointer.target - pointer.strength) * ease
    draw()
    frame = requestAnimationFrame(tick)
  }
  const run = () => {
    if (reduceMotion || !visible || frame) return
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }
  const stop = () => {
    cancelAnimationFrame(frame)
    frame = 0
  }

  new ResizeObserver(resize).observe(canvas)
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    visible ? run() : stop()
  }).observe(canvas)

  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    parent.addEventListener('pointermove', (event) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.targetX = event.clientX - bounds.left
      pointer.targetY = event.clientY - bounds.top
      if (pointer.target === 0) {
        pointer.x = pointer.targetX
        pointer.y = pointer.targetY
      }
      pointer.target = 1
    })
    parent.addEventListener('pointerleave', () => { pointer.target = 0 })
  }

  resize()
  run()
}

document.querySelectorAll('canvas[data-wave]').forEach(start)
