import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LoaderSkeleton from './components/LoaderSkeleton'

// Code splitting avec React.lazy() pour améliorer les performances
const HomePage = lazy(() => import('./pages/HomePage'))
const VideoPage = lazy(() => import('./pages/VideoPage').then(module => ({ default: module.VideoPage })))

function App() {
  return (
    <Router>
      <Suspense fallback={<LoaderSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:id" element={<VideoPage />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App

