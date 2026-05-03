import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'

const ESTADOS = {
  pendiente:  { label: 'Recibido',      emoji: '📋', paso: 1, color: '#FF9800' },
  aceptado:   { label: 'Preparando',    emoji: '👨‍🍳', paso: 2, color: '#2196F3' },
  listo:      { label: '¡Listo!',       emoji: '🍽', paso: 3, color: '#4CAF50' },
  entregado:  { label: 'Entregado',     emoji: '✅', paso: 4, color: '#4CAF50' },
  cancelado:  { label: 'Cancelado',     emoji: '❌', paso: 0, color: '#F44336' },
}

export default function Estado() {
  const { slug, pedidoId } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const { local } = useCarrito()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)

  const color = local?.color_primario || '#1D9E75'

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
    // Polling cada 5 segundos para actualizar el estado
    const interval = setInterval(cargarEstado, 5000)
    return () => clearInterval(interval)
  }, [pedidoId])

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Cargando...</p>
    </div>
  )

  if (!pedido) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <p>Pedido no encontrado</p>
    </div>
  )

  const estadoInfo = ESTADOS[pedido.estado] || ESTADOS.pendiente
  const progreso = (estadoInfo.paso / 3) * 100

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: color, padding: '24px 16px 80px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: 18 }}>Seguimiento del pedido</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: 14 }}>
          Pedido #{pedido.pedido_id} {mesa ? `· Mesa ${mesa}` : ''}
        </p>
      </div>

      <div style={{ padding: 16, marginTop: -40 }}>

        {/* Estado principal */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>{estadoInfo.emoji}</div>
          <h2 style={{ margin: 0, fontSize: 24, color: estadoInfo.color }}>{estadoInfo.label}</h2>

          {pedido.estado === 'aceptado' && pedido.tiempo_estimado && (
            <div style={{ marginTop: 16, background: '#f0f7ff', borderRadius: 12, padding: 12 }}>
              <p style={{ margin: 0, color: '#2196F3', fontSize: 14 }}>⏱ Tiempo estimado</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 22, color: '#1565C0' }}>
                ~{pedido.tiempo_estimado} min
              </p>
            </div>
          )}

          {pedido.estado === 'listo' && (
            <div style={{ marginTop: 16, background: '#f0fff4', borderRadius: 12, padding: 12 }}>
              <p style={{ margin: 0, color: '#4CAF50', fontWeight: 600 }}>Tu pedido está listo 🎉</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>El mozo te lo llevará en un momento</p>
            </div>
          )}

          {pedido.estado === 'pendiente' && (
            <p style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Esperando confirmación del local...</p>
          )}

          {pedido.estado === 'cancelado' && (
            <div style={{ marginTop: 16, background: '#fff0f0', borderRadius: 12, padding: 12 }}>
              <p style={{ margin: 0, color: '#F44336', fontSize: 14 }}>Tu pedido fue cancelado. Consultá al mozo.</p>
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        {pedido.estado !== 'cancelado' && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              {['Recibido', 'Preparando', 'Listo'].map((paso, i) => (
                <div key={paso} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px',
                    background: estadoInfo.paso > i ? color : '#e0e0e0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 14
                  }}>
                    {estadoInfo.paso > i ? '✓' : i + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: estadoInfo.paso > i ? color : '#aaa', fontWeight: estadoInfo.paso > i ? 600 : 400 }}>{paso}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#e0e0e0', borderRadius: 4, height: 6 }}>
              <div style={{ background: color, borderRadius: 4, height: 6, width: `${Math.min(progreso, 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
            {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado'
              ? '🔄 Esta página se actualiza automáticamente'
              : '¡Gracias por tu pedido! Buen provecho 😊'}
          </p>
        </div>
      </div>
    </div>
  )
}