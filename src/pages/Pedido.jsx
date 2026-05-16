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
  const tipo = searchParams.get('tipo') || 'mesa'
  const navigate = useNavigate()
  const { items, quitar, agregar, total, limpiar, local } = useCarrito()

  const [nombre, setNombre] = useState('')
  const [nota, setNota] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [enviando, setEnviando] = useState(false)

  const color = local?.color_primario || '#b91c1c'
  const totalLocal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const esDelivery = tipo === 'delivery'
  const esRetiro = tipo === 'retiro'

  const confirmar = async () => {
    if (items.length === 0) return
    if (esDelivery && !direccion.trim()) {
      alert('Por favor ingresá tu dirección de entrega')
      return
    }
    if (esDelivery && !telefono.trim()) {
      alert('Por favor ingresá tu número de teléfono')
      return
    }
    setEnviando(true)
    try {
      const res = await axios.post(`${API}/pedidos/`, {
        local_id: local.id,
        numero_mesa: mesa ? parseInt(mesa) : null,
        nombre_cliente: nombre || null,
        nota_general: nota || null,
        metodo_pago: metodoPago,
        tipo: tipo,
        direccion_entrega: esDelivery ? direccion : null,
        telefono_cliente: (esDelivery || esRetiro) ? telefono : null,
        items: items.map(i => ({
          producto_id: i.id,
          cantidad: i.cantidad,
          nota: i.nota || null
        }))
      })
      localStorage.setItem('pedidoActivo', JSON.stringify({
        pedidoId: res.data.pedido_id,
        mesa: mesa || null,
        slug: slug,
      }))
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
  }

  const tipoLabel = esDelivery ? '🛵 Delivery' : esRetiro ? '🏪 Para retirar' : mesa ? `🪑 Mesa ${mesa}` : ''

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#111111', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ background: color, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700, flex: 1 }}>Tu pedido</h2>
        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{tipoLabel}</span>
      </div>

      <div style={{ padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── ITEMS ── */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
          {items.map((item, idx) => (
            <div key={item.id} style={{ padding: '12px 14px', borderBottom: idx < items.length - 1 ? '1px solid #222' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'white' }}>{item.nombre}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>Gs. {item.precio.toLocaleString()} c/u</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <button onClick={() => quitar(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${color}`, background: '#1e1e1e', color: color, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', fontSize: 15, color: 'white' }}>{item.cantidad}</span>
                <button onClick={() => agregar({ id: item.id, nombre: item.nombre, precio: item.precio })} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: color, color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: color, minWidth: 82, textAlign: 'right', fontSize: 14, flexShrink: 0 }}>Gs. {(item.precio * item.cantidad).toLocaleString()}</p>
            </div>
          ))}
          <div style={{ padding: '13px 14px', borderTop: '1.5px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#aaa' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 22, color: color }}>Gs. {totalLocal.toLocaleString()}</span>
          </div>
        </div>

        {/* ── DELIVERY — dirección y teléfono ── */}
        {esDelivery && (
          <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: `1px solid ${color}44` }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: color, letterSpacing: 1, textTransform: 'uppercase' }}>
              🛵 Datos de entrega
            </p>
            <input
              placeholder="Dirección de entrega *"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <input
              placeholder="Teléfono de contacto *"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              type="tel"
              style={inputStyle}
            />
          </div>
        )}

        {/* ── RETIRO — teléfono ── */}
        {esRetiro && (
          <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase' }}>
              🏪 Datos de retiro
            </p>
            <input
              placeholder="Teléfono de contacto (opcional)"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              type="tel"
              style={inputStyle}
            />
          </div>
        )}

        {/* ── DATOS OPCIONALES ── */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Datos opcionales</p>
          <input placeholder="Tu nombre (opcional)" value={nombre} onChange={e => setNombre(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <textarea placeholder="Nota para la cocina — ej: sin cebolla, bien cocido..." value={nota} onChange={e => setNota(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
        </div>

        {/* ── MÉTODO DE PAGO ── */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Método de pago</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {METODOS_PAGO.map(m => {
              const sel = metodoPago === m.id
              return (
                <div key={m.id} onClick={() => setMetodoPago(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: sel ? `2px solid ${color}` : '1.5px solid #333', background: sel ? `${color}11` : '#1a1a1a', transition: 'all 0.15s ease' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: sel ? `5px solid ${color}` : '2px solid #555', background: sel ? color : 'transparent', transition: 'all 0.15s ease' }} />
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

        {/* ── FOOTER VALMAI ── */}
        <div style={{ textAlign: 'center', padding: '24px 0 8px', borderTop: '1px solid #222', marginTop: 8 }}>
          <a href="https://nimble-strudel-515f0a.netlify.app" target="_blank" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="26" height="26" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="200" fill="#1a1a2e"/>
              <rect x="148" y="143" width="10" height="80" rx="5" fill="white"/>
              <rect x="136" y="143" width="7" height="32" rx="3.5" fill="white"/>
              <rect x="162" y="143" width="7" height="32" rx="3.5" fill="white"/>
              <rect x="197" y="135" width="5" height="96" rx="2.5" fill="#b91c1c"/>
              <rect x="212" y="143" width="22" height="22" rx="4" fill="white"/>
              <rect x="240" y="143" width="22" height="22" rx="4" fill="white"/>
              <rect x="212" y="171" width="22" height="22" rx="4" fill="white"/>
              <rect x="240" y="171" width="10" height="10" rx="2" fill="#b91c1c"/>
              <rect x="252" y="171" width="10" height="10" rx="2" fill="white"/>
              <rect x="240" y="183" width="22" height="10" rx="2" fill="white"/>
              <rect x="212" y="199" width="50" height="10" rx="2" fill="white"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'white' }}>Hecho con Valmai</p>
              <p style={{ margin: 0, fontSize: 10, color: '#444' }}>Menú Digital QR · Paraguay</p>
            </div>
          </a>
        </div>

      </div>

      {/* ── BOTÓN CONFIRMAR ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '10px 14px 16px', background: '#1e1e1e', borderTop: '1px solid #222', zIndex: 100 }}>
        <button onClick={confirmar} disabled={enviando || items.length === 0} style={{
          width: '100%', background: (enviando || items.length === 0) ? '#333' : color,
          color: 'white', border: 'none', borderRadius: 14, padding: '15px 16px', fontSize: 15, fontWeight: 700,
          cursor: (enviando || items.length === 0) ? 'not-allowed' : 'pointer',
        }}>
          {enviando ? 'Enviando pedido...' : `Confirmar pedido — Gs. ${totalLocal.toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}
