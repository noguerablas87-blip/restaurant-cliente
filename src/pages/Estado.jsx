import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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

export default function Estado() {
  const { slug, pedidoId } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const { local } = useCarrito()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)

  const color = local?.color_primario || '#b91c1c'

  const cargarEstado = async () => {
    try {
      const res = await axios.get(`${API}/pedidos/${pedidoId}/estado`)
      setPedido(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarEstado()
    const interval = setInterval(cargarEstado, 5000)
    return () => clearInterval(interval)
  }, [pedidoId])

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ color: '#bbb', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>CARGANDO...</p>
      </div>
    </div>
  )

  if (!pedido) return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#999' }}>Pedido no encontrado</p>
    </div>
  )

  const estadoInfo = ESTADOS[pedido.estado] || ESTADOS.pendiente
  const pasoActual = estadoInfo.paso

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#f4f4f4', fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>

      {/* ── HEADER ── */}
      <div style={{ background: color, padding: '22px 16px 28px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700 }}>
          Seguimiento del pedido
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', margin: '4px 0 0', fontSize: 13 }}>
          Pedido #{pedido.pedido_id}{mesa ? ` · Mesa ${mesa}` : ''}
        </p>
      </div>

      <div style={{ padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── ESTADO PRINCIPAL ── */}
        <div style={{
          background: 'white', borderRadius: 16,
          padding: '24px 16px', textAlign: 'center',
          border: '1px solid #efefef',
        }}>
          <div style={{ fontSize: 52, marginBottom: 10, lineHeight: 1 }}>{estadoInfo.emoji}</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: estadoInfo.color }}>
            {estadoInfo.label}
          </h2>

          {pedido.estado === 'pendiente' && (
            <p style={{ marginTop: 8, color: '#aaa', fontSize: 13 }}>
              Esperando confirmación del local...
            </p>
          )}
          {pedido.estado === 'listo' && (
            <div style={{ marginTop: 14, background: '#f0fff4', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ margin: 0, color: '#27ae60', fontWeight: 700, fontSize: 14 }}>
                ¡Tu pedido está listo! 🎉
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>El mozo te lo llevará en un momento</p>
            </div>
          )}
          {pedido.estado === 'cancelado' && (
            <div style={{ marginTop: 14, background: '#fff5f5', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ margin: 0, color: '#e74c3c', fontSize: 13 }}>
                Tu pedido fue cancelado. Consultá al mozo.
              </p>
            </div>
          )}
          {pedido.estado === 'entregado' && (
            <p style={{ marginTop: 8, color: '#aaa', fontSize: 13 }}>
              ¡Gracias por tu pedido! Buen provecho 😊
            </p>
          )}
        </div>

        {/* ── TIEMPO ESTIMADO (cuando está aceptado) ── */}
        {pedido.estado === 'aceptado' && pedido.tiempo_estimado && (
          <div style={{
            background: '#eef6ff', borderRadius: 16,
            padding: '16px', textAlign: 'center',
            border: '1px solid #c3daf5',
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#2980b9', letterSpacing: 1, textTransform: 'uppercase' }}>
              Tiempo estimado
            </p>
            <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 32, color: '#1a5276', lineHeight: 1 }}>
              {pedido.tiempo_estimado}
              <span style={{ fontSize: 14, fontWeight: 500, color: '#2980b9', marginLeft: 6 }}>min</span>
            </p>
          </div>
        )}

        {/* ── PASOS / PROGRESO ── */}
        {pedido.estado !== 'cancelado' && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '18px 16px',
            border: '1px solid #efefef',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {PASOS.map((paso, i) => {
                const done = pasoActual > i
                const current = pasoActual === i + 1
                return (
                  <div key={paso} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Línea conectora izquierda */}
                    {i > 0 && (
                      <div style={{
                        position: 'absolute', top: 15, right: '50%', left: '-50%',
                        height: 2,
                        background: done || current ? color : '#e0e0e0',
                        transition: 'background 0.4s ease',
                      }} />
                    )}
                    {/* Círculo */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', zIndex: 1,
                      background: done || current ? color : '#ebebeb',
                      color: done || current ? 'white' : '#bbb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: done ? 14 : 13, fontWeight: 700,
                      transition: 'all 0.3s ease',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    {/* Label */}
                    <p style={{
                      margin: '6px 0 0', fontSize: 11, textAlign: 'center',
                      color: done || current ? color : '#bbb',
                      fontWeight: done || current ? 700 : 400,
                      transition: 'color 0.3s ease',
                    }}>{paso}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ACTUALIZACIÓN AUTOMÁTICA ── */}
        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '13px 16px',
            border: '1px solid #efefef',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e', flexShrink: 0,
              animation: 'pulse 2s infinite',
            }} />
            <p style={{ margin: 0, fontSize: 13, color: '#999' }}>
              Esta página se actualiza automáticamente
            </p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
