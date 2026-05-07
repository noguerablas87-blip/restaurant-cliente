import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'

const ESTADOS = {
  pendiente: { label: 'Recibido',   emoji: '📋', paso: 1, color: '#e67e22' },
  aceptado:  { label: 'Preparando', emoji: '👨‍🍳', paso: 2, color: '#2980b9' },
  listo:     { label: '¡Listo!',    emoji: '🍽️', paso: 3, color: '#27ae60' },
  entregado: { label: 'Entregado',  emoji: '✅', paso: 4, color: '#27ae60' },
  cancelado: { label: 'Cancelado',  emoji: '❌', paso: 0, color: '#e74c3c' },
}

const PASOS = ['Recibido', 'Preparando', 'Listo']
const SEGUNDOS_LIMPIEZA = 120 // 2 minutos antes de redirigir al menú

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
        {restante}
        <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 5, color: restante <= 5 ? '#e74c3c' : '#2980b9' }}>min</span>
      </p>
    </div>
  )
}

export default function Estado() {
  const { slug, pedidoId } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const navigate = useNavigate()
  const { local } = useCarrito()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [countdown, setCountdown] = useState(null) // segundos para redirigir
  const countdownRef = useRef(null)

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

      // Verificar si todos están entregados
      const todosEntregados = data.length > 0 && data.every(p => p.estado === 'entregado')
      if (todosEntregados && data.length > 0) {
        // Calcular cuántos segundos faltan para la redirección
        // basado en el pedido entregado más reciente
        const maxSegundos = Math.max(...data.map(p => p.segundos_desde_entrega || 0))
        const restante = Math.max(0, SEGUNDOS_LIMPIEZA - maxSegundos)
        setCountdown(restante)
      } else {
        // Si hay pedidos activos, cancelar countdown
        setCountdown(null)
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  // Refresco del backend cada 15s
  useEffect(() => {
    cargarPedidos()
    const interval = setInterval(cargarPedidos, 15000)
    return () => clearInterval(interval)
  }, [pedidoId, slug, mesa])

  // Countdown local de redirección
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      navigate(`/${slug}?mesa=${mesa}`)
      return
    }
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current)
          navigate(`/${slug}?mesa=${mesa}`)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [countdown])

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ color: '#bbb', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>CARGANDO...</p>
      </div>
    </div>
  )

  // Pantalla de "todos entregados" con countdown
  if (countdown !== null) {
    return (
      <div style={{
        maxWidth: 480, margin: '0 auto', minHeight: '100vh',
        background: '#f4f4f4', fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ background: color, padding: '22px 16px 28px', textAlign: 'center' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700 }}>Seguimiento del pedido</h2>
          <p style={{ color: 'rgba(255,255,255,0.78)', margin: '4px 0 0', fontSize: 13 }}>
            {mesa ? `Mesa ${mesa}` : ''}
          </p>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, textAlign: 'center', border: '1px solid #efefef', width: '100%' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#27ae60' }}>¡Buen provecho!</h2>
            <p style={{ margin: '8px 0 0', color: '#aaa', fontSize: 14 }}>Tu pedido fue entregado</p>
            <div style={{ marginTop: 24, background: '#f5f5f5', borderRadius: 12, padding: '16px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#999' }}>Nueva sesión en</p>
              <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 36, color: '#111', lineHeight: 1 }}>{countdown}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#999' }}>segundos</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (pedidos.length === 0) {
  if (mesa && slug) navigate(`/${slug}?mesa=${mesa}`)
  return null
}
  const hayActivos = pedidos.some(p => ['pendiente', 'aceptado', 'listo'].includes(p.estado))

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#f4f4f4', fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>

      <div style={{ background: color, padding: '22px 16px 28px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700 }}>Seguimiento del pedido</h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', margin: '4px 0 0', fontSize: 13 }}>
          {mesa ? `Mesa ${mesa}` : `Pedido #${pedidoId}`}
        </p>
      </div>

      <div style={{ padding: '14px 14px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {pedidos.map((p, idx) => {
          const estadoInfo = ESTADOS[p.estado] || ESTADOS.pendiente
          const pasoActual = estadoInfo.paso

          return (
            <div key={p.id || idx} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #efefef' }}>

              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{estadoInfo.emoji}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: estadoInfo.color }}>{estadoInfo.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>Pedido #{p.id || p.pedido_id}</p>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>
                  Gs. {parseInt(p.total).toLocaleString()}
                </span>
              </div>

              <div style={{ padding: '12px 16px' }}>
                {p.items?.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#555', marginBottom: 3, display: 'flex', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{item.cantidad}×</span>
                    <span>{item.nombre}</span>
                    {item.nota && <span style={{ color: '#bbb' }}>— {item.nota}</span>}
                  </div>
                ))}
                {p.nota_general && (
                  <div style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic', marginTop: 6, background: '#fafafa', borderRadius: 8, padding: '6px 8px' }}>
                    📝 {p.nota_general}
                  </div>
                )}
              </div>

              {p.estado === 'aceptado' && (
                <div style={{ padding: '0 16px 14px' }}>
                  <CountdownMinutos tiempoEstimado={p.tiempo_estimado} minutosTranscurridos={p.minutos_transcurridos} />
                </div>
              )}

              {p.estado === 'pendiente' && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div style={{ background: '#fff8e1', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#e67e22' }}>Esperando confirmación del local...</p>
                    {p.tiempo_estimado && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#e67e22' }}>~{p.tiempo_estimado} min estimado</p>
                    )}
                  </div>
                </div>
              )}

              {p.estado === 'listo' && (
                <div style={{ padding: '0 16px 14px' }}>
                  <div style={{ background: '#f0fff4', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#27ae60', fontWeight: 700, fontSize: 14 }}>¡Tu pedido está listo! 🎉</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>El mozo te lo llevará en un momento</p>
                  </div>
                </div>
              )}

              {p.estado !== 'cancelado' && p.estado !== 'entregado' && (
                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {PASOS.map((paso, i) => {
                      const done = pasoActual > i
                      const current = pasoActual === i + 1
                      return (
                        <div key={paso} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                          {i > 0 && (
                            <div style={{ position: 'absolute', top: 14, right: '50%', left: '-50%', height: 2, background: done || current ? color : '#e0e0e0', transition: 'background 0.4s ease' }} />
                          )}
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
          <div style={{ background: 'white', borderRadius: 14, padding: '12px 16px', border: '1px solid #efefef', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#999' }}>Esta página se actualiza automáticamente</p>
          </div>
        )}
      </div>

      {hayActivos && mesa && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          padding: '10px 14px 16px',
          background: 'white', borderTop: '1px solid #f0f0f0',
          zIndex: 100,
        }}>
          <button
            onClick={() => navigate(`/${slug}?mesa=${mesa}`)}
            style={{
              width: '100%', background: color,
              color: 'white', border: 'none', borderRadius: 14,
              padding: '15px 16px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Agregar más items al pedido
          </button>
        </div>
      )}
    </div>
  )
}
