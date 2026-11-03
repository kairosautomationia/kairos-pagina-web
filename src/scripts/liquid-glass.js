// Liquid glass: panels that bend whatever is behind them. Port of "Liquid Glass" by @manuarora700 (21st.dev, id 40333)
// from React to a plain script. A Snell's-law displacement map is drawn on a canvas and fed to an SVG filter used as
// `backdrop-filter`. Chromium refracts; Safari, Firefox and reduced-transparency fall back to frosted glass.
// Usage: <div data-glass data-radius="20" data-bevel="16" data-scale="30" data-aberration="3" data-frost="0.4" data-tint="0.06">
const hosts = [...document.querySelectorAll('[data-glass]')]

if (hosts.length) {
  const supportsUrlBackdrop = () => typeof CSS !== 'undefined' && CSS.supports && (CSS.supports('backdrop-filter', 'url(#x)') || CSS.supports('-webkit-backdrop-filter', 'url(#x)'))
  const safariLike = () => /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/.test(navigator.userAgent)
  const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches

  const sdRoundedBox = (px, py, halfW, halfH, r) => {
    const qx = Math.abs(px) - halfW + r
    const qy = Math.abs(py) - halfH + r
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
  }

  // Squircle dome slope converted to a Snell's-law bend. x = 0 at the rim, 1 at the center.
  const bendFromDepth = (x) => {
    const u = 1 - Math.min(1, Math.max(0, x))
    const denom = (1 - u ** 4) ** 0.75
    if (denom < 1e-6) return 0
    const thetaI = Math.atan(Math.min(u ** 3 / denom, 8))
    const sinT = Math.sin(thetaI) / 1.5
    if (sinT >= 1) return Math.sin(thetaI)
    return Math.sin(thetaI - Math.asin(sinT))
  }

  const buildPhiTable = (bevelPx) => {
    const n = Math.max(1, Math.ceil(bevelPx))
    const phi = new Float32Array(n + 1)
    for (let d = 1; d <= n; d++) phi[d] = phi[d - 1] + bendFromDepth(d / n)
    return phi
  }

  const samplePhi = (phi, depth) => {
    const max = phi.length - 1
    if (depth <= 0) return phi[0]
    if (depth >= max) return phi[max]
    const i = Math.floor(depth)
    const f = depth - i
    return phi[i] * (1 - f) + phi[i + 1] * f
  }

  // R = horizontal bend, G = vertical bend, B = rim specular, A = shape mask. 128 means no displacement.
  const computeDisplacement = ({ width, height, radius, bevelDepth, dpr }) => {
    const gain = 1.35
    const light = { x: -0.55, y: -0.85 }
    const lightLen = Math.hypot(light.x, light.y) || 1
    const lx = light.x / lightLen
    const ly = light.y / lightLen
    const W = Math.max(1, Math.round(width * dpr))
    const H = Math.max(1, Math.round(height * dpr))
    const halfW = W / 2
    const halfH = H / 2
    const r = Math.min(radius * dpr, halfW, halfH)
    const bevel = Math.max(1, bevelDepth * dpr)
    const phi = buildPhiTable(bevel)

    const field = new Float32Array(W * H)
    for (let y = 0; y < H; y++) {
      const py = y - halfH + 0.5
      for (let x = 0; x < W; x++) {
        const d = sdRoundedBox(x - halfW + 0.5, py, halfW, halfH, r)
        field[y * W + x] = d > 0 ? 0 : samplePhi(phi, Math.min(bevel, -d))
      }
    }

    const data = new Uint8ClampedArray(W * H * 4)
    for (let y = 0; y < H; y++) {
      const py = y - halfH + 0.5
      for (let x = 0; x < W; x++) {
        const px = x - halfW + 0.5
        const i = (y * W + x) << 2
        const d = sdRoundedBox(px, py, halfW, halfH, r)
        if (d > 0) {
          data[i] = data[i + 1] = data[i + 2] = 128
          data[i + 3] = 0
          continue
        }
        const x0 = Math.max(0, x - 1)
        const x1 = Math.min(W - 1, x + 1)
        const y0 = Math.max(0, y - 1)
        const y1 = Math.min(H - 1, y + 1)
        const dPhiX = (field[y * W + x1] - field[y * W + x0]) / (x1 - x0 || 1)
        const dPhiY = (field[y1 * W + x] - field[y0 * W + x]) / (y1 - y0 || 1)
        const dx = Math.max(-1, Math.min(1, dPhiX * gain))
        const dy = Math.max(-1, Math.min(1, dPhiY * gain))

        let specular = 0
        if (d >= -bevel) {
          const gx = sdRoundedBox(px + 1, py, halfW, halfH, r) - sdRoundedBox(px - 1, py, halfW, halfH, r)
          const gy = sdRoundedBox(px, py + 1, halfW, halfH, r) - sdRoundedBox(px, py - 1, halfW, halfH, r)
          const len = Math.hypot(gx, gy) || 1
          const dot = (gx / len) * lx + (gy / len) * ly
          const rim = 1 - Math.min(1, -d / bevel)
          specular = (Math.max(0, dot) + Math.max(0, -dot) * 0.35) * rim
        }
        data[i] = 128 + dx * 127
        data[i + 1] = 128 + dy * 127
        data[i + 2] = Math.round(specular * 255)
        data[i + 3] = 255
      }
    }
    return { data, width: W, height: H }
  }

  const mapBlobUrl = async (options) => {
    const { data, width, height } = computeDisplacement(options)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').putImageData(new ImageData(data, width, height), 0, 0)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('displacement map failed')
    return URL.createObjectURL(blob)
  }

  const filterSvg = ({ id, mapUrl, width, height, scale, aberration, frost }) => {
    const pad = Math.ceil(scale + aberration + 4)
    const px = (pad / Math.max(1, width)) * 100
    const py = (pad / Math.max(1, height)) * 100
    const region = `x="-${px.toFixed(3)}%" y="-${py.toFixed(3)}%" width="${(100 + 2 * px).toFixed(3)}%" height="${(100 + 2 * py).toFixed(3)}%"`
    const map = `<feImage href="${mapUrl}" xlink:href="${mapUrl}" x="0" y="0" width="${width}" height="${height}" result="map" preserveAspectRatio="none"/>`
    const displace = (s, result) => `<feDisplacementMap in="SourceGraphic" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="G" result="${result}"/>`
    const body = aberration <= 0
      ? displace(scale, 'rgb')
      : `${displace(scale + aberration, 'dispR')}
  <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>
  ${displace(scale, 'dispG')}
  <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>
  ${displace(Math.max(0, scale - aberration), 'dispB')}
  <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>
  <feBlend in="red" in2="green" mode="screen" result="rg"/>
  <feBlend in="rg" in2="blue" mode="screen" result="rgb"/>`
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="${id}" color-interpolation-filters="sRGB" ${region}>
  ${map}
  ${body}
  <feGaussianBlur in="rgb" stdDeviation="${frost}"/>
</filter></svg>`
  }

  let counter = 0
  const setup = (host) => {
    const number = (name, fallback) => (host.dataset[name] !== undefined ? Number(host.dataset[name]) : fallback)
    const radius = number('radius', 999)
    const bevelDepth = number('bevel', 14)
    const scale = number('scale', 48)
    const aberration = number('aberration', 4)
    const frost = number('frost', 0.4)
    const tint = number('tint', 0.1)

    host.classList.add('glass')
    host.style.borderRadius = `${radius}px`
    if (reducedTransparency) {
      host.classList.add('glass--opaque')
      return
    }
    const frosted = '-webkit-backdrop-filter: blur(20px) saturate(1.4); backdrop-filter: blur(20px) saturate(1.4);'
    if (safariLike() || !supportsUrlBackdrop()) {
      host.classList.add('glass--frost')
      host.style.cssText += frosted
      return
    }
    host.style.backgroundColor = `rgb(255 255 255 / ${tint})`

    let blob = null
    let holder = null
    let timer = 0
    const build = async (width, height) => {
      const url = await mapBlobUrl({
        width,
        height,
        radius: Math.min(radius, width / 2, height / 2),
        bevelDepth: Math.min(bevelDepth, Math.min(width, height) / 2),
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      })
      await new Promise((resolve) => {
        const image = new Image()
        image.onload = image.onerror = () => resolve()
        image.src = url
      })
      if (blob) URL.revokeObjectURL(blob)
      blob = url
      const id = `lg-${++counter}-${width}x${height}`
      holder?.remove()
      holder = document.createElement('span')
      holder.setAttribute('aria-hidden', 'true')
      holder.className = 'glass-filter'
      holder.innerHTML = filterSvg({ id, mapUrl: url, width, height, scale, aberration, frost })
      host.prepend(holder)
      const value = `url(#${id}) blur(0.5px) saturate(1.85) brightness(1.02)`
      host.style.webkitBackdropFilter = value
      host.style.backdropFilter = value
    }

    let last = ''
    new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]
      const width = Math.max(1, Math.round(box?.inlineSize ?? entry.contentRect.width))
      const height = Math.max(1, Math.round(box?.blockSize ?? entry.contentRect.height))
      if (width <= 1 || height <= 1 || `${width}x${height}` === last) return
      last = `${width}x${height}`
      clearTimeout(timer)
      timer = setTimeout(() => build(width, height).catch(() => host.classList.add('glass--frost')), 120)
    }).observe(host)
  }

  hosts.forEach(setup)
}
