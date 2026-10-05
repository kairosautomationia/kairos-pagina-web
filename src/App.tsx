import { Suspense, lazy, useEffect, useState } from 'react'

const BrandScene = lazy(() => import('./BrandScene'))

const BOOKING_URL = 'https://cal.com/kairos-buppna/kairos-lab-de-ia'

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className={`brand-lockup${footer ? ' brand-lockup--footer' : ''}`} href="#inicio" aria-label="KAIROS — inicio">
      <img src="/Documentos/fondo%20definitivo.png" alt="" />
      <span><strong>KAIROS</strong><small>AUTOMATION · IA</small></span>
    </a>
  )
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span className="arrow-mark" aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('motion-ready')
    const update = () => setScrolled(window.scrollY > 20)
    update()
    window.addEventListener('scroll', update, { passive: true })

    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if ('IntersectionObserver' in window && !reducedMotion) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' })
      elements.forEach((element) => revealObserver.observe(element))
      return () => {
        window.removeEventListener('scroll', update)
        revealObserver.disconnect()
      }
    }

    elements.forEach((element) => element.classList.add('is-visible'))
    return () => window.removeEventListener('scroll', update)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
        <div className="header-inner">
          <Brand />
          <button
            className={`menu-toggle${menuOpen ? ' menu-toggle--open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span />
          </button>
          <nav className={`main-menu${menuOpen ? ' main-menu--open' : ''}`} id="main-menu" aria-label="Navegación principal">
            <a href="#nosotros" onClick={closeMenu}>Nosotros</a>
            <a href="#servicios" onClick={closeMenu}>Servicios</a>
            <a href="#caso-exito" onClick={closeMenu}>Caso de éxito</a>
            <a href="#proceso" onClick={closeMenu}>Proceso</a>
            <a className="header-cta" href={BOOKING_URL} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
              Agendar una cita <Arrow diagonal />
            </a>
          </nav>
        </div>
      </header>

      <main id="contenido">
        <section className="hero" id="inicio">
          <div className="hero-blueprint" aria-hidden="true" />
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-layout page-shell">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> Hecho a tu medida · Implementado por nosotros</p>
              <h1>Recupera el control de tu negocio<span className="highlight">.</span></h1>
              <p className="hero-subtitle">Deja de apagar incendios a las <span className="highlight">11 de la noche.</span></p>
              <p className="hero-description">Del diagnóstico a la solución: IA que transforma problemas en soluciones. Empezamos entendiendo tu operación; luego, elegimos y hacemos funcionar la tecnología que necesita.</p>
              <div className="hero-actions">
                <a className="button button-primary" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Hablemos de tu empresa <Arrow diagonal /></a>
                <a className="button button-text" href="diagnostico.html">Explora tu preparación para IA <Arrow /></a>
              </div>
              <div className="hero-proof"><span className="proof-rule" /> Primero entendemos. Después construimos.</div>
            </div>

            <div className="hero-visual" data-reveal>
              <div className="visual-kicker"><span>01</span> / EL SISTEMA KAIROS</div>
              <Suspense fallback={<div className="scene-pending"><img src="/Documentos/Logo%20final.png" alt="" /></div>}>
                <BrandScene />
              </Suspense>
              <div className="visual-caption"><span>PROCESOS</span><i /><span>INTELIGENCIA</span><i /><span>ACCIÓN</span></div>
              <span className="visual-coordinate" aria-hidden="true">K—IA / 001</span>
            </div>
          </div>
          <div className="hero-footer page-shell"><span>AMBATO · ECUADOR</span><span className="hero-footer-center">SISTEMATIZAR EL TRABAJO PARA HACERLO AVANZAR</span><a href="#nosotros">Conoce KAIROS <span aria-hidden="true">↓</span></a></div>
        </section>

        <section className="about section-pad" id="nosotros">
          <div className="page-shell about-layout">
            <div className="section-index" data-reveal><span>01</span><i /> QUIÉNES SOMOS</div>
            <div className="about-content" data-reveal>
              <p className="section-kicker">Inteligencia artificial, con los pies en tu operación</p>
              <h2>Un lab de IA que convierte <span className="gradient-ink">problemas en soluciones.</span></h2>
              <p className="about-description">En KAIROS ayudamos a empresas a identificar, sistematizar y resolver procesos que consumen tiempo, generan errores o limitan su crecimiento, mediante inteligencia artificial y automatización.</p>
              <div className="about-principle"><span className="principle-icon">↳</span><p>No empezamos por la tecnología.<br /><strong>Empezamos por el problema.</strong></p><span className="principle-note">NUESTRO ENFOQUE</span></div>
              <div className="work-flow" aria-label="Entender, encontrar la oportunidad y ponerla en marcha">
                <div><span>01</span><b>Entender</b></div><i aria-hidden="true">⟶</i><div><span>02</span><b>Encontrar la oportunidad</b></div><i aria-hidden="true">⟶</i><div><span>03</span><b>Ponerla en marcha</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="services section-pad" id="servicios">
          <div className="page-shell">
            <div className="section-index" data-reveal><span>02</span><i /> QUÉ HACEMOS</div>
            <div className="section-heading" data-reveal>
              <div><p className="section-kicker">La solución correcta para el reto real</p><h2>Tres motores para<br /><span className="gradient-ink">transformar tu negocio.</span></h2></div>
              <p>Todo empieza con un diagnóstico. A partir de ahí, definimos el camino que mejor resuelve el problema: una implementación a medida o una de nuestras aplicaciones propias.</p>
            </div>
            <div className="service-grid">
              <article className="service-card service-card--lead" data-reveal>
                <div className="service-card-head"><span>01 / IMPLEMENTACIÓN</span><span className="service-card-code">KS—01</span></div>
                <div className="service-art service-art--flow" aria-hidden="true">
                  <svg viewBox="0 0 520 160" fill="none" role="presentation"><path d="M18 80h103l37-42h74l36 42h53l42-45h117" stroke="url(#flow-a)" strokeWidth="2"/><path d="M18 80h103l37 42h74l36-42h53l42 45h117" stroke="url(#flow-b)" strokeWidth="2"/><path d="M119 80V28m0 104V80m149 0V29m53 51v-52m0 104V80" stroke="url(#flow-c)" strokeWidth="1.5"/><circle cx="18" cy="80" r="5" fill="#66d9ed"/><circle cx="473" cy="35" r="5" fill="#a88afa"/><circle cx="473" cy="125" r="5" fill="#66d9ed"/><circle cx="268" cy="80" r="7" fill="#10111b" stroke="#a88afa" strokeWidth="2"/><defs><linearGradient id="flow-a" x1="18" y1="44" x2="473" y2="44" gradientUnits="userSpaceOnUse"><stop stopColor="#47cfe2"/><stop offset="1" stopColor="#ad82fb"/></linearGradient><linearGradient id="flow-b" x1="18" y1="80" x2="473" y2="125" gradientUnits="userSpaceOnUse"><stop stopColor="#47cfe2"/><stop offset="1" stopColor="#ad82fb"/></linearGradient><linearGradient id="flow-c" x1="119" y1="29" x2="268" y2="132" gradientUnits="userSpaceOnUse"><stop stopColor="#47cfe2"/><stop offset="1" stopColor="#ad82fb"/></linearGradient></defs></svg>
                  <span className="diagram-label diagram-label--left">SEÑAL</span><span className="diagram-label diagram-label--right">FLUJO</span>
                </div>
                <div className="service-card-body"><span className="service-type">DIAGNÓSTICO + IMPLEMENTACIÓN</span><h3>KAIROS Solution</h3><p>Es la capa de diagnóstico e implementación: tu punto de entrada. Recibimos tu negocio, identificamos el problema real y decidimos si la solución correcta es una aplicación propia ya lista o un desarrollo a medida. Lo construimos, integramos y lo dejamos funcionando; tú solo lo operas.</p><ul className="feature-list"><li>Bot de WhatsApp con IA</li><li>Automatización de finanzas</li><li>Marketing con agentes de IA</li><li>Integración con tus sistemas</li></ul><a className="card-link" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Solicitar una conversación <Arrow diagonal /></a></div>
                <div className="service-card-foot"><span>ENTENDER → DISEÑAR → IMPLEMENTAR</span><span>DISPONIBLE</span></div>
              </article>
              <article className="service-card service-card--product" data-reveal>
                <div className="service-card-head"><span>02 / APLICACIÓN PROPIA</span><span className="coming-tag"><i /> EN DESARROLLO</span></div>
                <div className="service-art service-art--kamira" aria-hidden="true"><div className="kamira-frame"><i /><i /><i /></div><span className="kamira-orbit kamira-orbit--a" /><span className="kamira-orbit kamira-orbit--b" /><span className="orbital-label">KÁ—02</span></div>
                <div className="service-card-body"><span className="service-type">SOFTWARE BAJO SUSCRIPCIÓN</span><h3>KÁMIRA</h3><p>Una aplicación propia, nacida de los problemas reales que más se repiten en los diagnósticos a PyMEs de Ecuador. Una forma directa de empezar, sin desarrollo a medida.</p><p className="product-footnote">Hecha para convertir procesos cotidianos en trabajo más claro.</p></div>
                <div className="service-card-foot"><span>PRODUCTO KAIROS</span><span>01 / 02</span></div>
              </article>
              <article className="service-card service-card--product" data-reveal>
                <div className="service-card-head"><span>03 / APLICACIÓN PROPIA</span><span className="coming-tag"><i /> EN DESARROLLO</span></div>
                <div className="service-art service-art--iondu" aria-hidden="true"><div className="iondu-mark"><span /><i /><i /><i /></div><span className="orbital-label">IO—03</span></div>
                <div className="service-card-body"><span className="service-type">SOFTWARE BAJO SUSCRIPCIÓN</span><h3>IONDU</h3><p>Nuestra segunda aplicación propia, también por suscripción. Igual que KÁMIRA, se mantiene y mejora de forma continua para que tu negocio no dependa de un desarrollo cerrado que se queda obsoleto.</p><p className="product-footnote">Diseñada para crecer junto con tu operación.</p></div>
                <div className="service-card-foot"><span>PRODUCTO KAIROS</span><span>02 / 02</span></div>
              </article>
            </div>
            <p className="service-note" data-reveal><span>✳</span> KÁMIRA e IONDU están en desarrollo. KAIROS Solution ya puede comenzar con el diagnóstico de tu empresa.</p>
          </div>
        </section>

        <section className="case-study section-pad" id="caso-exito">
          <div className="page-shell">
            <div className="section-index" data-reveal><span>03</span><i /> RESULTADOS REALES</div>
            <div className="case-layout">
              <div className="case-copy" data-reveal>
                <p className="section-kicker">Un cambio en el día a día</p>
                <h2>Deja de operar tu negocio.<br /><span className="gradient-ink">Empieza a hacerlo crecer.</span></h2>
                <p className="case-description">Cake Art recuperó tiempo para enfocarse en hacer crecer el negocio, al sistematizar parte de su operación.</p>
                <div className="case-metric"><span>+</span><strong>20</strong><em>h</em><p>recuperadas<br />cada semana</p></div>
                <p className="case-detail">El siguiente caso de éxito podrías ser tú. Cuéntanos qué parte de tu operación te gustaría transformar.</p>
                <a className="button button-text" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Conversemos sobre tu operación <Arrow diagonal /></a>
              </div>
              <figure className="case-visual" data-reveal>
                <div className="case-photo"><img src="/Documentos/Caso%20de%20exito.jpeg" alt="Presentación del caso de éxito de Cake Art" loading="lazy" /><span className="case-corner case-corner--tl" /><span className="case-corner case-corner--br" /></div>
                <figcaption><span>CASO DE ÉXITO / 01</span><span>CAKE ART · ECUADOR</span></figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="process section-pad" id="proceso">
          <div className="page-shell process-layout">
            <div className="process-intro" data-reveal>
              <div className="section-index"><span>04</span><i /> NUESTRO PROCESO</div>
              <p className="section-kicker">Tres pasos. El problema primero.</p>
              <h2>Del diagnóstico<br />a la <span className="gradient-ink">solución.</span></h2>
              <p>Trabajamos contigo para entender el contexto, escoger una buena respuesta y dejarla integrada a la operación.</p>
              <a className="button button-outline" href="diagnostico.html">Conoce tu punto de partida <Arrow /></a>
            </div>
            <div className="process-steps">
              <article className="process-step" data-reveal><span className="step-node">01</span><div><small>ESCUCHAR Y ANALIZAR</small><h3>Entendemos tu empresa</h3><p>Entendemos tus procesos, identificamos cuellos de botella y oportunidades de mejora.</p></div><span className="step-symbol" aria-hidden="true">⌕</span></article>
              <article className="process-step" data-reveal><span className="step-node">02</span><div><small>ELEGIR EL CAMINO</small><h3>Definimos la solución ideal</h3><p>Determinamos si encaja con una de nuestras aplicaciones o si requiere una solución a medida para tu empresa.</p></div><span className="step-symbol" aria-hidden="true">◇</span></article>
              <article className="process-step" data-reveal><span className="step-node">03</span><div><small>INTEGRAR Y CRECER</small><h3>Sistematizamos contigo</h3><p>Implementamos la solución en tu empresa para que sea parte real de tu operación y genere resultados medibles.</p></div><span className="step-symbol" aria-hidden="true">↗</span></article>
              <div className="steps-rail" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="diagnostic-callout section-pad" id="diagnostico">
          <div className="page-shell diagnostic-layout" data-reveal>
            <div className="diagnostic-icon" aria-hidden="true"><span className="diag-track diag-track--a" /><span className="diag-track diag-track--b" /><i>✓</i></div>
            <div className="diagnostic-copy"><p className="section-kicker">Tu punto de partida</p><h2>Entiende qué tan lista está tu empresa para <span className="gradient-ink">aprovechar la IA.</span></h2><p>Evalúa áreas clave de tu empresa y recibe recomendaciones para decidir qué hacer primero.</p></div>
            <a className="button button-primary" href="diagnostico.html">Empieza tu diagnóstico <Arrow diagonal /></a>
          </div>
        </section>

        <section className="final-cta">
          <div className="cta-grid" aria-hidden="true" />
          <span className="cta-orbit cta-orbit--one" aria-hidden="true" /><span className="cta-orbit cta-orbit--two" aria-hidden="true" />
          <div className="page-shell final-cta-content" data-reveal>
            <p className="section-kicker"><span className="eyebrow-dot" /> EL SIGUIENTE PASO EMPIEZA CONTIGO</p>
            <h2>¿Qué parte de tu negocio<br />te gustaría hacer <span className="gradient-ink">avanzar?</span></h2>
            <p>Hablemos de tu empresa y de lo que hoy está frenando su crecimiento.</p>
            <a className="button button-primary" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Agendar una conversación <Arrow diagonal /></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-main">
          <Brand footer />
          <p>Un lab de IA que convierte<br />problemas en soluciones.</p>
          <div className="footer-links"><a href="https://wa.me/593998730180" target="_blank" rel="noopener noreferrer">WhatsApp <Arrow diagonal /></a><a href="https://www.linkedin.com/company/kairos%E2%94%82automation-ia/posts/?feedView=all" target="_blank" rel="noopener noreferrer">LinkedIn <Arrow diagonal /></a><a href="https://www.instagram.com/kairos.automation.lab" target="_blank" rel="noopener noreferrer">Instagram <Arrow diagonal /></a></div>
        </div>
        <div className="page-shell footer-legal"><span>© 2026 KAIROS · AMBATO, ECUADOR</span><a href="https://kairosautomationia.com" target="_blank" rel="noopener noreferrer">KAIROS AUTOMATION <Arrow diagonal /></a></div>
      </footer>
      <a href="https://wa.me/593998730180" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Escribe a KAIROS por WhatsApp">✆</a>
    </>
  )
}
