import { useEffect, useRef, useState } from 'react'

const THREE_URL = 'three'
const GLTF_EXPORTER_URL = 'three/addons/exporters/GLTFExporter.js'
const USDZ_EXPORTER_URL = 'three/addons/exporters/USDZExporter.js'
const ROOM_ENV_URL = 'three/addons/environments/RoomEnvironment.js'
const GLTF_LOADER_URL = 'three/addons/loaders/GLTFLoader.js'

// Modelos 3D realistas (generados con IA y hosteados en Cloudinary).
// rotacionX corrige la orientación (parado vs acostado).
// rotacionZ corrige inclinaciones residuales (cuando la foto original
// del generador fue tomada en diagonal, tipo "foto de food blogger").
const MODELOS_REALISTAS = {
  pizza: {
    url: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783192856/pizza-optimizado_xgw43d.glb',
    rotacionX: -Math.PI / 2,
  },
  hamburguesa: {
    rotacionX: 0,
    porCapas: {
      1: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783197530/hamburguesa-simple_f5opyy.glb',
      2: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783197554/hamburguesa-doble_bywn4a.glb',
      3: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783197563/hamburguesa-triple_o8acbv.glb',
    },
  },
  sandwich_lomito: {
    url: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783203512/sandwich-lomito_rnyit6.glb',
    rotacionX: 0,
  },
  chivito: {
    url: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783203584/chivito_1_tkxk9z.glb',
    rotacionX: 0,
  },
lomito_arabe: {
    url: 'https://res.cloudinary.com/dmunelwl2/image/upload/v1783208458/lomito-arabe-v2_upodtq.glb',
    rotacionX: 0,
    rotacionZ: 0,
  },
}

