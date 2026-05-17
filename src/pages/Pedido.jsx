import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCarrito } from '../context/CarritoContext'

const API = 'https://restaurant-backend-production-1271.up.railway.app'
const GOOGLE_API_KEY = 'AIzaSyA62BdP0S_uQJauHy-q9CeZmYEm-XA_SyQ'

const METODOS_MESA = [
  { id: 'efectivo',      icon: '💵', label: 'Efectivo',      sub: 'Al recibir el pedido' },
  { id: 'tarjeta',       icon: '💳', label: 'Tarjeta',       sub: 'Débito o crédito' },
  { id: 'transferencia', icon: '🏦', label: 'Transferencia', sub: 'Pago bancario' },
]
const METODOS_DELIVERY = [
  { id: 'efectivo',      icon: '💵', label: 'Efectivo',      sub: 'Al recibir el pedido' },
  { id: 'transferencia', icon: '🏦', label: 'Transferencia', sub: 'Pago bancario' },
]
function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
export default function Pedido() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')
  const tipo = searchParams.get('tipo') || 'mesa'
  const navigate = useNavigate()
  const { items, quitar, agregar, total, limpiar, local } = useCarrito()
  const [localData, setLocalData] = useState(null)

  useEffect(() => {
    if (local) { setLocalData(local); return }
    if (slug) {
      axios.get(`${API}/locales/${slug}`)
        .then(r => setLocalData(r.data))
        .catch(() => {})
    }
  }, [local, slug])

  const [nombre, setNombre] = useState('')
  const [nota, setNota] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [enviando, setEnviando] = useState(false)
  const [necesitaFactura, setNecesitaFactura] = useState(false)
  const [facturaRuc, setFacturaRuc] = useState('')
  const [facturaRazonSocial, setFacturaRazonSocial] = useState('')

  // Delivery con mapa
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [mapListo, setMapListo] = useState(false)
  const [distanciaKm, setDistanciaKm] = useState(null)
  const [costoDelivery, setCostoDelivery] = useState(0)
  const [clienteLat, setClienteLat] = useState(null)
  const [clienteLng, setClienteLng] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [fueraDeZona, setFueraDeZona] = useState(false)

  const [color, setColor] = useState('#b91c1c')
