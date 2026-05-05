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

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1s infinite' }}>🍽️</div>
        <p style={{ color: '#999', fontSize: 14, letterSpacing: 1 }}>CARGANDO MENÚ...</p>
      </div>
    </div>
  )

  if (!local) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <p>Local no encontrado</p>
    </div>
  )

  const color = local.color_primario || '#1D9E75'
  const categoriaActual = categorias.find(c => c.id === categoriaActiva)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f9f9f9', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header con banner */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        {local.banner_url
          ? <img src={local.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, height: '100%' }} />
        }
        {/* Gradiente oscuro */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
        }} />
        {/* Info del local */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '20px 20px 28px',
        }}>
          {local.logo_url && (
            <img src={local.logo_url} alt={local.nombre} style={{
              width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
              border: '3px solid white', marginBottom: 10, display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }} />
          )}
          <h1 style={{ color: 'white', margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{local.nombre}</h1>
          {local.descripcion && <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: 13 }}>{local.descripcion}</p>}
          {mesa && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              color: 'white', padding: '5px 14px', borderRadius: 20,
              fontSize: 13, fontWeight: 600, marginTop: 10,
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              🪑 Mesa {mesa}
            </div>
          )}
        </div>
      </div>

      {/* Categorías sticky */}
      <div style={{
        background: 'white', position: 'sticky', top: 0, zIndex: 10,
        borderRadius: '20px 20px 0 0', marginTop: -20,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '16px 16px 12px', gap: 8, scrollbarWidth: 'none' }}>
          {categorias.map(cat => (
            <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)} style={{
              background: categoriaActiva === cat.id ? color : 'transparent',
              color: categoriaActiva === cat.id ? 'white' : '#666',
              border: categoriaActiva === cat.id ? 'none' : '2px solid #eee',
              borderRadius: 24, padding: '8px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
              boxShadow: categoriaActiva === cat.id ? `0 4px 12px ${color}66` : 'none'
            }}>
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div style={{ padding: '12px 16px', paddingBottom: cantidad > 0 ? 110 : 24 }}>
        {categoriaActual?.productos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <p style={{ fontSize: 40 }}>🍽️</p>
            <p>Sin productos en esta categoría</p>
          </div>
        )}
        {categoriaActual?.productos.map(producto => {
          const cant = getCantidad(producto.id)
          return (
            <div key={producto.id} style={{
              background: 'white', borderRadius: 20, marginBottom: 12,
              overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              opacity: producto.disponible ? 1 : 0.5,
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', padding: 14, gap: 14, alignItems: 'center' }}>
                {producto.imagen_url ? (
                  <img src={producto.imagen_url} alt={producto.nombre} style={{
                    width: 90, height: 90, borderRadius: 16,
                    objectFit: 'cover', flexShrink: 0,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }} />
                ) : (
                  <div style={{
                    width: 90, height: 90, borderRadius: 16, flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32
                  }}>🍽️</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1a1a1a', lineHeight: 1.3 }}>{producto.nombre}</p>
                  {producto.descripcion && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{producto.descripcion}</p>
                  )}
                  <p style={{ margin: '8px 0 0', fontWeight: 800, fontSize: 17, color: color }}>
                    Gs. {producto.precio.toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {cant > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f5', borderRadius: 24, padding: '4px 8px' }}>
                      <button onClick={() => quitar(producto.id)} style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none',
                        background: 'white', color: color, fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)', fontWeight: 700
                      }}>−</button>
                      <span style={{ fontWeight: 800, fontSize: 16, minWidth: 20, textAlign: 'center', color: '#1a1a1a' }}>{cant}</span>
                      <button onClick={() => producto.disponible && agregar(producto)} style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none',
                        background: color, color: 'white', fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${color}66`, fontWeight: 700
                      }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => producto.disponible && agregar(producto)} style={{
                      width: 38, height: 38, borderRadius: '50%', border: 'none',
                      background: producto.disponible ? color : '#ccc',
                      color: 'white', fontSize: 22, cursor: producto.disponible ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: producto.disponible ? `0 4px 12px ${color}66` : 'none'
                    }}>+</button>
                  )}
                </div>
              </div>
              {!producto.disponible && (
                <div style={{ background: '#fff5f5', textAlign: 'center', padding: '6px', fontSize: 12, color: '#F44336', fontWeight: 600 }}>
                  ⚠️ No disponible
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Carrito flotante */}
      {cantidad > 0 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, zIndex: 100 }}>
          <button onClick={() => navigate(`/${slug}/pedido${mesa ? `?mesa=${mesa}` : ''}`)} style={{
            width: '100%', background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            color: 'white', border: 'none', borderRadius: 20,
            padding: '16px 20px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: `0 8px 24px ${color}66`
          }}>
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>
              {cantidad} {cantidad === 1 ? 'item' : 'items'}
            </span>
            <span style={{ fontSize: 15 }}>Ver pedido →</span>
            <span style={{ fontWeight: 800 }}>Gs. {total.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  )
}