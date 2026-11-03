// Small Three.js scenes, loaded on demand:
//   [data-orb]  liquid-metal orb (About)         [data-gyro] orbiting rings (final call to action)
//   [data-lock] 3D padlocks (under construction)
//   [data-bars] 3D columns that grow when seen (case study)   [data-rubik] Rubik-style cube with turning layers (start)
//   [data-tesseract] 4D hypercube (concept: "Tesseract" by @ln-dev7, 21st.dev id 29270); with data-scroll it is
//   scrubbed by the scroll position of its [data-scrub] section: scattered points assemble into the cube
// Each host holds a <canvas>. They draw only while on screen and stay still under reduced motion.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const small = window.matchMedia('(max-width: 700px)').matches

const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
window.addEventListener('pointermove', (event) => {
  pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2
  pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2
}, { passive: true })

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

async function mount(host, build, { fov = 40, z = 6 } = {}) {
  const THREE = await import('three')
  const canvas = host.querySelector('canvas')
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 40)
  camera.position.z = z
  const scenery = await build({ THREE, scene, camera, host })

  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }
  resize()
  new ResizeObserver(resize).observe(host)

  const render = (seconds) => {
    pointer.x += (pointer.tx - pointer.x) * 0.05
    pointer.y += (pointer.ty - pointer.y) * 0.05
    scenery.update(seconds, pointer)
    renderer.render(scene, camera)
  }
  host.classList.add('is-live')
  if (reducedMotion) {
    render(3)
    return
  }

  let frame = 0
  let visible = false
  const begin = performance.now()
  const tick = (now) => {
    render((now - begin) / 1000)
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
}

const colors = { cyan: '#5ad7ee', violet: '#a86be0', mid: '#8191e7', deep: '#0a0e2b' }

// Liquid-metal orb: a noise-displaced sphere with a cyan-to-violet fresnel rim.
const buildOrb = ({ THREE, scene }) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCyan: { value: new THREE.Color(colors.cyan) },
      uViolet: { value: new THREE.Color(colors.violet) },
      uDeep: { value: new THREE.Color(colors.deep) },
    },
    vertexShader: `${NOISE}
      uniform float uTime; varying vec3 vNormal; varying vec3 vView; varying float vNoise; varying vec3 vPos;
      vec3 disp(vec3 p) { return p + normalize(p) * snoise(p * 1.3 + vec3(0.0, uTime * 0.25, uTime * 0.15)) * 0.22; }
      void main() {
        vec3 p = position; vec3 n0 = normalize(p);
        vec3 up = abs(n0.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 t1 = normalize(cross(n0, up)); vec3 t2 = normalize(cross(n0, t1));
        float e = 0.02; float r = length(p);
        vec3 d0 = disp(p); vec3 d1 = disp(normalize(p + t1 * e) * r); vec3 d2 = disp(normalize(p + t2 * e) * r);
        vec3 nrm = normalize(cross(d1 - d0, d2 - d0)); if (dot(nrm, n0) < 0.0) nrm = -nrm;
        vNormal = normalize(normalMatrix * nrm);
        vec4 mv = modelViewMatrix * vec4(d0, 1.0);
        vView = normalize(-mv.xyz);
        vNoise = snoise(p * 1.3 + vec3(0.0, uTime * 0.25, uTime * 0.15));
        vPos = d0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vNormal; varying vec3 vView; varying float vNoise; varying vec3 vPos;
      uniform vec3 uCyan; uniform vec3 uViolet; uniform vec3 uDeep;
      void main() {
        vec3 N = normalize(vNormal); vec3 V = normalize(vView);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
        vec3 L = normalize(vec3(0.5, 0.8, 0.6));
        float spec = pow(max(dot(reflect(-L, N), V), 0.0), 40.0);
        float t = smoothstep(-0.8, 0.8, vPos.y + vNoise * 0.4);
        vec3 rim = mix(uCyan, uViolet, t);
        vec3 base = mix(uDeep, vec3(0.09, 0.12, 0.30), smoothstep(-0.3, 0.6, vNoise));
        gl_FragColor = vec4(base + rim * fres * 1.5 + vec3(spec) * 0.6, 1.0);
      }`,
  })
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.25, small ? 64 : 128, small ? 64 : 128), material)
  scene.add(orb)
  return {
    update(seconds, p) {
      material.uniforms.uTime.value = seconds
      orb.rotation.y = seconds * 0.12 + p.x * 0.4
      orb.rotation.x = p.y * 0.25
    },
  }
}

