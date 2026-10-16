import { Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import RotaProtegida from './components/RotaProtegida'
import Login from './pages/Login'
import Agua from './pages/Agua'
import Alimentacao from './pages/Alimentacao'
import Resumo from './pages/Resumo'

function App() {

  return (
   <>
      <Navbar />
      <div className='container mt-4'>
        <Routes>
          <Route path='/' element={<Navigate to="/resumo" replace />} />
          <Route path='/login' element={<Login />} />

          <Route element={<RotaProtegida />}>
              {/* Tudo aqui dentro existe login */}
              <Route path='/agua' element={<Agua />} />
              <Route path='/alimentacao' element={<Alimentacao />} />
              <Route path='/resumo' element={<Resumo />} />
          
          </Route>

        </Routes>
      </div>
   </>
  )
}

export default App