export default function VisorAR({ producto, onClose }) {
  const containerRef = useRef(null)
  const mvRef = useRef(null)
  const groupRef = useRef(null)
  const modulesRef = useRef(null)
  const [cargando, setCargando] = useState(true)
  const [abriendoAR, setAbriendoAR] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarHintMesa, setMostrarHintMesa] = useState(false)

  useEffect(() => {
    let renderer, camera, scene, animId
    let cancelado = false
    let rotX = 0.55
    let isDragging = false, lastX = 0
    let cameraDistance = 9, cameraTargetY = 1.2
    const container = containerRef.current

    async function iniciar() {
      const THREE = await import(/* @vite-ignore */ THREE_URL)
      const { GLTFExporter } = await import(/* @vite-ignore */ GLTF_EXPORTER_URL)
      const { USDZExporter } = await import(/* @vite-ignore */ USDZ_EXPORTER_URL)
      const { RoomEnvironment } = await import(/* @vite-ignore */ ROOM_ENV_URL)
      const { GLTFLoader } = await import(/* @vite-ignore */ GLTF_LOADER_URL)
      if (cancelado) return
      modulesRef.current = { THREE, GLTFExporter, USDZExporter }

      scene = new THREE.Scene()
      scene.background = null

      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
      camera.position.set(0, 6, 9)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      renderer.outputColorSpace = THREE.SRGBColorSpace
      container.appendChild(renderer.domElement)

      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
      pmremGenerator.dispose()

      const tableGeo = new THREE.CircleGeometry(9, 64)
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x2a3a52, roughness: 0.85 })
      const table = new THREE.Mesh(tableGeo, tableMat)
      table.rotation.x = -Math.PI / 2
      table.position.y = -1.2
      table.receiveShadow = true
      scene.add(table)

      scene.add(new THREE.AmbientLight(0xfff2e0, 0.55))
      const dir = new THREE.DirectionalLight(0xfff0d0, 1.4)
      dir.position.set(4, 9, 5)
      dir.castShadow = true
      dir.shadow.mapSize.set(2048, 2048)
      dir.shadow.radius = 4
      scene.add(dir)
      const fill = new THREE.DirectionalLight(0x9db8e8, 0.3)
      fill.position.set(-6, 3, -4)
      scene.add(fill)
      const rim = new THREE.PointLight(0xffe0b0, 0.6, 20)
      rim.position.set(-3, 4, 6)
      scene.add(rim)

      // ---- texturas ----
      function makeBunTopTexture() {
        const size = 512
        const c = document.createElement('canvas')
        c.width = size; c.height = size
        const ctx = c.getContext('2d')
        const grad = ctx.createRadialGradient(size/2, size*0.35, size*0.05, size/2, size*0.4, size*0.55)
        grad.addColorStop(0, '#E8B25E'); grad.addColorStop(1, '#C98A3C')
        ctx.fillStyle = grad; ctx.fillRect(0,0,size,size)
        for (let i=0;i<45;i++){
          const x = size*0.15 + Math.random()*size*0.7, y = size*0.1 + Math.random()*size*0.55
          ctx.save(); ctx.translate(x,y); ctx.rotate(Math.random()*Math.PI)
          ctx.fillStyle = '#F5E6C8'; ctx.beginPath(); ctx.ellipse(0,0,7,3.5,0,0,Math.PI*2); ctx.fill(); ctx.restore()
        }
        return new THREE.CanvasTexture(c)
      }
      function makeBunSideTexture() {
        const size = 256
        const c = document.createElement('canvas')
        c.width = size; c.height = size
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#D9A054'; ctx.fillRect(0,0,size,size)
        for (let i=0;i<200;i++){
          const x = Math.random()*size, y = Math.random()*size
          ctx.fillStyle = Math.random()>0.5 ? 'rgba(150,90,30,0.3)' : 'rgba(240,210,150,0.4)'
          ctx.beginPath(); ctx.arc(x,y,1+Math.random()*2,0,Math.PI*2); ctx.fill()
        }
        const tex = new THREE.CanvasTexture(c); tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(4,1)
        return tex
      }
      function makePattyTexture() {
        const size = 1024
        const c = document.createElement('canvas')
        c.width = size; c.height = size
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#5C3A28'; ctx.fillRect(0,0,size,size)
        ctx.strokeStyle = 'rgba(20,10,5,0.55)'
        ctx.lineWidth = size * 0.035
        for (let i = -2; i < 6; i++) {
          ctx.beginPath()
          ctx.moveTo(i * size * 0.22, 0)
          ctx.lineTo(i * size * 0.22 + size * 0.4, size)
          ctx.stroke()
        }
        for (let i=0;i<320;i++){
          const x = Math.random()*size, y = Math.random()*size
          ctx.fillStyle = Math.random()>0.5 ? 'rgba(30,15,10,0.5)' : 'rgba(120,75,45,0.4)'
          ctx.beginPath(); ctx.arc(x,y,3+Math.random()*7,0,Math.PI*2); ctx.fill()
        }
        return new THREE.CanvasTexture(c)
      }
      function makeCheeseTexture() {
        const size = 1024
        const c = document.createElement('canvas')
        c.width = size; c.height = size
        const ctx = c.getContext('2d')
        const grad = ctx.createRadialGradient(size/2, size/2, size*0.1, size/2, size/2, size/2)
        grad.addColorStop(0, '#F3D98A'); grad.addColorStop(1, '#E8C468')
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill()
        for (let i = 0; i < 90; i++) {
          const a = Math.random() * Math.PI * 2
          const r = Math.pow(Math.random(), 0.5) * size * 0.42
          const x = size/2 + Math.cos(a) * r, y = size/2 + Math.sin(a) * r
          const s = 6 + Math.random() * 16
          ctx.fillStyle = `rgba(193, 58, 34, ${0.5 + Math.random()*0.3})`
          ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI*2); ctx.fill()
        }
        return new THREE.CanvasTexture(c)
      }
      function makeCrustTexture() {
        const size = 1024
        const c = document.createElement('canvas')
        c.width = size; c.height = size
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#D9A054'; ctx.fillRect(0,0,size,size)
        for (let i=0;i<400;i++){
          const x = Math.random()*size, y = Math.random()*size, s = 1+Math.random()*3
          ctx.fillStyle = Math.random()>0.5 ? 'rgba(140,80,20,0.35)' : 'rgba(240,200,140,0.5)'
          ctx.beginPath(); ctx.arc(x,y,s,0,Math.PI*2); ctx.fill()
        }
        const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6,1)
        return tex
      }

      function makeLettuceEdge(radius) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x6FAE4C, roughness: 0.6, side: THREE.DoubleSide })
        const segs = 40
        const shape = new THREE.Shape()
        for (let i=0;i<=segs;i++){
          const a = (i/segs)*Math.PI*2
          const wobble = 1 + Math.sin(a*9)*0.06 + Math.sin(a*17)*0.03
          const x = Math.cos(a)*radius*1.08*wobble, y = Math.sin(a)*radius*1.08*wobble
          if (i===0) shape.moveTo(x,y); else shape.lineTo(x,y)
        }
        const hole = new THREE.Path()
        for (let i=0;i<=segs;i++){
          const a = (i/segs)*Math.PI*2
          hole.lineTo(Math.cos(a)*radius*0.9, Math.sin(a)*radius*0.9)
        }
        shape.holes.push(hole)
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat)
        mesh.rotation.x = -Math.PI/2
        return mesh
      }
      function makeCheeseDrape(radius) {
        const segs = 4
        const shape = new THREE.Shape()
        const s = radius*1.05
        shape.moveTo(-s, -s)
        for (let i=0;i<=segs;i++){
          const t = i/segs, x = -s + t*2*s, droop = Math.sin(t*Math.PI)*radius*0.12
          shape.lineTo(x, s + droop)
        }
        shape.lineTo(s, -s); shape.lineTo(-s, -s)
        const mat = new THREE.MeshPhysicalMaterial({ color: 0xF2C332, roughness: 0.3, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.2, side: THREE.DoubleSide })
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat)
        mesh.rotation.x = -Math.PI/2
        return mesh
      }

      function buildBurger(diameterCm, pattyCount) {
        const group = new THREE.Group()
        const radius = 4.2 * (diameterCm / 12)
        const scaleF = radius/4.2
        let y = 0

        const bottomBun = new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius*0.92, 0.5*scaleF, 48),
          new THREE.MeshStandardMaterial({ map: makeBunSideTexture(), roughness: 0.75, color: 0xE8C378 })
        )
        bottomBun.position.y = y + 0.25*scaleF
        bottomBun.castShadow = true; bottomBun.receiveShadow = true
        group.add(bottomBun)
        y += 0.5*scaleF

        const lettuce = makeLettuceEdge(radius)
        lettuce.position.y = y + 0.03*scaleF
        group.add(lettuce)
        y += 0.1*scaleF

        const tomato = new THREE.Mesh(
          new THREE.CylinderGeometry(radius*0.88, radius*0.88, 0.18*scaleF, 32),
          new THREE.MeshStandardMaterial({ color: 0xD8402C, roughness: 0.3 })
        )
        tomato.position.y = y + 0.09*scaleF
        group.add(tomato)
        y += 0.18*scaleF

        const pattyMat = new THREE.MeshStandardMaterial({ map: makePattyTexture(), roughness: 0.6 })
        for (let p = 0; p < pattyCount; p++) {
          const patty = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.95, radius*0.9, 0.35*scaleF, 32), pattyMat)
          patty.position.y = y + 0.175*scaleF
          patty.castShadow = true
          group.add(patty)
          y += 0.35*scaleF

          const cheeseDrape = makeCheeseDrape(radius*0.85)
          cheeseDrape.position.y = y + 0.02*scaleF
          group.add(cheeseDrape)
          y += 0.08*scaleF
        }

        const topBun = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 48, 24, 0, Math.PI*2, 0, Math.PI*0.42),
          new THREE.MeshStandardMaterial({ map: makeBunTopTexture(), roughness: 0.7, color: 0xEBC583 })
        )
        topBun.scale.set(1, 0.38, 1)
        topBun.position.y = y
        topBun.castShadow = true
        group.add(topBun)

        const totalHeight = y + radius*0.4
        const maxDim = Math.max(radius*2, totalHeight)
        return { group, cameraDistance: maxDim * 2.1, cameraTargetY: totalHeight * 0.45 }
      }

      function addToppings(group, radius, doughHeight) {
        const topY = doughHeight + 0.09
        const scaleF = radius/5
        const pepMat = new THREE.MeshStandardMaterial({ color: 0xB23A2E, roughness: 0.35, metalness: 0.15 })
        const pepEdgeMat = new THREE.MeshStandardMaterial({ color: 0x7A2018, roughness: 0.4 })
        const oliveMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.3, metalness: 0.2 })
        const basilMat = new THREE.MeshStandardMaterial({ color: 0x2E6B2E, roughness: 0.5, side: THREE.DoubleSide })

        function makePepperoni(s) {
          const g = new THREE.Group()
          g.add(new THREE.Mesh(new THREE.CylinderGeometry(s, s*0.92, s*0.22, 20), pepMat))
          const ring = new THREE.Mesh(new THREE.TorusGeometry(s*0.94, s*0.08, 8, 20), pepEdgeMat)
          ring.rotation.x = Math.PI/2
          g.add(ring)
          return g
        }
        function makeOlive(s) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(s*0.55, s*0.32, 10, 16), oliveMat)
          ring.rotation.x = Math.PI/2
          return ring
        }
        function makeBasil(s) {
          const shape = new THREE.Shape()
          shape.moveTo(0, s)
          shape.quadraticCurveTo(s*0.7, s*0.5, 0, -s)
          shape.quadraticCurveTo(-s*0.7, s*0.5, 0, s)
          const leaf = new THREE.Mesh(new THREE.ShapeGeometry(shape), basilMat)
          leaf.rotation.x = -Math.PI/2
          return leaf
        }
        function randPos(margin, minDist, placed) {
          for (let attempt = 0; attempt < 30; attempt++) {
            const a = Math.random()*Math.PI*2
            const r = Math.sqrt(Math.random()) * radius * margin
            const x = Math.cos(a)*r, z = Math.sin(a)*r
            let ok = true
            for (const [px,pz] of placed) { if (Math.hypot(x-px, z-pz) < minDist) { ok = false; break } }
            if (ok) { placed.push([x,z]); return [x,z] }
          }
          const a = Math.random()*Math.PI*2
          const r = Math.sqrt(Math.random()) * radius * margin
          const x = Math.cos(a)*r, z = Math.sin(a)*r
          placed.push([x,z])
          return [x,z]
        }
        const placed = []
        const pepR = 0.55*scaleF
        for (let i=0;i<9;i++) { const [x,z] = randPos(0.75, pepR*1.7, placed); const p = makePepperoni(pepR); p.position.set(x, topY, z); p.rotation.y = Math.random()*Math.PI; group.add(p) }
        for (let i=0;i<7;i++) { const [x,z] = randPos(0.72, pepR*1.4, placed); const o = makeOlive(0.32*scaleF); o.position.set(x, topY+0.02, z); group.add(o) }
        for (let i=0;i<8;i++) { const [x,z] = randPos(0.7, pepR*1.1, placed); const b = makeBasil(0.28*scaleF); b.position.set(x, topY+0.03, z); b.rotation.z = Math.random()*Math.PI*2; group.add(b) }
      }

      function buildPizza(diameterCm, slices) {
        const group = new THREE.Group()
        const radius = 5 * (diameterCm / 40)
        const doughHeight = 0.42
        const segs = 80
        const doughShape = new THREE.Shape()
        for (let i = 0; i <= segs; i++) {
          const a = (i/segs) * Math.PI * 2
          const wobble = 1 + (Math.sin(a*7) * 0.012) + (Math.sin(a*13)*0.008)
          const x = Math.cos(a) * radius * wobble, y = Math.sin(a) * radius * wobble
          if (i===0) doughShape.moveTo(x,y); else doughShape.lineTo(x,y)
        }
        const doughGeo = new THREE.ExtrudeGeometry(doughShape, { depth: doughHeight, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 4, curveSegments: 64 })
        doughGeo.rotateX(-Math.PI/2)
        const crustTex = makeCrustTexture()
        const dough = new THREE.Mesh(doughGeo, new THREE.MeshStandardMaterial({ map: crustTex, roughness: 0.85, color: 0xE0A868 }))
        dough.castShadow = true; dough.receiveShadow = true
        group.add(dough)

        const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.94, radius * 0.09, 20, 80), new THREE.MeshStandardMaterial({ map: crustTex, roughness: 0.8 }))
        rimMesh.rotation.x = Math.PI / 2
        rimMesh.position.y = doughHeight * 0.95
        rimMesh.castShadow = true
        group.add(rimMesh)

        const top = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.86, 64), new THREE.MeshPhysicalMaterial({ map: makeCheeseTexture(), roughness: 0.35, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.25 }))
        top.rotation.x = -Math.PI / 2
        top.position.y = doughHeight + 0.05
        top.receiveShadow = true
        group.add(top)

        const bumpMat = new THREE.MeshStandardMaterial({ color: 0xF3E3B0, roughness: 0.5 })
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * Math.PI * 2, r = radius * 0.83, s = 0.08 + Math.random()*0.1
          const bump = new THREE.Mesh(new THREE.SphereGeometry(s * (radius/5), 6, 6), bumpMat)
          bump.position.set(Math.cos(a)*r, doughHeight + 0.08, Math.sin(a)*r)
          bump.scale.y = 0.35
          group.add(bump)
        }

        const cutMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 1 })
        for (let i = 0; i < slices; i++) {
          const angle = (i / slices) * Math.PI * 2, len = radius * 0.85
          const cut = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, 0.01), cutMat)
          cut.position.set(Math.cos(angle)*len/2, doughHeight + 0.075, Math.sin(angle)*len/2)
          cut.rotation.y = -angle
          group.add(cut)
        }

        addToppings(group, radius, doughHeight)
        const totalHeight = doughHeight + radius*0.15
        return { group, cameraDistance: radius * 2.6, cameraTargetY: totalHeight * 0.3 }
      }

      // ---- carga de modelos 3D realistas (generados con IA), hosteados en Cloudinary ----
      async function cargarModeloRealista(url, correccionRotX = 0, correccionRotZ = 0) {
        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync(url)
        const group = gltf.scene

        group.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true
          }
        })

        if (correccionRotX) {
          group.rotation.x = correccionRotX
        }
        if (correccionRotZ) {
          group.rotation.z = correccionRotZ
        }
        group.updateMatrixWorld(true)

        const box = new THREE.Box3().setFromObject(group)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)

        const wrapper = new THREE.Group()
        wrapper.add(group)
        group.position.set(-center.x, -box.min.y, -center.z)

        const totalHeight = size.y
        const maxDim = Math.max(size.x, size.z, totalHeight)
        return { group: wrapper, cameraDistance: maxDim * 2.4, cameraTargetY: totalHeight * 0.45 }
      }

      // ---- armar según el producto real ----
      let result
      const tipo = producto.tipo_ar
      const configRealista = MODELOS_REALISTAS[tipo]

      if (configRealista?.porCapas) {
        const capas = Math.max(1, Math.min(3, Math.round(producto.medida_ar || 2)))
        const urlCapas = configRealista.porCapas[capas]
        if (urlCapas) {
          result = await cargarModeloRealista(urlCapas, configRealista.rotacionX || 0, configRealista.rotacionZ || 0)
        }
      } else if (configRealista?.url) {
        result = await cargarModeloRealista(configRealista.url, configRealista.rotacionX || 0, configRealista.rotacionZ || 0)
      }

      if (!result) {
        if (tipo === 'pizza') {
          result = buildPizza(producto.medida_ar || 30, 8)
        } else {
          result = buildBurger(12, Math.max(1, Math.round(producto.medida_ar || 2)))
        }
      }
      if (cancelado) return

      groupRef.current = result.group
      scene.add(result.group)
      cameraDistance = result.cameraDistance
      cameraTargetY = result.cameraTargetY

      function animate() {
        animId = requestAnimationFrame(animate)
        camera.position.x = Math.sin(rotX) * cameraDistance
        camera.position.z = Math.cos(rotX) * cameraDistance
        camera.position.y = cameraTargetY + cameraDistance * 0.45
        camera.lookAt(0, cameraTargetY, 0)
        renderer.render(scene, camera)
      }
      animate()
      setCargando(false)
    }

    const onPointerDown = (e) => { isDragging = true; lastX = e.clientX }
    const onPointerUp = () => { isDragging = false }
    const onPointerMove = (e) => { if (!isDragging) return; const dx = e.clientX - lastX; rotX -= dx * 0.008; lastX = e.clientX }
    const onResize = () => {
      if (!camera || !renderer) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', onResize)

    iniciar()

    return () => {
      cancelado = true
      if (animId) cancelAnimationFrame(animId)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      if (renderer) {
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      }
    }
  }, [producto])

  useEffect(() => {
    const mv = mvRef.current
    if (!mv) return
    const onArStatus = (event) => {
      console.log('AR status:', event.detail.status)
      if (event.detail.status === 'failed') {
        setError('Este dispositivo no pudo abrir la cámara AR. Puede que falte "Google Play Services de AR" instalado (buscalo en Play Store).')
        setMostrarHintMesa(false)
      }
      if (event.detail.status === 'session-started') {
        setMostrarHintMesa(false)
      }
    }
    mv.addEventListener('ar-status', onArStatus)
    return () => mv.removeEventListener('ar-status', onArStatus)
  }, [])

  const activarAR = async () => {
    if (abriendoAR || !groupRef.current || !modulesRef.current) return
    setAbriendoAR(true)
    setError(null)
    setMostrarHintMesa(true)
    try {
      const { THREE, GLTFExporter, USDZExporter } = modulesRef.current

      const clone = groupRef.current.clone(true)
      clone.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(clone)
      const size = new THREE.Vector3()
      box.getSize(size)

      const tipo = producto.tipo_ar

      if (tipo === 'lomito_arabe') {
        const longitudObjetivo = (producto.medida_ar || 20) / 100
        const diametroObjetivo = (producto.medida_ar_2 || 8) / 100
        const largoActual = Math.max(size.x, size.z)
        const anchoActual = Math.min(size.x, size.z)
        const escalaLargo = largoActual > 0 ? longitudObjetivo / largoActual : 1
        const escalaAncho = anchoActual > 0 ? diametroObjetivo / anchoActual : 1
        if (size.x >= size.z) {
          clone.scale.set(escalaLargo, (escalaLargo + escalaAncho) / 2, escalaAncho)
        } else {
          clone.scale.set(escalaAncho, (escalaLargo + escalaAncho) / 2, escalaLargo)
        }
      } else {
        const diametroActualEnUnidades = Math.max(size.x, size.z)
        let diametroObjetivoEnMetros
        if (tipo === 'pizza' || tipo === 'sandwich_lomito') {
          diametroObjetivoEnMetros = (producto.medida_ar || 30) / 100
        } else if (tipo === 'chivito') {
          diametroObjetivoEnMetros = (producto.medida_ar || 25) / 100
        } else {
          diametroObjetivoEnMetros = 12 / 100
        }
        const factorEscala = diametroActualEnUnidades > 0
          ? diametroObjetivoEnMetros / diametroActualEnUnidades
          : 1
        clone.scale.setScalar(factorEscala)
      }

      const gltfExporter = new GLTFExporter()
      const glbBuffer = await new Promise((resolve, reject) => {
        gltfExporter.parse(clone, resolve, reject, { binary: true })
      })
      const glbUrl = URL.createObjectURL(new Blob([glbBuffer], { type: 'model/gltf-binary' }))

      const mv = mvRef.current
      mv.src = glbUrl

      try {
        const usdzExporter = new USDZExporter()
        const usdzBuffer = await usdzExporter.parseAsync(clone)
        mv.iosSrc = URL.createObjectURL(new Blob([usdzBuffer], { type: 'model/vnd.usdz+zip' }))
      } catch (usdzErr) {
        console.warn('No se pudo generar USDZ (solo afecta iPhone):', usdzErr)
      }

      const launch = () => { mv.activateAR(); setAbriendoAR(false) }
      if (mv.loaded) launch()
      else mv.addEventListener('load', launch, { once: true })
    } catch (e) {
      console.error(e)
      setError('No se pudo generar el modelo 3D. Probá de nuevo.')
      setAbriendoAR(false)
      setMostrarHintMesa(false)
    }
  }

  const medidaTexto = (() => {
    const t = producto.tipo_ar
    if (t === 'pizza' || t === 'sandwich_lomito') return `${producto.medida_ar} cm de diámetro`
    if (t === 'chivito') return `${producto.medida_ar} cm de largo`
    if (t === 'lomito_arabe') return `${producto.medida_ar} cm de largo × ${producto.medida_ar_2} cm de diámetro`
    return `${producto.medida_ar} capa${producto.medida_ar > 1 ? 's' : ''} de carne`
  })()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'linear-gradient(180deg, #0B1A33 0%, #0F2340 100%)' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(11,26,51,0.9) 0%, rgba(11,26,51,0) 100%)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', color: '#F4F1EA', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E24B3D' }} />
          VALMAI
        </div>
        <button onClick={onClose} style={{ background: 'rgba(244,241,234,0.15)', color: '#F4F1EA', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
          ✕ Cerrar
        </button>
      </div>

      <div style={{ position: 'absolute', top: 60, left: 20, color: '#F4F1EA' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{producto.nombre}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#B9C4D8' }}>{medidaTexto}</p>
      </div>

      {cargando && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 12, color: '#7C8AA3' }}>
          Cargando vista 3D...
        </div>
      )}

      {mostrarHintMesa && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.75)', color: 'white', padding: '16px 24px', borderRadius: 14,
          fontSize: 14, fontWeight: 600, textAlign: 'center', zIndex: 20, maxWidth: 260,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 28 }}>📷</span>
          Apuntá la cámara hacia tu mesa y esperá unos segundos
        </div>
      )}

      <model-viewer ref={mvRef} ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" camera-controls
        style={{ position: 'fixed', width: 10, height: 10, opacity: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(15, 35, 64, 0.85)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(244,241,234,0.1)', padding: '18px 20px calc(18px + env(safe-area-inset-bottom))' }}>
        <button onClick={activarAR} disabled={abriendoAR} style={{
          width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
          background: '#F4F1EA', color: '#0B1A33', fontWeight: 700, fontSize: 14,
          cursor: abriendoAR ? 'default' : 'pointer', opacity: abriendoAR ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {abriendoAR ? '⏳ Abriendo cámara...' : '📱 Ver en tu mesa (AR)'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: error ? '#f87171' : '#7C8AA3', marginTop: 8 }}>
          {error || 'Arrastrá para girar el modelo'}
        </p>
      </div>
    </div>
  )
}