// Gyroscope: three tilted rings with traveling beads around a wireframe core.
const buildGyro = ({ THREE, scene }) => {
  const group = new THREE.Group()
  scene.add(group)
  const makeCircle = (radius, color) => {
    const points = []
    for (let i = 0; i <= 200; i++) {
      const angle = (i / 200) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }))
  }
  const rings = [
    { r: 2.1, color: colors.cyan, speed: 0.5, tilt: [0.0, 0.0, 0.0] },
    { r: 1.65, color: colors.mid, speed: -0.7, tilt: [Math.PI / 2, 0.0, 0.0] },
    { r: 1.2, color: colors.violet, speed: 0.9, tilt: [0.0, 0.0, Math.PI / 2] },
  ].map((ring) => {
    const pivot = new THREE.Group()
    pivot.add(makeCircle(ring.r, ring.color))
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: ring.color }))
    bead.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshBasicMaterial({ color: ring.color, transparent: true, opacity: 0.18 })))
    pivot.add(bead)
    group.add(pivot)
    return { ...ring, pivot, bead }
  })
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshBasicMaterial({ color: colors.cyan, wireframe: true, transparent: true, opacity: 0.6 }))
  group.add(core)
  return {
    update(seconds, p) {
      rings.forEach((ring, index) => {
        ring.pivot.rotation.set(ring.tilt[0] + seconds * 0.15 * (index + 1), seconds * 0.1 * (index + 1), ring.tilt[2])
        const angle = seconds * ring.speed + index * 2
        ring.bead.position.set(Math.cos(angle) * ring.r, 0, Math.sin(angle) * ring.r)
      })
      core.rotation.set(seconds * 0.4, seconds * 0.3, 0)
      group.rotation.y = p.x * 0.5
      group.rotation.x = p.y * 0.35
    },
  }
}

// Padlock: gold body and shackle that lifts when the pointer is over the tile.
const buildLock = async ({ THREE, scene, host }) => {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js')
  scene.add(new THREE.AmbientLight('#9aa8ff', 0.8))
  const key = new THREE.DirectionalLight('#ffffff', 2.4)
  key.position.set(2, 3, 4)
  scene.add(key)
  const rim = new THREE.PointLight(colors.cyan, 18, 12)
  rim.position.set(-3, -1, 2)
  scene.add(rim)

  const gold = new THREE.MeshStandardMaterial({ color: '#f5c518', metalness: 0.7, roughness: 0.3 })
  const lock = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.2, 0.6, 5, 0.14), gold)
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 18, 48, Math.PI), gold)
  shackle.position.set(0, 0.6, 0)
  const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.64, 24), new THREE.MeshStandardMaterial({ color: '#17140a', roughness: 0.6 }))
  keyhole.rotation.x = Math.PI / 2
  keyhole.position.y = 0.08
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.64), keyhole.material)
  slot.position.y = -0.14
  lock.add(body, shackle, keyhole, slot)
  scene.add(lock)

  let lift = 0
  let target = 0
  host.parentElement?.addEventListener('pointerenter', () => { target = 1 })
  host.parentElement?.addEventListener('pointerleave', () => { target = 0 })
  return {
    update(seconds) {
      lift += (target - lift) * 0.12
      lock.rotation.y = Math.sin(seconds * 0.9) * 0.55
      lock.rotation.x = -0.12
      lock.position.y = Math.sin(seconds * 1.3) * 0.05
      shackle.position.y = 0.6 + lift * 0.22
      shackle.rotation.y = lift * 0.6
    },
  }
}

