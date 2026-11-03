// The form has no server: it checks the fields and opens WhatsApp with the message already written.
const form = document.querySelector('[data-contact-form]')

if (form) {
  const whatsapp = form.dataset.whatsapp
  const status = form.querySelector('[data-form-status]')
  const fields = [...form.querySelectorAll('[data-field]')]

  const setError = (field, message) => {
    const holder = field.closest('.field')
    holder?.classList.toggle('has-error', Boolean(message))
    const note = holder?.querySelector('.field-error')
    if (note) note.textContent = message
    field.setAttribute('aria-invalid', message ? 'true' : 'false')
  }

  fields.forEach((field) => field.addEventListener('input', () => setError(field, '')))

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    let firstInvalid = null
    for (const field of fields) {
      const value = field.value.trim()
      let message = ''
      if (field.required && !value) message = 'Este dato es necesario.'
      else if (field.name === 'contacto' && value.replace(/\D/g, '').length < 7) message = 'Escribe un número de WhatsApp válido.'
      setError(field, message)
      if (message && !firstInvalid) firstInvalid = field
    }
    if (firstInvalid) {
      firstInvalid.focus()
      if (status) status.textContent = 'Revisa los datos marcados.'
      return
    }

    const data = Object.fromEntries(new FormData(form))
    const company = data.empresa ? ` de ${String(data.empresa).trim()}` : ''
    const text = [
      `Hola KAIROS, soy ${String(data.nombre).trim()}${company}.`,
      `Quiero resolver esto: ${String(data.problema).trim()}`,
      `Mi WhatsApp: ${String(data.contacto).trim()}`,
    ].join('\n')
    if (status) status.textContent = 'Abriendo WhatsApp con tu mensaje listo.'
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  })
}
