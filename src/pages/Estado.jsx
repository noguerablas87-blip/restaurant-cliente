import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'
const SEGUNDOS_LIMPIEZA = 10

// ── Animaciones SVG ──────────────────────────────────────────────────────────

function AnimacionRecibido({ color }) {
  return (
    <div style={{ width: 120, height: 120, margin: '0 auto' }}>
      <style>{`
        @keyframes tipear { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dot-pulse1 { 0%,100%{opacity:0.2} 25%{opacity:1} }
        @keyframes dot-pulse2 { 0%,100%{opacity:0.2} 50%{opacity:1} }
        @keyframes dot-pulse3 { 0%,100%{opacity:0.2} 75%{opacity:1} }
        .f1{animation:tipear 0.4s ease-in-out infinite}
        .f2{animation:tipear 0.4s ease-in-out infinite 0.13s}
        .f3{animation:tipear 0.4s ease-in-out infinite 0.26s}
        .cur{animation:cursor-blink 0.8s step-end infinite}
        .dp1{animation:dot-pulse1 1.2s ease-in-out infinite}
        .dp2{animation:dot-pulse2 1.2s ease-in-out infinite}
        .dp3{animation:dot-pulse3 1.2s ease-in-out infinite}
      `}</style>
      <svg width="100%" viewBox="0 0 80 90">
        <rect x="10" y="58" width="60" height="6" rx="2" fill="#d4a96a"/>
        <rect x="14" y="64" width="4" height="18" rx="1" fill="#b8905a"/>
        <rect x="62" y="64" width="4" height="18" rx="1" fill="#b8905a"/>
        <rect x="18" y="38" width="44" height="22" rx="3" fill="#444"/>
        <rect x="20" y="40" width="40" height="18" rx="2" fill={color}/>
        <rect x="22" y="42" width="20" height="2" rx="1" fill="rgba(255,255,255,0.7)"/>
        <rect x="22" y="46" width="14" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
        <rect className="cur" x="37" y="46" width="1.5" height="2" fill="white"/>
        <rect x="16" y="60" width="48" height="3" rx="1.5" fill="#555"/>
        <circle cx="40" cy="20" r="10" fill="#f5c89a"/>
        <ellipse cx="40" cy="13" rx="10" ry="5" fill="#5a3825"/>
        <rect x="30" y="29" width="20" height="16" rx="4" fill={color}/>
        <g className="f1"><rect x="16" y="48" width="14" height="5" rx="2.5" fill="#f5c89a"/></g>
        <g className="f2"><rect x="50" y="48" width="14" height="5" rx="2.5" fill="#f5c89a"/></g>
        <circle className="dp1" cx="29" cy="55" r="2" fill={color}/>
        <circle className="dp2" cx="40" cy="55" r="2" fill={color}/>
        <circle className="dp3" cx="51" cy="55" r="2" fill={color}/>
      </svg>
    </div>
  )
}