useEffect(() => {
  if (local?.color_primario) setColor(local.color_primario)
  else if (slug) {
    axios.get(`${API}/locales/${slug}`)
      .then(r => setColor(r.data.color_primario || '#b91c1c'))
      .catch(() => {})
  }
}, [local, slug])
  const totalLocal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const esDelivery = tipo === 'delivery'
  const esRetiro = tipo === 'retiro'
  const metodosPago = (esDelivery || esRetiro) ? METODOS_DELIVERY : METODOS_MESA

  // Cargar Google Maps solo para delivery
  useEffect(() => {
    if (!esDelivery) return
    if (window.google) { setMapListo(true); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`
    script.async = true
    script.onload = () => setMapListo(true)
    document.head.appendChild(script)
  }, [esDelivery])

  // Inicializar mapa
  useEffect(() => {
    if (!mapListo || !mapRef.current || !esDelivery) return
    const google = window.google
    const defaultLat = localData?.latitud || -25.2867
    const defaultLng = localData?.longitud || -57.647

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapInstanceRef.current = map

    // Marker del local (fijo)
    new google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map,
      title: 'Local',
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
    })

    // Marker del cliente (movible)
    const clienteMarker = new google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map,
      draggable: true,
      title: 'Tu ubicación',
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }
    })
    markerRef.current = clienteMarker

    const actualizarPosicion = async (lat, lng) => {
      setClienteLat(lat)
      setClienteLng(lng)
      setCalculando(true)
      try {
        // Geocoding para dirección
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`)
        const geoData = await geoRes.json()
        if (geoData.results[0]) setDireccion(geoData.results[0].formatted_address)

        // Haversine para distancia
        if (localData?.latitud && localData?.longitud) {
          const km = calcularDistanciaKm(localData.latitud, localData.longitud, lat, lng)
          const maxKm = localData?.distancia_max_km || 0
          if (maxKm > 0 && km > maxKm) {
            setDistanciaKm(km.toFixed(1))
            setCostoDelivery(0)
            setFueraDeZona(true)
          } else {
            setDistanciaKm(km.toFixed(1))
            setCostoDelivery(Math.ceil(km) * (localData?.costo_km || 0))
            setFueraDeZona(false)
          }
        }
      } catch (e) {}
      finally { setCalculando(false) }
    }

    clienteMarker.addListener('dragend', (e) => {
      actualizarPosicion(e.latLng.lat(), e.latLng.lng())
    })

    map.addListener('click', (e) => {
      clienteMarker.setPosition(e.latLng)
      actualizarPosicion(e.latLng.lat(), e.latLng.lng())
    })
  }, [mapListo, local])

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) { alert('Tu dispositivo no soporta geolocalización'); return }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat, lng })
        markerRef.current?.setPosition({ lat, lng })
        markerRef.current?.map && markerRef.current.map.setZoom(16)
      }
      setClienteLat(lat)
      setClienteLng(lng)
      setCalculando(true)
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`)
        .then(r => r.json())
        .then(geoData => {
          if (geoData.results[0]) setDireccion(geoData.results[0].formatted_address)
          if (localData?.latitud && localData?.longitud) {
            const km = calcularDistanciaKm(localData.latitud, localData.longitud, lat, lng)
            const maxKm = localData?.distancia_max_km || 0
            if (maxKm > 0 && km > maxKm) {
              setDistanciaKm(km.toFixed(1))
              setCostoDelivery(0)
              setFueraDeZona(true)
            } else {
              setDistanciaKm(km.toFixed(1))
              setCostoDelivery(Math.ceil(km) * (localData?.costo_km || 0))
              setFueraDeZona(false)
            }
          }
        }).catch(() => {}).finally(() => setCalculando(false))
    }, () => alert('No se pudo obtener tu ubicación'))
  }

  const confirmar = async () => {
    if (items.length === 0) return
    if (esDelivery && fueraDeZona) {
      alert('Tu ubicación está fuera de la zona de delivery de este local')
      return
    }
    if (esDelivery && !direccion.trim()) {
      alert('Por favor seleccioná tu ubicación en el mapa')
      return
    }
    if (esDelivery && !telefono.trim()) {
      alert('Por favor ingresá tu número de teléfono')
      return
    }
    setEnviando(true)
    try {
      const res = await axios.post(`${API}/pedidos/`, {
        local_id: localData?.id || local?.id,
        numero_mesa: mesa ? parseInt(mesa) : null,
        nombre_cliente: nombre || null,
        nota_general: nota || null,
        metodo_pago: metodoPago,
        tipo: tipo,
        direccion_entrega: esDelivery ? direccion : null,
        telefono_cliente: (esDelivery || esRetiro) ? telefono : null,
        costo_delivery: esDelivery ? costoDelivery : 0,
        necesita_factura: necesitaFactura,
        factura_ruc: necesitaFactura ? facturaRuc : null,
        factura_razon_social: necesitaFactura ? facturaRazonSocial : null,
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
  const totalConDelivery = totalLocal + costoDelivery

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#111111', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: color, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <h2 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700, flex: 1 }}>Tu pedido</h2>
        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{tipoLabel}</span>
      </div>

      <div style={{ padding: '14px 14px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ITEMS */}
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
            <span style={{ fontWeight: 600, fontSize: 14, color: '#aaa' }}>Subtotal</span>
            <span style={{ fontWeight: 800, fontSize: 22, color: color }}>Gs. {totalLocal.toLocaleString()}</span>
          </div>
          {esDelivery && costoDelivery > 0 && (
            <div style={{ padding: '8px 14px 13px', borderTop: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#666' }}>🛵 Delivery ({distanciaKm} km)</span>
                <span style={{ fontSize: 13, color: '#f59e0b' }}>Gs. {costoDelivery.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#22c55e' }}>Gs. {totalConDelivery.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* DELIVERY — mapa */}
        {esDelivery && (
          <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: `1px solid ${color}44` }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13, color: color, letterSpacing: 1, textTransform: 'uppercase' }}>
              🛵 Tu ubicación de entrega
            </p>

            <button onClick={usarMiUbicacion} style={{
              width: '100%', background: '#1e3a5f', color: 'white', border: 'none',
              borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', marginBottom: 10
            }}>
              🎯 Usar mi ubicación actual
            </button>

            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#555' }}>O tocá en el mapa para marcar tu ubicación:</p>

            <div ref={mapRef} style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid #333', marginBottom: 10 }} />

            {calculando && (
              <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 8 }}>Calculando distancia...</div>
            )}
            {fueraDeZona && (
              <div style={{ background: '#1a0000', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: '1px solid #330000' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#ef4444' }}>⚠️ Fuera de zona de delivery</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Este local solo hace delivery hasta {localData?.distancia_max_km} km. Tu ubicación está a {distanciaKm} km.</p>
              </div>
            )}

            {distanciaKm && !calculando && (
              <div style={{ background: '#111', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#aaa' }}>📍 Distancia al local</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{distanciaKm} km</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#aaa' }}>🛵 Costo de delivery</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Gs. {costoDelivery.toLocaleString()}</span>
                </div>
              </div>
            )}

            {direccion && (
              <div style={{ background: '#111', borderRadius: 10, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#aaa' }}>
                📍 {direccion}
              </div>
            )}

            <input
              placeholder="Teléfono de contacto *"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              type="tel"
              style={inputStyle}
            />
          </div>
        )}

        {/* RETIRO */}
        {esRetiro && (
          <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase' }}>
              🏪 Datos de retiro
            </p>
            <input placeholder="Teléfono de contacto (opcional)" value={telefono} onChange={e => setTelefono(e.target.value)} type="tel" style={inputStyle} />
          </div>
        )}

        {/* DATOS OPCIONALES */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Datos opcionales</p>
          <input placeholder="Tu nombre (opcional)" value={nombre} onChange={e => setNombre(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <textarea placeholder="Nota para la cocina..." value={nota} onChange={e => setNota(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
        </div>

       {/* FACTURA */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'white' }}>🧾 ¿Necesitás factura?</p>
            <div onClick={() => setNecesitaFactura(!necesitaFactura)} style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: necesitaFactura ? '#22c55e' : '#333',
              position: 'relative', transition: 'background 0.2s'
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3,
                left: necesitaFactura ? 23 : 3,
                transition: 'left 0.2s'
              }} />
            </div>
          </div>
          {necesitaFactura && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                placeholder="RUC o CI *"
                value={facturaRuc}
                onChange={e => setFacturaRuc(e.target.value)}
                style={{ ...inputStyle }}
              />
              <input
                placeholder="Razón social o nombre completo *"
                value={facturaRazonSocial}
                onChange={e => setFacturaRazonSocial(e.target.value)}
                style={{ ...inputStyle }}
              />
            </div>
          )}
        </div>

        {/* MÉTODO DE PAGO */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #2a2a2a' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Método de pago</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metodosPago.map(m => {
              const sel = metodoPago === m.id
              return (
                <div key={m.id} onClick={() => setMetodoPago(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: sel ? `2px solid ${color}` : '1.5px solid #333', background: sel ? `${color}11` : '#1a1a1a' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: sel ? `5px solid ${color}` : '2px solid #555', background: sel ? color : 'transparent' }} />
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
        {/* DATOS BANCARIOS — solo si elige transferencia */}
        {metodoPago === 'transferencia' && localData?.banco && (
          <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '14px', border: '1px solid #22c55e44' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 11, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase' }}>🏦 Datos para transferencia</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {localData.banco && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#666' }}>Banco</span><span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{localData.banco}</span></div>}
              {localData.cuenta_bancaria && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#666' }}>Cuenta</span><span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{localData.cuenta_bancaria}</span></div>}
              {localData.titular_cuenta && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#666' }}>Titular</span><span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{localData.titular_cuenta}</span></div>}
              {localData.alias_cuenta && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#666' }}>Alias</span><span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{localData.alias_cuenta}</span></div>}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#555' }}>Realizá la transferencia y enviá el comprobante al local.</p>
          </div>
        )}

        
        {/* FOOTER VALMAI */}
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

      {/* BOTÓN CONFIRMAR */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '10px 14px 16px', background: '#1e1e1e', borderTop: '1px solid #222', zIndex: 100 }}>
        <button onClick={confirmar} disabled={enviando || items.length === 0 || fueraDeZona} style={{
          width: '100%', background: (enviando || items.length === 0) ? '#333' : color,
          color: 'white', border: 'none', borderRadius: 14, padding: '15px 16px', fontSize: 15, fontWeight: 700,
          cursor: (enviando || items.length === 0) ? 'not-allowed' : 'pointer',
        }}>
          {enviando ? 'Enviando pedido...' : `Confirmar pedido — Gs. ${totalConDelivery.toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}
