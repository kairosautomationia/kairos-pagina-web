// Magnetic buttons: while the pointer is over the button it drifts toward the cursor and springs back on leave.
// Port of "Magnetic Button" by @bundui (21st.dev, id 1507) without Framer Motion. Uses the `translate` property so it
// never fights the hover/press transforms. Fine pointer and full motion only.
if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    const pull = Number(button.dataset.magnetic) || 0.35
    const current = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    let hovered = false
    let frame = 0

    const tick = () => {
      current.x += (target.x - current.x) * 0.16
      current.y += (target.y - current.y) * 0.16
      button.style.translate = `${current.x.toFixed(2)}px ${current.y.toFixed(2)}px`
      const settled = !hovered && Math.abs(current.x) < 0.05 && Math.abs(current.y) < 0.05
      if (settled) {
        button.style.translate = ''
        frame = 0
        return
      }
      frame = requestAnimationFrame(tick)
    }
    const run = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const follow = (event) => {
      const box = button.getBoundingClientRect()
      target.x = (event.clientX - (box.left + box.width / 2)) * pull
      target.y = (event.clientY - (box.top + box.height / 2)) * pull
    }

    button.addEventListener('pointerenter', (event) => {
      hovered = true
      follow(event)
      run()
    })
    button.addEventListener('pointermove', follow)
    button.addEventListener('pointerleave', () => {
      hovered = false
      target.x = 0
      target.y = 0
      run()
    })
  })
}