function AnimacionPreparando() {
  return (
    <div style={{ width: 120, height: 130, margin: '0 auto' }}>
      <style>{`
        @keyframes brazo-cook { 0%,100%{transform-origin:45px 52px;transform:rotate(0deg)} 50%{transform-origin:45px 52px;transform:rotate(-18deg)} }
        @keyframes vapor-a { 0%{transform:translateY(0) scaleX(1);opacity:0.7} 100%{transform:translateY(-14px) scaleX(1.4);opacity:0} }
        @keyframes vapor-b { 0%{transform:translateY(0) scaleX(1);opacity:0.6} 100%{transform:translateY(-12px) scaleX(0.8);opacity:0} }
        .bc{animation:brazo-cook 0.9s ease-in-out infinite}
        .va{animation:vapor-a 1.2s ease-out infinite}
        .vb{animation:vapor-b 1.2s ease-out infinite 0.4s}
      `}</style>
      <svg width="100%" viewBox="0 0 80 100">
        <rect x="15" y="68" width="50" height="8" rx="3" fill="#888"/>
        <ellipse cx="30" cy="68" r="7" fill="#666"/>
        <ellipse cx="50" cy="68" r="7" fill="#666"/>
        <ellipse cx="30" cy="64" rx="12" ry="5" fill="#333"/>
        <rect x="42" y="62" width="14" height="3" rx="1.5" fill="#444"/>
        <ellipse className="va" cx="26" cy="59" rx="3" ry="2" fill="none" stroke="#aaa" strokeWidth="1.5"/>
        <ellipse className="vb" cx="33" cy="58" rx="2" ry="1.5" fill="none" stroke="#aaa" strokeWidth="1.5"/>
        <rect x="42" y="42" width="22" height="20" rx="4" fill="#e8e0d0"/>
        <rect x="44" y="46" width="18" height="14" rx="2" fill="white"/>
        <rect x="50" y="42" width="6" height="4" rx="1" fill="white"/>
        <rect x="46" y="26" width="16" height="6" rx="2" fill="white"/>
        <rect x="44" y="22" width="20" height="8" rx="4" fill="white"/>
        <circle cx="54" cy="32" r="9" fill="#f5c89a"/>
        <g className="bc">
          <rect x="34" y="50" width="12" height="5" rx="2.5" fill="#f5c89a"/>
          <rect x="24" y="52" width="12" height="3" rx="1.5" fill="#999"/>
          <ellipse cx="24" cy="53" rx="4" ry="3" fill="#bbb"/>
        </g>
        <rect x="64" y="50" width="10" height="4" rx="2" fill="#f5c89a"/>
      </svg>
    </div>
  )
}

function AnimacionListo() {
  return (
    <div style={{ width: 120, height: 130, margin: '0 auto' }}>
      <style>{`
        @keyframes caminar { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
        @keyframes p-izq { 0%,100%{transform-origin:36px 72px;transform:rotate(0deg)} 50%{transform-origin:36px 72px;transform:rotate(18deg)} }
        @keyframes p-der { 0%,100%{transform-origin:44px 72px;transform:rotate(0deg)} 50%{transform-origin:44px 72px;transform:rotate(-18deg)} }
        @keyframes plato-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        .cam{animation:caminar 0.5s ease-in-out infinite}
        .pi{animation:p-izq 0.5s ease-in-out infinite}
        .pd{animation:p-der 0.5s ease-in-out infinite}
        .pla{animation:plato-float 0.5s ease-in-out infinite}
      `}</style>
      <svg width="100%" viewBox="0 0 80 100">
        <g className="cam">
          <g className="pla">
            <ellipse cx="40" cy="28" rx="22" ry="5" fill="#ddd"/>
            <path d="M20 28 Q40 10 60 28" fill="#eee" stroke="#ccc" strokeWidth="0.5"/>
            <ellipse cx="40" cy="28" rx="22" ry="5" fill="none" stroke="#ccc" strokeWidth="0.5"/>
            <circle cx="40" cy="16" r="3" fill="#ccc"/>
          </g>
          <rect x="54" y="30" width="5" height="18" rx="2.5" fill="#f5c89a"/>
          <rect x="30" y="48" width="24" height="24" rx="4" fill="#1a1a2e"/>
          <rect x="35" y="48" width="14" height="24" rx="2" fill="white"/>
          <rect x="38" y="48" width="4" height="16" rx="1" fill="#c0392b"/>
          <circle cx="42" cy="38" r="10" fill="#f5c89a"/>
          <ellipse cx="42" cy="30" rx="10" ry="4" fill="#2c1a0e"/>
          <rect x="22" y="52" width="10" height="5" rx="2.5" fill="#1a1a2e"/>
          <g className="pi"><rect x="30" y="70" width="9" height="20" rx="4" fill="#111"/><rect x="28" y="86" width="12" height="5" rx="2" fill="#333"/></g>
          <g className="pd"><rect x="43" y="70" width="9" height="20" rx="4" fill="#111"/><rect x="42" y="86" width="12" height="5" rx="2" fill="#333"/></g>
        </g>
      </svg>
    </div>
  )
}

