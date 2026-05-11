import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'

export default function Menu() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const navigate = useNavigate()
  const { agregar, quitar, items, cantidad, total, setLocal, setMesa } = useCarrito()

  const [local, setLocalData] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const [localRes, menuRes] = await Promise.all([
          axios.get(`${API}/locales/${slug}`),
          axios.get(`${API}/menu/${slug}`)
        ])
        setLocalData(localRes.data)
        setLocal(localRes.data)
        setMesa(mesa)
        setCategorias(menuRes.data.categorias)
        if (menuRes.data.categorias.length > 0) {
          setCategoriaActiva(menuRes.data.categorias[0].id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [slug])

  const getCantidad = (id) => {
    const item = items.find(i => i.id === id)
    return item ? item.cantidad : 0
  }

  // Productos filtrados por búsqueda
  const productosFiltrados = busqueda.trim()
    ? categorias.flatMap(c => c.productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
      )).map(p => ({ ...p, _busqueda: true }))
    : null

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
        <p style={{ color: '#666', fontSize: 12, letterSpacing: 2, fontFamily: 'system-ui', fontWeight: 600 }}>CARGANDO MENÚ...</p>
      </div>
    </div>
  )

  if (!local) return (
    <div style={{ textAlign: 'center', padding: 40, background: '#1a1a1a', minHeight: '100vh', color: 'white', fontFamily: 'system-ui' }}>
      <p>Local no encontrado</p>
    </div>
  )

  const color = local.color_primario || '#f59e0b'
  const categoriaActual = categorias.find(c => c.id === categoriaActiva)

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#111111', fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: 'white'
    }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        {local.banner_url
          ? <img src={local.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ background: `linear-gradient(160deg, ${color}33 0%, #111 100%)`, height: '100%' }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)' }} />

        {/* Badge mesa */}
        {mesa && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            color: 'white', fontSize: 12, fontWeight: 600,
            padding: '5px 12px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            🪑 Mesa {mesa}
          </div>
        )}

        {/* Info local */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 20px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          {local.logo_url && (
            <img src={local.logo_url} alt={local.nombre} style={{
              width: 72, height: 72, borderRadius: 16,
              objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)',
              flexShrink: 0, background: '#222'
            }} />
          )}
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{local.nombre}</h1>
            {local.descripcion && <p style={{ color: 'rgba(255,255,255,0.65)', margin: '4px 0 0', fontSize: 13 }}>{local.descripcion}</p>}
          </div>
        </div>
      </div>

      {/* ── BUSCADOR ── */}
      <div style={{ padding: '14px 14px 0', background: '#111' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#222', border: '1px solid #333',
              borderRadius: 12, padding: '11px 14px 11px 40px',
              fontSize: 14, color: 'white', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* ── CATEGORÍAS ── */}
      {!busqueda && (
        <div style={{
          background: '#111', position: 'sticky', top: 0, zIndex: 10,
          borderBottom: '1px solid #222',
        }}>
          <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 14px', gap: 8, scrollbarWidth: 'none' }}>
            {categorias.map(cat => {
              const activa = categoriaActiva === cat.id
              return (
                <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)} style={{
                  flexShrink: 0,
                  background: activa ? color : 'transparent',
                  color: activa ? '#000' : 'rgba(255,255,255,0.6)',
                  border: activa ? 'none' : '1px solid #333',
                  borderRadius: 20, padding: '7px 16px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}>
                  {cat.nombre.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PRODUCTOS ── */}
      <div style={{ padding: '8px 0', paddingBottom: cantidad > 0 ? 100 : 24 }}>

        {/* Resultados de búsqueda */}
        {busqueda && (
          <div>
            {productosFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#555' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 14 }}>Sin resultados para "{busqueda}"</p>
              </div>
            )}
            {productosFiltrados.map(producto => (
              <ProductoCard key={producto.id} producto={producto} color={color} cantidad={getCantidad(producto.id)} agregar={agregar} quitar={quitar} />
            ))}
          </div>
        )}

        {/* Menú normal por categoría */}
        {!busqueda && (
          <div>
            {categoriaActual?.productos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#555' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
                <p style={{ fontSize: 14 }}>Sin productos en esta categoría</p>
              </div>
            )}
            <div style={{ padding: '0 14px' }}>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: '16px 0 12px', letterSpacing: -0.3 }}>
                {categoriaActual?.nombre.toUpperCase()}
              </h2>
            </div>
            {categoriaActual?.productos.map(producto => (
              <ProductoCard key={producto.id} producto={producto} color={color} cantidad={getCantidad(producto.id)} agregar={agregar} quitar={quitar} />
            ))}
          </div>
        )}
      </div>


      {/* ── FOOTER VALMAI ── */}
      {!cantidad && (
        <div style={{ textAlign: 'center', padding: '32px 20px 40px', borderTop: '1px solid #222' }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#444', letterSpacing: 1 }}>SISTEMA DE PEDIDOS DIGITAL</p>
          <a href="https://nimble-strudel-515f0a.netlify.app" target="_blank" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="200" fill="#1e1e1e"/>
              <circle cx="200" cy="200" r="180" fill="#1a1a2e"/>
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
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>Valmai</p>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Menú Digital QR · Paraguay</p>
            </div>
          </a>
        </div>
      )}
      {/* ── FAB CARRITO ── */}
      {cantidad > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          padding: '10px 14px 16px',
          background: 'linear-gradient(to top, #111 80%, transparent)',
          zIndex: 100,
        }}>
          <button
            onClick={() => navigate(`/${slug}/pedido${mesa ? `?mesa=${mesa}` : ''}`)}
            style={{
              width: '100%', background: color,
              color: '#000', border: 'none', borderRadius: 14,
              padding: '15px 16px', fontSize: 15, fontWeight: 800,
              cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'inherit',
            }}>
            <span style={{
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 13, fontWeight: 700
            }}>
              {cantidad} {cantidad === 1 ? 'item' : 'items'}
            </span>
            <span>Ver pedido</span>
            <span>Gs. {total.toLocaleString()} →</span>
          </button>
        </div>
      )}
    </div>
  )
}

