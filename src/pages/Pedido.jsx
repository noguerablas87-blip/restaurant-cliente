import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'

const METODOS_PAGO = [
  { id: 'efectivo',  icon: '💵', label: 'Efectivo',          sub: 'Al recibir el pedido' },
  { id: 'billetera', icon: '📱', label: 'Billetera digital', sub: 'Tigo Money / Personal Pay' },
  { id: 'tarjeta',   icon: '💳', label: 'Tarjeta',           sub: 'Débito o crédito' },
]

export default function Pedido() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const navigate = useNavigate()
  const { items, quitar, agregar, total, limpiar, local } = useCarrito()

  const [nombre, setNombre] = useState('')
  const [nota, setNota] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [enviando, setEnviando] = useState(false)

  const color = local?.color_primario || '#b91c1c'

  // Total calculado directo de items para garantizar reactividad inmediata
  const totalLocal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const confirmar = async () => {
    if (items.length === 0) return
    setEnviando(true)
    try {
      const res = await axios.post(`${API}/pedidos/`, {
        local_id: local.id,
        numero_mesa: mesa ? parseInt(mesa) : null,
        nombre_cliente: nombre || null,
        nota_general: nota || null,
        metodo_pago: metodoPago,
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

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #333', borderRadius: 10,
    padding: '10px 12px', fontSize: 14,
    background: '#1e1e1e', color: '#ccc',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#111111', fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: color, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none',
          borderRadius: '50%', width: 34, height: 34,
          color: 'white', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>←</button>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700, flex: 1 }}>Tu pedido</h2>
        {mesa && (
          <span style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
          }}>Mesa {mesa}</span>
        )}
      </div>

      <div style={{ padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── ITEMS + TOTAL ── */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{
              padding: '12px 14px',
              borderBottom: idx < items.length - 1 ? '1px solid #f4f4f4' : 'none',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'white' }}>{item.nombre}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>Gs. {item.precio.toLocaleString()} c/u</p>
              </div>

              {/* Control +/- */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <button onClick={() => quitar(item.id)} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `1.5px solid ${color}`, background: '#1e1e1e',
                  color: color, fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, lineHeight: 1,
                }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', fontSize: 15 }}>{item.cantidad}</span>
                <button onClick={() => agregar({ id: item.id, nombre: item.nombre, precio: item.precio })} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: 'none', background: color,
                  color: 'white', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, lineHeight: 1,
                }}>+</button>
              </div>

              {/* Subtotal */}
              <p style={{
                margin: 0, fontWeight: 700, color: color,
                minWidth: 82, textAlign: 'right', fontSize: 14, flexShrink: 0
              }}>
                Gs. {(item.precio * item.cantidad).toLocaleString()}
              </p>
            </div>
          ))}

          {/* Total — se actualiza en tiempo real via contexto */}
          <div style={{
            padding: '13px 14px',
            borderTop: '1.5px solid #222',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            background: '#1e1e1e',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#aaa' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 22, color: color }}>
              Gs. {totalLocal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── DATOS OPCIONALES ── */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>
            Datos opcionales
          </p>
          <input
            placeholder="Tu nombre (opcional)"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <textarea
            placeholder="Nota para la cocina — ej: sin cebolla, bien cocido..."
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        {/* ── MÉTODO DE PAGO ── */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>
            Método de pago
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {METODOS_PAGO.map(m => {
              const sel = metodoPago === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setMetodoPago(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: sel ? `2px solid ${color}` : '1.5px solid #ebebeb',
                    background: sel ? `${color}08` : '#fafafa',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Radio */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: sel ? `5px solid ${color}` : '2px solid #ccc',
                    background: sel ? color : 'white',
                    transition: 'all 0.15s ease',
                  }} />
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{m.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{m.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── BOTÓN CONFIRMAR ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        padding: '10px 14px 16px',
        background: '#1e1e1e', borderTop: '1px solid #222',
        zIndex: 100,
      }}>
        <button
          onClick={confirmar}
          disabled={enviando || items.length === 0}
          style={{
            width: '100%',
            background: (enviando || items.length === 0) ? '#ccc' : color,
            color: 'white', border: 'none', borderRadius: 14,
            padding: '15px 16px', fontSize: 15, fontWeight: 700,
            cursor: (enviando || items.length === 0) ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Enviando pedido...' : `Confirmar pedido — Gs. ${totalLocal.toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}
