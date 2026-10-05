import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type CircuitPath = {
  curve: THREE.CatmullRomCurve3
  color: string
  offset: number
  speed: number
}

function createCircuitPaths(): CircuitPath[] {
  const path = (coordinates: [number, number, number][], color: string, offset: number, speed: number): CircuitPath => ({
    curve: new THREE.CatmullRomCurve3(coordinates.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    color,
    offset,
    speed,
  })

  // Trace the actual K/automation mark as one branching circuit.
  return [
    path([[-1.3, -1.35, 0], [-1.3, -0.7, 0.02], [-1.3, 0, 0], [-1.3, 0.72, 0.02], [-1.3, 1.38, 0]], '#32d5e8', 0.16, 0.1),
    path([[-1.25, 0.02, 0.03], [-0.8, 0.05, 0.03], [-0.36, 0.44, 0.03], [0.1, 0.83, 0.04], [0.55, 1.2, 0.04], [1.32, 1.2, 0.04]], '#9c75fa', 0.62, 0.072),
    path([[-0.8, 0.03, 0.04], [-0.38, -0.4, 0.04], [0.05, -0.8, 0.05], [0.48, -1.2, 0.05], [1.35, -1.2, 0.05]], '#37cce3', 0.35, 0.088),
    path([[-1.3, 0.72, 0.02], [-1.68, 1.05, 0.02], [-1.68, 1.39, 0.02]], '#7f7cff', 0.8, 0.055),
  ]
}

function FlowCircuit({ paths }: { paths: CircuitPath[] }) {
  const rig = useRef<THREE.Group>(null)
  const nodes = useRef<(THREE.Mesh | null)[]>([])
  const { pointer, viewport } = useThree()

  const geometries = useMemo(
    () => paths.map(({ curve }) => new THREE.TubeGeometry(curve, 112, 0.016, 7, false)),
    [paths],
  )

  useFrame(({ clock }, delta) => {
    if (!rig.current) return
    const t = clock.elapsedTime
    const targetY = pointer.x * 0.1 + Math.sin(t * 0.22) * 0.045
    const targetX = pointer.y * 0.06 + Math.sin(t * 0.17) * 0.025
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, targetY, 1.5, delta)
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, targetX, 1.5, delta)
    rig.current.position.y = Math.sin(t * 0.35) * 0.045

    paths.forEach(({ curve, offset, speed }, index) => {
      const node = nodes.current[index]
      if (!node) return
      const progress = (offset + t * speed) % 1
      node.position.copy(curve.getPointAt(progress))
      const pulse = 1 + Math.sin(t * 2.2 + index * 2.1) * 0.11
      node.scale.setScalar(pulse)
    })
  })

  return (
    <group ref={rig} scale={viewport.width < 5 ? 0.93 : 1}>
      {paths.map((item, index) => (
        <group key={item.color + index}>
          <mesh geometry={geometries[index]}>
            <meshStandardMaterial
              color={item.color}
              emissive={item.color}
              emissiveIntensity={0.48}
              metalness={0.57}
              roughness={0.25}
            />
          </mesh>
          <mesh
            ref={(node) => { nodes.current[index] = node }}
            position={item.curve.getPointAt(item.offset)}
          >
            <sphereGeometry args={[0.048, 20, 20]} />
            <meshStandardMaterial
              color="#f7ffff"
              emissive={item.color}
              emissiveIntensity={2.1}
              metalness={0.25}
              roughness={0.16}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function CircuitScene({ visible }: { visible: boolean }) {
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const paths = useMemo(createCircuitPaths, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 6.8], fov: 38 }}
      dpr={[1, 1.45]}
      frameloop={reducedMotion ? 'demand' : visible ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0) }}
      aria-label="Circuito tridimensional que forma la K de KAIROS"
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[-3.8, 3.8, 4]} intensity={1.55} color="#ffffff" />
      <pointLight position={[2.5, -1, 1.8]} intensity={12} distance={7} color="#966dff" />
      <pointLight position={[-2.2, -2.5, 2]} intensity={9} distance={6} color="#22cbe0" />
      <FlowCircuit paths={paths} />
    </Canvas>
  )
}

export default function BrandScene() {
  const wrapper = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const element = wrapper.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStarted(true)
      setVisible(entry.isIntersecting)
    }, { threshold: 0.01 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="brand-scene" ref={wrapper} aria-hidden="true">
      <img className="brand-scene-fallback" src="/Documentos/Logo%20final.png" alt="" />
      {started && <CircuitScene visible={visible} />}
      <div className="scene-axis scene-axis--top" />
      <div className="scene-axis scene-axis--bottom" />
    </div>
  )
}