// Tesseract: a 4D hypercube projected to 3D, double-rotating. In scroll mode the rotation, the camera and a cloud
// of scattered points are driven by how far the user has scrolled through the pinned [data-scrub] section.
const buildTesseract = ({ THREE, scene, camera, host }) => {
  const verts = Array.from({ length: 16 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
  const edges = []
  for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) if ((i | (1 << b)) !== i) edges.push([i, i | (1 << b)])

  const scrollMode = host.hasAttribute('data-scroll')
  const section = host.closest('[data-scrub]')
  const steps = section ? [...section.querySelectorAll('.scrub-steps li')] : []
  const cyan = new THREE.Color(colors.cyan)
  const violet = new THREE.Color(colors.violet)
  const group = new THREE.Group()
  scene.add(group)

  const up = new THREE.Vector3(0, 1, 0)
  const strutGeometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true)
  const core = new THREE.InstancedMesh(strutGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 }), edges.length)
  const glow = new THREE.InstancedMesh(strutGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending }), edges.length)
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 16, 16), new THREE.MeshBasicMaterial(), verts.length)
  group.add(glow, core, nodes)

  // Scattered points that fly onto the struts as the user scrolls.
  const count = small ? 380 : 900
  const scatter = new Float32Array(count * 3)
  const slot = new Float32Array(count * 2)
  const cloudColors = new Float32Array(count * 3)
  const mix = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const radius = 3.2 + Math.random() * 4.2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    scatter.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi) * 0.7, radius * Math.sin(phi) * Math.sin(theta)], i * 3)
    slot.set([Math.floor(Math.random() * edges.length), Math.random()], i * 2)
    mix.copy(cyan).lerp(violet, Math.random())
    cloudColors.set([mix.r, mix.g, mix.b], i * 3)
  }
  const cloudGeometry = new THREE.BufferGeometry()
  const cloudPositions = new Float32Array(count * 3)
  cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3))
  cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3))
  const cloud = new THREE.Points(cloudGeometry, new THREE.PointsMaterial({ size: small ? 0.07 : 0.05, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }))
  group.add(cloud)

  const points = verts.map(() => new THREE.Vector3())
  const depth = new Float32Array(verts.length)
  const dummy = new THREE.Object3D()
  const dir = new THREE.Vector3()
  let smooth = 0
  let lastStep = -1

  return {
    update(seconds, pointerNow) {
      let progress = 0.55
      if (scrollMode && section) {
        const box = section.getBoundingClientRect()
        progress = Math.min(Math.max(-box.top / Math.max(box.height - window.innerHeight, 1), 0), 1)
      }
      smooth += (progress - smooth) * (reducedMotion ? 1 : 0.09)
      const assemble = Math.min(Math.max((smooth - 0.04) / 0.46, 0), 1)
      const eased = assemble * assemble * (3 - 2 * assemble)

      const t = scrollMode ? smooth * 7 + seconds * 0.12 : seconds * 0.5
      const ca = Math.cos(t * 0.55), sa = Math.sin(t * 0.55), cb = Math.cos(t * 0.38), sb = Math.sin(t * 0.38)
      const scale = 0.62 * 1.55
      for (let i = 0; i < verts.length; i++) {
        const [x, y, z, w] = verts[i]
        const x2 = x * ca - w * sa, w2 = x * sa + w * ca
        const y2 = y * cb - z * sb, z2 = y * sb + z * cb
        const k = 3 / (3 - w2)
        points[i].set(x2, y2, z2).multiplyScalar(k * scale)
        depth[i] = (w2 + Math.SQRT2) / (2 * Math.SQRT2)
        dummy.position.copy(points[i])
        dummy.quaternion.identity()
        dummy.scale.setScalar(k * (0.4 + 0.6 * eased))
        dummy.updateMatrix()
        nodes.setMatrixAt(i, dummy.matrix)
        nodes.setColorAt(i, mix.copy(cyan).lerp(violet, depth[i]))
      }
      for (let i = 0; i < edges.length; i++) {
        const a = points[edges[i][0]], b = points[edges[i][1]]
        dummy.position.addVectors(a, b).multiplyScalar(0.5)
        dir.subVectors(b, a)
        const length = dir.length()
        dummy.quaternion.setFromUnitVectors(up, dir.divideScalar(length))
        const colorMix = (depth[edges[i][0]] + depth[edges[i][1]]) / 2
        dummy.scale.set(0.012 + eased * 0.014, length, 0.012 + eased * 0.014)
        dummy.updateMatrix()
        core.setMatrixAt(i, dummy.matrix)
        core.setColorAt(i, mix.copy(cyan).lerp(violet, colorMix))
        dummy.scale.set(0.06, length, 0.06)
        dummy.updateMatrix()
        glow.setMatrixAt(i, dummy.matrix)
        glow.setColorAt(i, mix)
      }
      ;[core, glow, nodes].forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      })
      core.material.opacity = 0.25 + eased * 0.7
      glow.material.opacity = 0.05 + eased * 0.12

      for (let i = 0; i < count; i++) {
        const a = points[edges[slot[i * 2]][0]], b = points[edges[slot[i * 2]][1]]
        const f = slot[i * 2 + 1]
        const tx = a.x + (b.x - a.x) * f, ty = a.y + (b.y - a.y) * f, tz = a.z + (b.z - a.z) * f
        const drift = (1 - eased) * 0.35
        cloudPositions[i * 3] = scatter[i * 3] * (1 - eased) + tx * eased + Math.sin(seconds * 0.6 + i) * drift
        cloudPositions[i * 3 + 1] = scatter[i * 3 + 1] * (1 - eased) + ty * eased + Math.cos(seconds * 0.5 + i * 1.3) * drift
        cloudPositions[i * 3 + 2] = scatter[i * 3 + 2] * (1 - eased) + tz * eased
      }
      cloudGeometry.attributes.position.needsUpdate = true

      const wide = camera.aspect > 1.1
      camera.position.z = scrollMode ? 11 - smooth * 4.2 : 7.2
      group.position.x = scrollMode && wide ? camera.aspect * 1.55 : 0
      group.scale.setScalar(scrollMode ? (wide ? Math.min(1, camera.aspect / 1.9) : 0.5) : 1)
      group.position.y = scrollMode && !wide ? 2.1 : 0
      group.rotation.y = (scrollMode ? smooth * Math.PI * 1.4 : seconds * 0.12) + pointerNow.x * 0.35
      group.rotation.x = 0.32 + pointerNow.y * 0.2

      if (steps.length && section) {
        const step = Math.min(steps.length - 1, Math.floor(smooth * steps.length * 0.999))
        if (step !== lastStep) {
          lastStep = step
          steps.forEach((li, index) => li.classList.toggle('is-on', index === step))
        }
        section.style.setProperty('--p', smooth.toFixed(3))
      }
    },
  }
}

