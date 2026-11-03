// Pointer-driven 3D tilt with a soft spotlight. Only for mouse users who have not asked for reduced motion.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (canHover && !reduceMotion) {
  document.querySelectorAll('[data-tilt]').forEach((element) => {
    const max = Number(element.dataset.tilt) || 6
    element.addEventListener('pointermove', (event) => {
      const box = element.getBoundingClientRect()
      const x = (event.clientX - box.left) / box.width
      const y = (event.clientY - box.top) / box.height
      element.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`)
      element.style.setProperty('--rx', `${-(y - 0.5) * max * 2}deg`)
      element.style.setProperty('--mx', `${x * 100}%`)
      element.style.setProperty('--my', `${y * 100}%`)
      element.classList.add('is-tilting')
    })
    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--rx')
      element.style.removeProperty('--ry')
      element.classList.remove('is-tilting')
    })
  })
}
