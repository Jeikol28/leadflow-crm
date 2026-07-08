// Este archivo conecta la aplicacion React con TanStack Router y los estilos globales.

import { RouterProvider } from '@tanstack/react-router'
import { tanstackRouter } from './app/routes/tanstackRouter'
import './App.css'

function App() {
  return <RouterProvider router={tanstackRouter} />
}

export default App