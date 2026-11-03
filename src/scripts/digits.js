// Odometer digits: each digit is a 0-9 column that rolls to its value when it scrolls into view.
const targets = document.querySelectorAll('[data-digits]')

targets.forEach((element) => {
  const value = element.dataset.digits ?? ''
  const suffix = element.dataset.suffix ?? ''
  element.setAttribute('role', 'text')
  element.setAttribute('aria-label', value + suffix)
  element.textContent = ''

  const columns = []
  ;[...value].forEach((character, index) => {
    const digit = document.createElement('span')
    digit.className = 'digit'
    digit.setAttribute('aria-hidden', 'true')
    const column = document.createElement('span')
    column.className = 'digit-col'
    column.style.setProperty('--d', `${index * 110}ms`)
    for (let n = 0; n < 10; n++) {
      const cell = document.createElement('span')
      cell.textContent = String(n)
      column.append(cell)
    }
    digit.append(column)
    element.append(digit)
    columns.push([column, Number(character)])
  })

  if (suffix) {
    const tail = document.createElement('span')
    tail.className = 'digits-suffix'
    tail.setAttribute('aria-hidden', 'true')
    tail.textContent = suffix
    element.append(tail)
  }

  const roll = () => columns.forEach(([column, n]) => column.style.setProperty('--n', String(n)))
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    roll()
    return
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    roll()
    observer.disconnect()
  }, { threshold: 0.6 })
  observer.observe(element)
})
