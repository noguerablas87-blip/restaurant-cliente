import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'

export default function Pedido() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const navigate = useNavigate()
  const { items, quitar, agregar, total, limpiar, local } = useCarrito()
  const [nombre, setNombre] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)

  const color = local?.color_primario || '#1D9E75'

  const confirmar = async () => {
    if (items.length === 0) return
    setEnviando(true)
    try {
      const res = await axios.post(`${API}/pedidos/`, {
        local_id: local.id,
        numero_mesa: mesa ? parseInt(mesa) : null,
        nombre_cliente: nombre || null,
        nota_general: nota || null,
        items: items.map(i => ({
          producto_id: i.id,
          cantidad: i.cantidad,
          nota: i.nota || null
        }))
      })
      limpiar()
      navigate(`/${slug}/estado/${res.data.pedido_id}?mesa=${mesa || ''}`)
    } catch (e) {
      alert('Error al enviar el pedido. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: color, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h2 style={{ color: 'white', margin: 0, fontSize: 18 }}>Tu pedido</h2>
        {mesa && <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>Mesa {mesa}</span>}
      </div>

      <div style={{ padding: 16, paddingBottom: 120 }}>

        {/* Items */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{item.nombre}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>Gs. {item.precio.toLocaleString()} c/u</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => quitar(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${color}`, background: 'white', color: color, fontSize: 16, cursor: 'pointer' }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.cantidad}</span>
                <button onClick={() => agregar(item)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: color, color: 'white', fontSize: 16, cursor: 'pointer' }}>+</button>
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: color, minWidth: 80, textAlign: 'right', fontSize: 14 }}>
                Gs. {(item.precio * item.cantidad).toLocaleString()}
              </p>
            </div>
          ))}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: color }}>Gs. {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Datos opcionales */}
        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 15 }}>Datos opcionales</p>
          <input
            placeholder="Tu nombre (opcional)"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '10px 12px', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
          />
          <textarea
            placeholder="Nota para la cocina (opcional) — ej: sin cebolla, bien cocido..."
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={3}
            style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '10px 12px', fontSize: 14, resize: 'none', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {/* Pago */}
        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 15 }}>Pago</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#555', fontSize: 14 }}>
            <span style={{ fontSize: 20 }}>💵</span>
            <span>Efectivo al momento de recibir</span>
          </div>
        </div>
      </div>

      {/* Botón confirmar */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: 16, background: 'white', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
        <button onClick={confirmar} disabled={enviando || items.length === 0} style={{
          width: '100%', background: enviando ? '#ccc' : color,
          color: 'white', border: 'none', borderRadius: 16,
          padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer'
        }}>
          {enviando ? 'Enviando pedido...' : `Confirmar pedido — Gs. ${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}