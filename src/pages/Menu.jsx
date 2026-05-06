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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fafafa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
        <p style={{ color: '#bbb', fontSize: 12, letterSpacing: 2, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>CARGANDO MENÚ...</p>
      </div>
    </div>
  )

  if (!local) return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#999' }}>Local no encontrado</p>
    </div>
  )

  const color = local.color_primario || '#b91c1c'
  const colorDark = color  // se usa directo, el backend manda el hex
  const categoriaActual = categorias.find(c => c.id === categoriaActiva)

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      background: '#f4f4f4', fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative'
    }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {local.banner_url
          ? <img src={local.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ background: `linear-gradient(160deg, ${color} 0%, ${color}aa 100%)`, height: '100%' }} />
        }
        {/* Gradiente oscuro */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* Badge mesa */}
        {mesa && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            color: 'white', fontSize: 12, fontWeight: 600,
            padding: '5px 12px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.2)',
            letterSpacing: 0.3
          }}>
            🪑 Mesa {mesa}
          </div>
        )}

        {/* Info local */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px 28px' }}>
          {local.logo_url && (
            <img src={local.logo_url} alt={local.nombre} style={{
              width: 52, height: 52, borderRadius: '50%',
              objectFit: 'cover', border: '2.5px solid white',
              marginBottom: 8, display: 'block',
            }} />
          )}
          <h1 style={{
            color: 'white', margin: 0, fontSize: 22, fontWeight: 800,
            letterSpacing: -0.4, lineHeight: 1.2,
            textShadow: '0 1px 6px rgba(0,0,0,0.4)'
          }}>{local.nombre}</h1>
          {local.descripcion && (
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: 13, lineHeight: 1.4 }}>
              {local.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* ── CATEGORÍAS sticky ── */}
      <div style={{
        background: 'white',
        position: 'sticky', top: 0, zIndex: 10,
        borderRadius: '20px 20px 0 0',
        marginTop: -20,
        boxShadow: '0 -2px 0 rgba(0,0,0,0.04)',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{
          display: 'flex', overflowX: 'auto',
          padding: '14px 16px 12px', gap: 8,
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {categorias.map(cat => {
            const activa = categoriaActiva === cat.id
            return (
              <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)} style={{
                flexShrink: 0,
                background: activa ? color : 'transparent',
                color: activa ? 'white' : '#777',
                border: activa ? 'none' : '1.5px solid #e8e8e8',
                borderRadius: 24, padding: '7px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                letterSpacing: 0.1,
              }}>
                {cat.nombre}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PRODUCTOS ── */}
      <div style={{ padding: '12px 14px', paddingBottom: cantidad > 0 ? 100 : 24 }}>

        {categoriaActual?.productos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#bbb' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
            <p style={{ fontSize: 14 }}>Sin productos en esta categoría</p>
          </div>
        )}

        {categoriaActual?.productos.map(producto => {
          const cant = getCantidad(producto.id)
          return (
            <div key={producto.id} style={{
              background: 'white',
              borderRadius: 16,
              marginBottom: 10,
              overflow: 'hidden',
              border: '1px solid #efefef',
              opacity: producto.disponible ? 1 : 0.55,
            }}>
              <div style={{ display: 'flex', padding: '12px 12px 12px 12px', gap: 12, alignItems: 'center' }}>

                {/* Imagen o placeholder */}
                {producto.imagen_url ? (
                  <img src={producto.imagen_url} alt={producto.nombre} style={{
                    width: 80, height: 80, borderRadius: 12,
                    objectFit: 'cover', flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 80, height: 80, borderRadius: 12, flexShrink: 0,
                    background: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28,
                  }}>🍽️</div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontWeight: 700, fontSize: 14,
                    color: '#111', lineHeight: 1.25,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>{producto.nombre}</p>

                  {producto.descripcion && (
                    <p style={{
                      margin: '3px 0 0', fontSize: 11.5, color: '#aaa',
                      lineHeight: 1.4, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>{producto.descripcion}</p>
                  )}

                  <p style={{
                    margin: '7px 0 0', fontWeight: 800, fontSize: 16, color: color
                  }}>
                    Gs. {producto.precio.toLocaleString()}
                  </p>
                </div>

                {/* Control cantidad */}
                <div style={{ flexShrink: 0 }}>
                  {cant > 0 ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#f6f6f6', borderRadius: 24, padding: '4px 6px'
                    }}>
                      <button
                        onClick={() => quitar(producto.id)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          border: `1.5px solid ${color}`, background: 'white',
                          color: color, fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, lineHeight: 1,
                        }}>−</button>
                      <span style={{
                        fontWeight: 800, fontSize: 15,
                        minWidth: 20, textAlign: 'center', color: '#111'
                      }}>{cant}</span>
                      <button
                        onClick={() => producto.disponible && agregar(producto)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          border: 'none', background: color,
                          color: 'white', fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, lineHeight: 1,
                        }}>+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => producto.disponible && agregar(producto)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: 'none',
                        background: producto.disponible ? color : '#ddd',
                        color: 'white', fontSize: 22,
                        cursor: producto.disponible ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, lineHeight: 1,
                      }}>+</button>
                  )}
                </div>
              </div>

              {!producto.disponible && (
                <div style={{
                  background: '#fff5f5', textAlign: 'center',
                  padding: '5px', fontSize: 11.5, color: '#e53e3e', fontWeight: 600
                }}>
                  ⚠️ No disponible
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── FAB CARRITO ── */}
      {cantidad > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          padding: '10px 14px 16px',
          background: 'white',
          borderTop: '1px solid #f0f0f0',
          zIndex: 100,
        }}>
          <button
            onClick={() => navigate(`/${slug}/pedido${mesa ? `?mesa=${mesa}` : ''}`)}
            style={{
              width: '100%', background: color,
              color: 'white', border: 'none', borderRadius: 14,
              padding: '14px 16px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
            <span style={{
              background: 'rgba(255,255,255,0.22)',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 13, fontWeight: 700
            }}>
              {cantidad} {cantidad === 1 ? 'item' : 'items'}
            </span>
            <span style={{ fontSize: 14 }}>Ver pedido</span>
            <span style={{ fontWeight: 800 }}>Gs. {total.toLocaleString()} →</span>
          </button>
        </div>
      )}
    </div>
  )
}