const lights = (THREE, scene) => {
  scene.add(new THREE.AmbientLight('#aab4ff', 0.9))
  const key = new THREE.DirectionalLight('#ffffff', 2.6)
  key.position.set(2.5, 4, 5)
  scene.add(key)
  const rim = new THREE.PointLight(colors.cyan, 22, 14)
  rim.position.set(-4, 1, 3)
  scene.add(rim)
  const back = new THREE.PointLight(colors.violet, 18, 14)
  back.position.set(4, -2, 2)
  scene.add(back)
}

// Columns that rise one after another the first time the block is on screen (case study, light surface).
const buildBars = async ({ THREE, scene, host }) => {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js')
  lights(THREE, scene)
  const heights = [0.9, 1.35, 1.1, 1.8, 1.55, 2.2, 2.8]
  const group = new THREE.Group()
  scene.add(group)
  const cyan = new THREE.Color(colors.cyan)
  const violet = new THREE.Color(colors.violet)
  const bars = heights.map((height, index) => {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(0.5, 1, 0.5, 4, 0.1),
      new THREE.MeshStandardMaterial({ color: cyan.clone().lerp(violet, index / (heights.length - 1)), metalness: 0.35, roughness: 0.28 }),
    )
    mesh.position.x = (index - (heights.length - 1) / 2) * 0.72
    group.add(mesh)
    return { mesh, height }
  })
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), new THREE.MeshBasicMaterial({ color: '#5a38b8', transparent: true, opacity: 0.08 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.4
  group.add(floor)
  let born = null
  return {
    update(seconds, p) {
      if (born === null) born = seconds
      const age = reducedMotion ? 9 : seconds - born
      bars.forEach((bar, index) => {
        const k = Math.min(Math.max((age - index * 0.16) / 0.9, 0), 1)
        const grow = 1 - Math.pow(1 - k, 3)
        const height = Math.max(bar.height * grow, 0.001)
        bar.mesh.scale.y = height
        bar.mesh.position.y = -1.4 + height / 2
      })
      group.rotation.y = -0.5 + Math.sin(seconds * 0.4) * 0.12 + p.x * 0.25
      group.rotation.x = 0.18 + p.y * 0.1
    },
  }
}

// Rubik-style cube: 27 rounded cubies whose layers keep turning (start section, dark surface).
const buildRubik = async ({ THREE, scene }) => {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js')
  lights(THREE, scene)
  const inner = new THREE.MeshStandardMaterial({ color: '#131a30', metalness: 0.4, roughness: 0.5 })
  const face = (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.24 })
  const geometry = new RoundedBoxGeometry(0.92, 0.92, 0.92, 3, 0.12)
  const group = new THREE.Group()
  const pivot = new THREE.Group()
  group.add(pivot)
  scene.add(group)

  const cubies = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // order of BoxGeometry groups: +x, -x, +y, -y, +z, -z
        const materials = [
          x === 1 ? face(colors.cyan) : inner,
          x === -1 ? face('#3b8fc4') : inner,
          y === 1 ? face('#e9ecf4') : inner,
          y === -1 ? face(colors.mid) : inner,
          z === 1 ? face(colors.violet) : inner,
          z === -1 ? face('#6a3fb0') : inner,
        ]
        const cubie = new THREE.Mesh(geometry, materials)
        cubie.position.set(x, y, z)
        group.add(cubie)
        cubies.push(cubie)
      }
    }
  }

  const axes = ['x', 'y', 'z']
  let turn = null
  let next = 1.2
  return {
    update(seconds, p) {
      if (!turn && seconds > next) {
        const axis = axes[Math.floor(Math.random() * 3)]
        const layer = Math.floor(Math.random() * 3) - 1
        pivot.rotation.set(0, 0, 0)
        cubies.filter((cubie) => Math.round(cubie.position[axis]) === layer).forEach((cubie) => pivot.attach(cubie))
        turn = { start: seconds, axis, dir: Math.random() < 0.5 ? 1 : -1 }
      }
      if (turn) {
        const t = Math.min((seconds - turn.start) / 0.8, 1)
        pivot.rotation[turn.axis] = turn.dir * (Math.PI / 2) * (1 - Math.pow(1 - t, 3))
        if (t >= 1) {
          pivot.children.slice().forEach((cubie) => {
            group.attach(cubie)
            cubie.position.set(Math.round(cubie.position.x), Math.round(cubie.position.y), Math.round(cubie.position.z))
          })
          pivot.rotation.set(0, 0, 0)
          turn = null
          next = seconds + 0.45
        }
      }
      group.rotation.y = seconds * 0.35 + p.x * 0.4
      group.rotation.x = 0.55 + p.y * 0.2
    },
  }
}

