import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu'
import Pedido from './pages/Pedido'
import Estado from './pages/Estado'
import Registro from './pages/Registro'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Registro />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/:slug" element={<Menu />} />
      <Route path="/:slug/pedido" element={<Pedido />} />
      <Route path="/:slug/estado/:pedidoId" element={<Estado />} />
    </Routes>
  )
}

export default App
