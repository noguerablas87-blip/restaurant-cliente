import { createContext, useContext, useState, useEffect } from 'react'

const CarritoContext = createContext()

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('carrito')) || [] } catch { return [] }
  })
  const [local, setLocal] = useState(null)
  const [mesa, setMesa] = useState(null)

  const agregar = (producto) => {
    setItems(prev => {
      const existe = prev.find(i => i.id === producto.id)
      if (existe) {
        return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { ...producto, cantidad: 1, nota: '' }]
    })
  }

  const quitar = (id) => {
    setItems(prev => {
      const existe = prev.find(i => i.id === id)
      if (existe && existe.cantidad > 1) {
        return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i)
      }
      return prev.filter(i => i.id !== id)
    })
  }

  const limpiar = () => { setItems([]); sessionStorage.removeItem('carrito') }
  useEffect(() => {
    sessionStorage.setItem('carrito', JSON.stringify(items))
  }, [items])
  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const cantidad = items.reduce((acc, i) => acc + i.cantidad, 0)

  return (
    <CarritoContext.Provider value={{ items, agregar, quitar, limpiar, total, cantidad, local, setLocal, mesa, setMesa }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}