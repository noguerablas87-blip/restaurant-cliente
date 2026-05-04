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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🍽</div>
        <p style={{ color: '#666' }}>Cargando menú...</p>
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
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ position: 'relative', minHeight: 180 }}>
        {local.banner_url
          ? <img src={local.banner_url} alt="banner" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
          : <div style={{ background: color, height: 180 }} />
        }
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '40px 16px 60px', textAlign: 'center'
        }}>
          {local.logo_url && <img src={local.logo_url} alt={local.nombre} style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 8, objectFit: 'cover', border: '3px solid white' }} />}
          <h1 style={{ color: 'white', margin: 0, fontSize: 22, fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{local.nombre}</h1>
          {local.descripcion && <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', fontSize: 13 }}>{local.descripcion}</p>}
          {mesa && <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 13, marginTop: 8 }}>Mesa {mesa}</div>}
        </div>
      </div>

      {/* Categorías */}
      <div style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: -20, borderRadius: '20px 20px 0 0' }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 16px', gap: 8, scrollbarWidth: 'none' }}>
          {categorias.map(cat => (
            <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)} style={{
              background: categoriaActiva === cat.id ? color : '#f0f0f0',
              color: categoriaActiva === cat.id ? 'white' : '#333',
              border: 'none', borderRadius: 20, padding: '8px 16px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div style={{ padding: '16px', paddingBottom: cantidad > 0 ? 100 : 16 }}>
        {categoriaActual?.productos.map(producto => {
          const cant = getCantidad(producto.id)
          return (
            <div key={producto.id} style={{
              background: 'white', borderRadius: 16, marginBottom: 12,
              overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              opacity: producto.disponible ? 1 : 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: 12, gap: 12 }}>
                {producto.imagen_url && (
                  <img src={producto.imagen_url} alt={producto.nombre} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{producto.nombre}</p>
                  {producto.descripcion && <p style={{ margin: '4px 0', fontSize: 12, color: '#888', lineHeight: 1.4 }}>{producto.descripcion}</p>}
                  <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: 16, color: color }}>
                    Gs. {producto.precio.toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {cant > 0 ? (
                    <>
                      <button onClick={() => quitar(producto.id)} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${color}`, background: 'white', color: color, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{cant}</span>
                    </>
                  ) : null}
                  <button onClick={() => producto.disponible && agregar(producto)} style={{
                    width: 32, height: 32, borderRadius: '50%', border: 'none',
                    background: producto.disponible ? color : '#ccc',
                    color: 'white', fontSize: 20, cursor: producto.disponible ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>+</button>
                </div>
              </div>
              {!producto.disponible && (
                <div style={{ background: '#f5f5f5', textAlign: 'center', padding: '6px', fontSize: 12, color: '#999' }}>Agotado</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Carrito flotante */}
      {cantidad > 0 && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, zIndex: 100 }}>
          <button onClick={() => navigate(`/${slug}/pedido${mesa ? `?mesa=${mesa}` : ''}`)} style={{
            width: '100%', background: color, color: 'white', border: 'none',
            borderRadius: 16, padding: '16px 20px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 14 }}>{cantidad} items</span>
            <span>Ver pedido</span>
            <span>Gs. {total.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  )
}