// Scroll-driven morph: one cloud of particles that becomes a different shape at each step of the pinned section
// (scattered data -> connected lattice -> flowing knot -> ordered sphere), with a turbulent burst in between.
const buildMorph = ({ THREE, scene, camera, host }) => {
  const section = host.closest('[data-scrub]')
  const steps = section ? [...section.querySelectorAll('.scrub-steps li')] : []
  const count = small ? 2400 : 5600
  const shapes = [0, 1, 2, 3].map(() => new Float32Array(count * 3))
  const seeds = new Float32Array(count)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const grid = [-1.35, -0.45, 0.45, 1.35]
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random()
    // 0: scattered cloud
    const radius = 1.2 + Math.random() * 1.7
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    shapes[0].set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi) * 0.8, radius * Math.sin(phi) * Math.sin(theta)], i * 3)
    // 1: connected lattice, particles ride the lines of a 4x4x4 grid
    const free = Math.floor(Math.random() * 3)
    const line = [grid[Math.floor(Math.random() * 4)], grid[Math.floor(Math.random() * 4)], (Math.random() * 2 - 1) * 1.35]
    const lattice = [0, 0, 0]
    let k = 0
    for (let axis = 0; axis < 3; axis++) lattice[axis] = axis === free ? line[2] : line[k++]
    shapes[1].set(lattice, i * 3)
    // 2: torus knot, the flow of automated work
    const t = Math.random() * Math.PI * 2
    const kr = 1.25 + 0.5 * Math.cos(3 * t)
    const jitter = () => (Math.random() - 0.5) * 0.26
    shapes[2].set([kr * Math.cos(2 * t) * 1.15 + jitter(), kr * Math.sin(2 * t) * 1.15 + jitter(), 0.7 * Math.sin(3 * t) * 1.4 + jitter()], i * 3)
    // 3: ordered sphere with two orbit rings
    if (i % 5 < 4) {
      const y = 1 - ((i / count) * 2)
      const ring = Math.sqrt(1 - y * y)
      shapes[3].set([Math.cos(golden * i) * ring * 1.7, y * 1.7, Math.sin(golden * i) * ring * 1.7], i * 3)
    } else {
      const angle = Math.random() * Math.PI * 2
      const big = i % 2 === 0
      const ringR = big ? 2.45 : 2.1
      const v = [Math.cos(angle) * ringR, 0, Math.sin(angle) * ringR]
      const tilt = big ? 0.5 : -0.6
      shapes[3].set([v[0], v[1] * Math.cos(tilt) - v[2] * Math.sin(tilt), v[1] * Math.sin(tilt) + v[2] * Math.cos(tilt)], i * 3)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  ;['aA', 'aB', 'aC', 'aD'].forEach((name, index) => geometry.setAttribute(name, new THREE.BufferAttribute(shapes[index], 3)))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uP: { value: 0 },
      uTime: { value: 0 },
      uPixel: { value: Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75) * (small ? 52 : 34) },
      uCyan: { value: new THREE.Color(colors.cyan) },
      uViolet: { value: new THREE.Color(colors.violet) },
    },
    vertexShader: `
      attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute vec3 aD; attribute float aSeed;
      uniform float uP; uniform float uTime; uniform float uPixel; uniform vec3 uCyan; uniform vec3 uViolet;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float seg = floor(min(uP, 2.9999));
        float f = uP - seg;
        vec3 a = seg < 0.5 ? aA : (seg < 1.5 ? aB : aC);
        vec3 b = seg < 0.5 ? aB : (seg < 1.5 ? aC : aD);
        float delayed = clamp((f - aSeed * 0.45) / 0.55, 0.0, 1.0);
        float e = delayed * delayed * (3.0 - 2.0 * delayed);
        vec3 p = mix(a, b, e);
        float burst = sin(e * 3.14159);
        p += vec3(sin(uTime * 1.2 + aSeed * 40.0), cos(uTime * 1.0 + aSeed * 31.0), sin(uTime * 0.8 + aSeed * 23.0)) * (0.035 + 0.7 * burst * aSeed);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.8 + aSeed * 1.5) * uPixel / -mv.z;
        gl_Position = projectionMatrix * mv;
        vColor = mix(uCyan, uViolet, smoothstep(-2.2, 2.2, p.y * 0.8 + p.x * 0.6));
        vAlpha = 0.45 + 0.4 * aSeed;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vAlpha);
      }`,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  const group = new THREE.Group()
  group.add(points)
  scene.add(group)

  let smooth = 0
  let lastStep = -1
  return {
    update(seconds, pointerNow) {
      let progress = 0.7
      if (section) {
        const box = section.getBoundingClientRect()
        progress = Math.min(Math.max(-box.top / Math.max(box.height - window.innerHeight, 1), 0), 1)
      }
      smooth += (progress - smooth) * (reducedMotion ? 1 : 0.08)
      // each step holds its shape for the first part of its slice, then morphs into the next
      const x = smooth * 4
      const index = Math.min(Math.floor(x), 3)
      const local = x - index
      material.uniforms.uP.value = index < 3 ? index + Math.min(Math.max((local - 0.4) / 0.6, 0), 1) : 3
      material.uniforms.uTime.value = seconds

      const wide = camera.aspect > 1.1
      const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const halfWidth = halfHeight * camera.aspect
      const scale = wide ? Math.min(0.95, (halfWidth * 0.46) / 2.6) : 0.55
      group.scale.setScalar(scale)
      group.position.set(wide ? halfWidth * 0.5 : 0, wide ? 0 : halfHeight * 0.45, 0)
      group.rotation.y = seconds * 0.18 + smooth * 2.4 + pointerNow.x * 0.35
      group.rotation.x = 0.2 + Math.sin(seconds * 0.3) * 0.08 + pointerNow.y * 0.2

      if (steps.length && section) {
        const step = Math.min(steps.length - 1, Math.floor(smooth * steps.length * 0.999))
        if (step !== lastStep) {
          lastStep = step
          steps.forEach((li, i) => li.classList.toggle('is-on', i === step))
        }
        section.style.setProperty('--p', smooth.toFixed(3))
      }
    },
  }
}

const scenes = [
  ['[data-orb]', buildOrb, { z: 4.4 }],
  ['[data-gyro]', buildGyro, { z: 6.2 }],
  ['[data-lock]', buildLock, { z: 4.2, fov: 38 }],
  ['[data-bars]', buildBars, { z: 8, fov: 36 }],
  ['[data-rubik]', buildRubik, { z: 7.4, fov: 36 }],
  ['[data-morph]', buildMorph, { z: 9, fov: 40 }],
  ['[data-tesseract]', buildTesseract, { z: 9, fov: 40 }],
]

const start = () => {
  scenes.forEach(([selector, build, options]) => {
    document.querySelectorAll(selector).forEach((host) => mount(host, build, options))
  })
}
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2000 })
else setTimeout(start, 600)