function AnimacionEntregado() {
  return (
    <div style={{ width: 100, height: 100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes check-draw { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
        @keyframes circle-scale { 0%{transform:scale(0.8);opacity:0.5} 100%{transform:scale(1);opacity:1} }
        .chk{stroke-dasharray:60;animation:check-draw 0.6s ease forwards}
        .cir{animation:circle-scale 0.6s ease forwards}
      `}</style>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle className="cir" cx="40" cy="40" r="32" fill="#27ae60" opacity="0.15"/>
        <circle cx="40" cy="40" r="28" fill="none" stroke="#27ae60" strokeWidth="2"/>
        <polyline className="chk" points="24,40 35,52 56,28" fill="none" stroke="#27ae60" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}


// ── Sonido listo Web Audio API ────────────────────────────────────────────────
function sonarPedidoListo() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Melodía alegre: do-mi-sol
    [[0, 523], [0.2, 659], [0.4, 784], [0.6, 1047]].forEach(([t, freq]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.4)
    })
  } catch (e) {}
}

// ── Countdown minutos ────────────────────────────────────────────────────────

function CountdownMinutos({ tiempoEstimado, minutosTranscurridos }) {
  const [segundos, setSegundos] = useState(0)
  useEffect(() => {
    setSegundos(0)
    const tick = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(tick)
  }, [tiempoEstimado, minutosTranscurridos])
  if (tiempoEstimado == null) return null
  const transcurrido = (minutosTranscurridos || 0) + segundos / 60
  const restante = Math.max(0, Math.ceil(tiempoEstimado - transcurrido))
  return (
    <div style={{
      background: restante <= 5 ? '#fff5f5' : '#eef6ff',
      borderRadius: 12, padding: '12px 14px', textAlign: 'center',
      border: `1px solid ${restante <= 5 ? '#fecaca' : '#c3daf5'}`,
      marginTop: 10,
    }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: restante <= 5 ? '#e74c3c' : '#2980b9' }}>
        {restante === 0 ? '¡Casi listo!' : 'Tiempo restante'}
      </p>
      <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 32, lineHeight: 1, color: restante <= 5 ? '#c0392b' : '#1a5276' }}>
        {restante}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 5, color: restante <= 5 ? '#e74c3c' : '#2980b9' }}>min</span>
      </p>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

const PASOS = ['Recibido', 'Preparando', 'Listo']
const PASO_NUM = { pendiente: 1, aceptado: 2, listo: 3, entregado: 4, cancelado: 0 }

export default function Estado() {
  const { slug, pedidoId } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const navigate = useNavigate()
  const { local } = useCarrito()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)
  const pedidosAntRef = useRef([])

  // Detectar cuando un pedido cambia a listo y sonar
  useEffect(() => {
    const ant = pedidosAntRef.current
    pedidos.forEach(p => {
      const anterior = ant.find(a => a.id === p.id)
      if (anterior && anterior.estado !== 'listo' && p.estado === 'listo') {
        sonarPedidoListo()
      }
    })
    pedidosAntRef.current = pedidos
  }, [pedidos])

  const color = local?.color_primario || '#b91c1c'

  const cargarPedidos = async () => {
    try {
      let data = []
      if (mesa && slug) {
        const res = await axios.get(`${API}/pedidos/mesa/${slug}/${mesa}`)
        data = res.data
      } else {
        const res = await axios.get(`${API}/pedidos/${pedidoId}/estado`)
        data = [res.data]
      }
      setPedidos(data)
      const todosEntregados = data.length > 0 && data.every(p => p.estado === 'entregado')
      if (todosEntregados) {
        localStorage.removeItem('pedidoActivo')
      }
    const hayPendientes = data.some(p => ['pendiente', 'aceptado'].includes(p.estado))
      if (todosEntregados && !hayPendientes) {
  const maxSegs = Math.max(...data.map(p => p.segundos_desde_entrega || 0))
  const restante = Math.max(0, SEGUNDOS_LIMPIEZA - maxSegs)
  if (restante === 0) {
    localStorage.removeItem('pedidoActivo')
    navigate(`/${slug}?mesa=${mesa}`)
    return
  }
  setCountdown(c => c === null ? restante : c)
      } else {
        setCountdown(null)
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
      }
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  const cancelarPedido = async (id) => {
    if (!window.confirm('¿Cancelar este pedido?')) return
    try {
      await axios.patch(`${API}/pedidos/${id}/cancelar-cliente`)
      localStorage.removeItem('pedidoActivo')
      cargarPedidos()
    } catch (e) {
      alert('No se pudo cancelar el pedido.')
    }
  }

  useEffect(() => {
    cargarPedidos()
    const interval = setInterval(cargarPedidos, 15000)
    return () => clearInterval(interval)
  }, [pedidoId, slug, mesa])

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { navigate(`/${slug}?mesa=${mesa}`); return }
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); navigate(`/${slug}?mesa=${mesa}`); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [countdown])

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#252525', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ color: '#555', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>CARGANDO...</p>
      </div>
    </div>
  )

  // Pantalla buen provecho
  if (countdown !== null) return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#111111', fontFamily: "'Segoe UI', system-ui" }}>
      <div style={{ background: color, padding: '22px 16px 28px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700 }}>Seguimiento del pedido</h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', margin: '4px 0 0', fontSize: 13 }}>{mesa ? `Mesa ${mesa}` : ''}</p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#1e1e1e', borderRadius: 20, padding: 32, textAlign: 'center', border: '1px solid #2a2a2a', width: '100%' }}>
          <AnimacionEntregado />
          <h2 style={{ margin: '12px 0 0', fontSize: 22, fontWeight: 800, color: '#27ae60' }}>¡Buen provecho!</h2>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>Tu pedido fue entregado</p>
          <div style={{ marginTop: 24, background: '#252525', borderRadius: 12, padding: '16px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Nueva sesión en</p>
            <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 36, color: 'white', lineHeight: 1 }}>{countdown}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>segundos</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (pedidos.length === 0) {
    if (mesa && slug) navigate(`/${slug}?mesa=${mesa}`)
    return null
  }

  const hayActivos = pedidos.some(p => ['pendiente', 'aceptado', 'listo'].includes(p.estado))

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#111111', fontFamily: "'Segoe UI', system-ui" }}>

      <div style={{ background: color, padding: '22px 16px 28px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700 }}>Seguimiento del pedido</h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', margin: '4px 0 0', fontSize: 13 }}>
          {mesa ? `Mesa ${mesa}` : `Pedido #${pedidoId}`}
        </p>
      </div>

      <div style={{ padding: '14px 14px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pedidos.map((p, idx) => {
          const pasoActual = PASO_NUM[p.estado] || 0
          const estadoColor = { pendiente: '#e67e22', aceptado: '#2980b9', listo: '#27ae60', entregado: '#27ae60', cancelado: '#e74c3c' }[p.estado] || color
          const estadoLabel = { pendiente: 'Recibido', aceptado: 'Preparando', listo: '¡Listo!', entregado: 'Entregado', cancelado: 'Cancelado' }[p.estado] || ''

          return (
            <div key={p.id || idx} style={{ background: '#1e1e1e', borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2a2a' }}>

              {/* Animación del estado */}
              <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
                {p.estado === 'pendiente' && <AnimacionRecibido color={color} />}
                {p.estado === 'aceptado' && <AnimacionPreparando />}
                {p.estado === 'listo' && <AnimacionListo />}
                {p.estado === 'entregado' && <AnimacionEntregado />}
                {p.estado === 'cancelado' && <div style={{ fontSize: 52, lineHeight: 1 }}>❌</div>}
                <p style={{ margin: '8px 0 0', fontWeight: 800, fontSize: 18, color: estadoColor }}>{estadoLabel}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Pedido #{p.numero_diario || p.id || p.pedido_id}</p>
              </div>

              {/* Cabecera total */}
              <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{p.items?.length} producto{p.items?.length !== 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>Gs. {parseInt(p.total).toLocaleString()}</span>
              </div>

              {/* Items */}
              <div style={{ padding: '0 16px 12px', borderTop: '1px solid #2a2a2a', paddingTop: 10 }}>
                {p.items?.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#666', marginBottom: 3, display: 'flex', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{item.cantidad}×</span>
                    <span>{item.nombre}</span>
                    {item.nota && <span style={{ color: '#555' }}>— {item.nota}</span>}
                  </div>
                ))}
                {p.nota_general && (
                  <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 6, background: '#252525', borderRadius: 8, padding: '6px 8px' }}>
                    📝 {p.nota_general}
                  </div>
                )}
              </div>

              {/* Countdown preparando */}
              {p.estado === 'aceptado' && (
                <div style={{ padding: '0 16px 14px' }}>
                  <CountdownMinutos tiempoEstimado={p.tiempo_estimado} minutosTranscurridos={p.minutos_transcurridos} />
                </div>
              )}

              {/* Pendiente */}
              {p.estado === 'pendiente' && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: 'rgba(230,126,34,0.1)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', border: '1px solid rgba(230,126,34,0.2)' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#e67e22' }}>Esperando confirmación del local...</p>
                    {p.tiempo_estimado && <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#e67e22' }}>~{p.tiempo_estimado} min estimado</p>}
                  </div>
                  <button
                    onClick={() => cancelarPedido(p.id || p.pedido_id)}
                    style={{
                      width: '100%', background: 'transparent',
                      border: '1.5px solid #444', borderRadius: 12,
                      padding: '10px', fontSize: 13, fontWeight: 600,
                      color: '#888', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    ✕ Cancelar pedido
                  </button>
                </div>
              )}

              {/* Listo */}
              {p.estado === 'listo' && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div style={{ background: '#f0fff4', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#27ae60', fontWeight: 700, fontSize: 14 }}>¡Tu pedido está listo! 🎉</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>El mozo te lo llevará en un momento</p>
                  </div>
                </div>
              )}

              {/* Pasos */}
              {p.estado !== 'cancelado' && p.estado !== 'entregado' && (
                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {PASOS.map((paso, i) => {
                      const done = pasoActual > i
                      const current = pasoActual === i + 1
                      return (
                        <div key={paso} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                          {i > 0 && <div style={{ position: 'absolute', top: 14, right: '50%', left: '-50%', height: 2, background: done || current ? color : '#e0e0e0', transition: 'background 0.4s ease' }} />}
                          <div style={{ width: 28, height: 28, borderRadius: '50%', zIndex: 1, background: done || current ? color : '#ebebeb', color: done || current ? 'white' : '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? 12 : 11, fontWeight: 700 }}>
                            {done ? '✓' : i + 1}
                          </div>
                          <p style={{ margin: '5px 0 0', fontSize: 10, textAlign: 'center', color: done || current ? color : '#bbb', fontWeight: done || current ? 700 : 400 }}>{paso}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {hayActivos && (
          <div style={{ background: '#1e1e1e', borderRadius: 14, padding: '12px 16px', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Esta página se actualiza automáticamente</p>
          </div>
        )}
      </div>

      {hayActivos && mesa && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '10px 14px 16px', background: '#1e1e1e', borderTop: '1px solid #f0f0f0', zIndex: 100 }}>
          <button onClick={() => navigate(`/${slug}?mesa=${mesa}`)} style={{ width: '100%', background: color, color: 'white', border: 'none', borderRadius: 14, padding: '15px 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            + Agregar más items al pedido
          </button>
        </div>
      )}
    </div>
  )
}