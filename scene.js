import * as THREE from './three.module.js';

const canvas = document.querySelector('#kairos-scene');
if (canvas) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'low-power',
        stencil: false,
        depth: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(0, 0, 7.6);

    const rig = new THREE.Group();
    rig.rotation.set(-0.08, -0.1, 0.16);
    scene.add(rig);

    const coreGeometry = new THREE.IcosahedronGeometry(1.14, 36);
    const coreUniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColorA: { value: new THREE.Color('#7aebd5') },
        uColorB: { value: new THREE.Color('#6379d5') },
        uColorC: { value: new THREE.Color('#b083ee') }
    };
    const coreMaterial = new THREE.ShaderMaterial({
        uniforms: coreUniforms,
        vertexShader: `
            uniform float uTime;
            uniform vec2 uPointer;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            varying float vWave;
            void main() {
                vec3 p = position;
                float a = sin(p.y * 4.2 + uTime * 0.34 + p.x * 2.2);
                float b = sin(p.z * 3.7 - uTime * 0.26 + p.y * 2.1);
                float c = sin(p.x * 3.1 + uTime * 0.2 - p.z * 2.7);
                float wave = (a + b + c) / 3.0;
                float displacement = wave * 0.045 + sin(uTime * 0.24) * 0.012;
                p += normal * displacement;
                vec4 worldPosition = modelMatrix * vec4(p, 1.0);
                vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                vNormal = normalize(normalMatrix * normal);
                vPosition = p;
                vWorldPosition = worldPosition.xyz;
                vWave = wave;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            uniform vec3 uColorC;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            varying float vWave;
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.7);
                float hemisphere = smoothstep(-0.9, 0.85, normal.y * 0.7 + normal.x * 0.23 - normal.z * 0.3);
                float longitude = atan(vPosition.z, vPosition.x);
                float flow = sin(longitude * 1.8 + vPosition.y * 2.4 - uTime * 0.25) * 0.5 + 0.5;
                vec3 deep = mix(uColorB, uColorC, flow * 0.5 + hemisphere * 0.16);
                vec3 base = mix(deep, uColorA, hemisphere * 0.67 + flow * 0.075);
                float lightA = pow(max(dot(normal, normalize(vec3(-0.7, 0.72, 0.9))), 0.0), 3.2);
                float lightB = pow(max(dot(normal, normalize(vec3(0.82, -0.36, 0.62))), 0.0), 5.0);
                float caustic = pow(max(0.0, sin(vPosition.x * 10.0 + vPosition.y * 7.0 + uTime * 0.23) * sin(vPosition.z * 11.0 - vPosition.y * 8.0)), 7.0);
                vec3 color = base * (0.38 + lightA * 0.72 + lightB * 0.31);
                color += uColorA * fresnel * 0.78;
                color += uColorC * fresnel * fresnel * 0.24;
                color += uColorA * caustic * 0.18;
                float opacity = 0.95 - abs(vWave) * 0.08;
                gl_FragColor = vec4(color, opacity);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        transparent: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    rig.add(core);

    const innerGeometry = new THREE.IcosahedronGeometry(0.91, 3);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: '#92f2df',
        wireframe: true,
        transparent: true,
        opacity: 0.095,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const innerWire = new THREE.Mesh(innerGeometry, innerMaterial);
    innerWire.scale.setScalar(1.008);
    rig.add(innerWire);

    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 64, 64),
        new THREE.ShaderMaterial({
            vertexShader: `varying vec3 vNormal; void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `varying vec3 vNormal; void main(){float glow=pow(1.0-max(dot(normalize(vNormal),vec3(0.0,0.0,1.0)),0.0),3.0);gl_FragColor=vec4(vec3(0.28,0.58,0.77),glow*0.24);}`,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        })
    );
    atmosphere.scale.setScalar(1.05);
    rig.add(atmosphere);

    function makeOrbit(radiusX, radiusY, rotation, color, opacity, segments = 190) {
        const points = [];
        for (let i = 0; i <= segments; i += 1) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
        const orbit = new THREE.Line(geometry, material);
        orbit.rotation.set(rotation.x, rotation.y, rotation.z);
        return orbit;
    }

    const orbitA = makeOrbit(1.62, 0.56, new THREE.Euler(0.36, 0.45, -0.28), '#94ddf0', 0.3);
    const orbitB = makeOrbit(1.76, 0.68, new THREE.Euler(-0.48, -0.25, 0.54), '#ba9aff', 0.26);
    const orbitC = makeOrbit(1.47, 1.23, new THREE.Euler(0.16, 0.72, 0.96), '#77e6d5', 0.18, 160);
    rig.add(orbitA, orbitB, orbitC);

    function orbitPosition(orbit, angle, radiusScale = 1) {
        const point = new THREE.Vector3(
            Math.cos(angle) * 1.62 * radiusScale,
            Math.sin(angle) * 0.56 * radiusScale,
            0
        );
        point.applyEuler(orbit.rotation);
        return point;
    }

    const satellites = [];
    const satelliteSpecs = [
        { orbit: orbitA, angle: 0.35, radius: 0.055, color: '#abfff0', speed: 0.16 },
        { orbit: orbitB, angle: 2.35, radius: 0.042, color: '#d1b3ff', speed: -0.12 },
        { orbit: orbitC, angle: 4.2, radius: 0.032, color: '#9ab8ff', speed: 0.105 }
    ];
    for (const spec of satelliteSpecs) {
        const node = new THREE.Mesh(
            new THREE.SphereGeometry(spec.radius, 14, 14),
            new THREE.MeshBasicMaterial({ color: spec.color, toneMapped: false })
        );
        const light = new THREE.PointLight(spec.color, 0.32, 1.3);
        node.add(light);
        rig.add(node);
        satellites.push({ ...spec, node });
    }

    const pointCount = window.innerWidth < 760 ? 280 : 560;
    const pointPositions = new Float32Array(pointCount * 3);
    const pointSizes = new Float32Array(pointCount);
    for (let i = 0; i < pointCount; i += 1) {
        const index = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.85 + Math.random() * 2.6;
        pointPositions[index] = Math.cos(angle) * radius * (0.72 + Math.random() * 0.55);
        pointPositions[index + 1] = Math.sin(angle) * radius * (0.73 + Math.random() * 0.55);
        pointPositions[index + 2] = (Math.random() - 0.5) * 3.1;
        pointSizes[i] = Math.random();
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(pointSizes, 1));
    const starMaterial = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
        vertexShader: `uniform float uTime; uniform float uPixelRatio; attribute float aSize; varying float vAlpha; void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.0);float twinkle=0.54+0.46*sin(uTime*(0.42+aSize*0.7)+aSize*37.0);vAlpha=twinkle*(0.12+aSize*0.3);gl_PointSize=(1.0+aSize*1.8)*uPixelRatio*(7.0/max(1.0,-mvPosition.z));gl_Position=projectionMatrix*mvPosition;}`,
        fragmentShader: `varying float vAlpha; void main(){vec2 p=gl_PointCoord-0.5;float d=length(p);if(d>0.5)discard;float core=1.0-smoothstep(0.01,0.48,d);gl_FragColor=vec4(vec3(0.60,0.80,0.91),core*vAlpha);}`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const ambient = new THREE.AmbientLight('#92bbdf', 0.45);
    scene.add(ambient);
    const keyLight = new THREE.PointLight('#8ff3dc', 4.2, 8);
    keyLight.position.set(-2.2, 2.2, 4.1);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight('#a27bff', 2.8, 7);
    rimLight.position.set(2.7, -1.4, -1.1);
    scene.add(rimLight);

    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    let width = 1;
    let height = 1;
    let visible = true;
    let raf = 0;
    let start = performance.now();
    let lastFrame = 0;

    function resize() {
        const bounds = canvas.getBoundingClientRect();
        width = Math.max(bounds.width, 1);
        height = Math.max(bounds.height, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = width < 520 ? 8.05 : width < 760 ? 7.8 : 7.45;
        camera.updateProjectionMatrix();
        if (width < 760) rig.scale.setScalar(0.88);
        else rig.scale.setScalar(1);
    }

    function onPointer(event) {
        const bounds = canvas.getBoundingClientRect();
        pointerTarget.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointerTarget.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
    }

    function render(now) {
        if (!visible) {
            raf = 0;
            return;
        }
        raf = window.requestAnimationFrame(render);
        if (document.hidden || now - lastFrame < (reduceMotion ? 1000 / 12 : 1000 / 40)) return;
        lastFrame = now;

        const time = reduceMotion ? 0 : (now - start) * 0.001;
        pointer.lerp(pointerTarget, reduceMotion ? 0.04 : 0.025);
        rig.rotation.y = -0.1 + pointer.x * 0.13 + (reduceMotion ? 0 : Math.sin(time * 0.18) * 0.075);
        rig.rotation.x = -0.08 + pointer.y * 0.075 + (reduceMotion ? 0 : Math.sin(time * 0.2 + 1) * 0.035);
        rig.rotation.z = 0.16 + (reduceMotion ? 0 : Math.sin(time * 0.12) * 0.05);
        coreUniforms.uTime.value = time;
        coreUniforms.uPointer.value.copy(pointer);
        starMaterial.uniforms.uTime.value = time;
        stars.rotation.z = reduceMotion ? 0 : time * 0.006;
        orbitA.rotation.z = -0.28 + (reduceMotion ? 0 : Math.sin(time * 0.16) * 0.045);
        orbitB.rotation.y = -0.25 + (reduceMotion ? 0 : Math.cos(time * 0.13) * 0.06);
        satellites.forEach((satellite) => {
            const angle = satellite.angle + (reduceMotion ? 0 : time * satellite.speed);
            satellite.node.position.copy(orbitPosition(satellite.orbit, angle, satellite.orbit === orbitC ? 0.92 : 1));
        });
        renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !raf) raf = window.requestAnimationFrame(render);
    }, { threshold: 0.01 });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    canvas.addEventListener('pointermove', onPointer, { passive: true });
    canvas.addEventListener('pointerleave', () => pointerTarget.set(0, 0), { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && visible && !raf) raf = window.requestAnimationFrame(render);
    });
    resize();
    raf = window.requestAnimationFrame(render);
}
