import { Routes, Route } from 'react-router-dom'
import MapView from './pages/MapView'
import AnalysisView from './pages/AnalysisView'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/analysis" element={<AnalysisView />} />
      </Routes>
    </Layout>
  )
}

export default App