function ProductoCard({ producto, color, cantidad, agregar, quitar }) {
  return (
    <div style={{
      margin: '0 14px 10px',
      background: '#1e1e1e',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      opacity: producto.disponible ? 1 : 0.4,
    }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Info */}
        <div style={{ flex: 1, padding: '14px 14px 14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'white', lineHeight: 1.3 }}>{producto.nombre}</p>
            {producto.descripcion && (
              <p style={{
                margin: '5px 0 0', fontSize: 12, color: '#888', lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>{producto.descripcion}</p>
            )}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: color }}>
              ₲ {producto.precio.toLocaleString()}
            </p>
            {/* Control cantidad */}
            {cantidad > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2a2a2a', borderRadius: 24, padding: '4px 8px' }}>
                <button onClick={() => quitar(producto.id)} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `1.5px solid ${color}`, background: 'transparent',
                  color: color, fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, lineHeight: 1,
                }}>−</button>
                <span style={{ fontWeight: 800, fontSize: 15, minWidth: 18, textAlign: 'center', color: 'white' }}>{cantidad}</span>
                <button onClick={() => producto.disponible && agregar(producto)} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: 'none', background: color,
                  color: '#000', fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, lineHeight: 1,
                }}>+</button>
              </div>
            ) : (
              <button onClick={() => producto.disponible && agregar(producto)} style={{
                width: 34, height: 34, borderRadius: '50%',
                border: 'none', background: producto.disponible ? color : '#333',
                color: '#000', fontSize: 20, cursor: producto.disponible ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, lineHeight: 1,
              }}>+</button>
            )}
          </div>
        </div>

        {/* Imagen */}
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre} style={{
            width: 110, height: 110, objectFit: 'cover', flexShrink: 0
          }} />
        ) : (
          <div style={{
            width: 110, height: 110, flexShrink: 0,
            background: '#2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
          }}>🍽️</div>
        )}
      </div>

      {!producto.disponible && (
        <div style={{ background: '#2a0000', textAlign: 'center', padding: '5px', fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
          ⚠️ No disponible
        </div>
      )}
    </div>
  )
}
