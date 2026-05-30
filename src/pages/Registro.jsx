import { useState } from 'react'
import axios from 'axios'

const API = 'https://restaurant-backend-production-1271.up.railway.app'

export default function Registro() {
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [credenciales, setCredenciales] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    email: '',
    password: '',
    confirmar: '',
    descripcion: '',
    color_primario: '#1D9E75',
  })
  const [error, setError] = useState('')

  const generarSlug = (nombre) => {
    return nombre.toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
      .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
      .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNombre = (e) => {
    const nombre = e.target.value
    setForm({ ...form, nombre, slug: generarSlug(nombre) })
  }

  const registrar = async () => {
    if (!form.nombre || !form.slug || !form.email || !form.password) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await axios.post(`${API}/locales/registro-publico`, {
        nombre: form.nombre,
        slug: form.slug,
        email: form.email,
        password: form.password,
        descripcion: form.descripcion,
        color_primario: form.color_primario,
        tiempo_prep_min: 15,
      })
      setCredenciales({ slug: form.slug, password: form.password, nombre: form.nombre, email: form.email })
      setPaso(3)
    } catch (e) {
      if (e.response?.data?.detail?.includes('slug')) {
        setError('Ese nombre de URL ya está en uso. Elegí otro.')
      } else {
        setError('Error al registrar. Intentá de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #e0e0e0', borderRadius: 12,
    padding: '12px 14px', fontSize: 15,
    background: 'white', color: '#111',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <svg width="48" height="48" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 12 }}>
            <circle cx="200" cy="200" r="200" fill="#1a1a2e"/>
            <rect x="148" y="143" width="10" height="80" rx="5" fill="white"/>
            <rect x="136" y="143" width="7" height="32" rx="3.5" fill="white"/>
            <rect x="162" y="143" width="7" height="32" rx="3.5" fill="white"/>
            <rect x="197" y="135" width="5" height="96" rx="2.5" fill="#1D9E75"/>
            <rect x="212" y="143" width="22" height="22" rx="4" fill="white"/>
            <rect x="240" y="143" width="22" height="22" rx="4" fill="white"/>
            <rect x="212" y="171" width="22" height="22" rx="4" fill="white"/>
            <rect x="240" y="171" width="10" height="10" rx="2" fill="#1D9E75"/>
            <rect x="252" y="171" width="10" height="10" rx="2" fill="white"/>
            <rect x="240" y="183" width="22" height="10" rx="2" fill="white"/>
            <rect x="212" y="199" width="50" height="10" rx="2" fill="white"/>
          </svg>
          <h1 style={{ color: 'white', margin: 0, fontSize: 28, fontWeight: 900 }}>Valmai</h1>
          <p style={{ color: '#555', margin: '4px 0 0', fontSize: 14 }}>Menú Digital QR para restaurantes</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          {/* Paso 1 — Datos del local */}
          {paso === 1 && (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>Registrá tu local</h2>
              <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14 }}>30 días gratis · Sin tarjeta de crédito</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Nombre del restaurante *</label>
                  <input placeholder="Ej: Pizzería Don Carlos" value={form.nombre} onChange={handleNombre} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>URL de tu menú *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#aaa', flexShrink: 0 }}>valmai.com.py/</span>
                    <input
                      placeholder="don-carlos"
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#aaa' }}>Así van a acceder tus clientes al menú</p>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Descripción (opcional)</label>
                  <input placeholder="Ej: Las mejores pizzas de Asunción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Color de tu marca</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="color" value={form.color_primario} onChange={e => setForm({ ...form, color_primario: e.target.value })}
                      style={{ width: 56, height: 44, border: '2px solid #e0e0e0', borderRadius: 10, cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, color: '#666' }}>Color principal del menú</span>
                  </div>
                </div>
              </div>

              <button onClick={() => {
                if (!form.nombre || !form.slug) { setError('Nombre y URL son obligatorios'); return }
                setError(''); setPaso(2)
              }} style={{ width: '100%', marginTop: 24, background: '#1D9E75', color: 'white', border: 'none', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                Continuar →
              </button>
              {error && <p style={{ color: 'red', fontSize: 13, margin: '12px 0 0', textAlign: 'center' }}>{error}</p>}
            </>
          )}

          {/* Paso 2 — Cuenta */}
          {paso === 2 && (
            <>
              <button onClick={() => setPaso(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, padding: 0, marginBottom: 16 }}>← Volver</button>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>Creá tu cuenta</h2>
              <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14 }}>Para acceder al panel de tu restaurante</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Contraseña *</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Confirmar contraseña *</label>
                  <input type="password" placeholder="Repetí tu contraseña" value={form.confirmar} onChange={e => setForm({ ...form, confirmar: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {error && <p style={{ color: 'red', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}

              <button onClick={registrar} disabled={enviando} style={{ width: '100%', marginTop: 24, background: enviando ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer' }}>
                {enviando ? 'Registrando...' : '🚀 Crear mi restaurante gratis'}
              </button>

              <p style={{ margin: '16px 0 0', fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                Al registrarte aceptás los términos de uso de Valmai
              </p>
            </>
          )}

          {/* Paso 3 — Éxito */}
          {paso === 3 && credenciales && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>¡Local creado!</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Tenés 30 días gratis para probar Valmai</p>
              </div>

              <div style={{ background: '#f8f8f8', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#333' }}>Tus credenciales de acceso:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>URL tablet</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>restaurant-tablet.vercel.app</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Slug</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{credenciales.slug}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Contraseña</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{credenciales.password}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Tu menú</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75' }}>valmai.com.py/{credenciales.slug}</span>
                  </div>
                </div>
              </div>

              <a href="https://restaurant-tablet.vercel.app/login" target="_blank" style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                Ir al panel de mi restaurante →
              </a>

              <p style={{ margin: '12px 0 0', fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                Guardá estas credenciales en un lugar seguro
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#333', fontSize: 13, marginTop: 20 }}>
          ¿Ya tenés cuenta? <a href="https://restaurant-tablet.vercel.app/login" style={{ color: '#1D9E75', fontWeight: 600 }}>Entrá a tu panel</a>
        </p>
      </div>
    </div>
  )
}
