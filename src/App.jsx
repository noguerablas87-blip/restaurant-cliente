import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu'
import Pedido from './pages/Pedido'
import Estado from './pages/Estado'

function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<Menu />} />
      <Route path="/:slug/pedido" element={<Pedido />} />
      <Route path="/:slug/estado/:pedidoId" element={<Estado />} />
    </Routes>
  )
}

export default App