// Border beam: a light that travels around a card's border. Port of "Border Beam" by @badtzx0 (21st.dev, id 5001).
// The animation is pure CSS (offset-path); this only gives each beam its settings and the path for its current size.
// Usage: <div class="beam" data-beam data-color="#5ad7ee" data-width="320" data-duration="9"><i></i></div> inside a positioned card.
document.querySelectorAll('[data-beam]').forEach((beam) => {
  const { color = '#ffffff', width = '300', duration = '10' } = beam.dataset
  beam.style.setProperty('--beam-color', color)
  beam.style.setProperty('--beam-light', `${width}px`)
  beam.style.setProperty('--beam-duration', `${duration}s`)
  const update = () => beam.style.setProperty('--path', `path("M 0 0 H ${beam.offsetWidth} V ${beam.offsetHeight} H 0 V 0")`)
  update()
  new ResizeObserver(update).observe(beam)
})
