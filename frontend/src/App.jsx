import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { PreacherPage } from './pages/PreacherPage'
import { ThemePage } from './pages/ThemePage'
import { VideoPage } from './pages/VideoPage'
import { YouTubePage } from './pages/YouTubePage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/preacher/:slug" element={<PreacherPage />} />
        <Route path="/theme/:slug" element={<ThemePage />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/youtube" element={<YouTubePage />} />
      </Routes>
    </Router>
  )
}

export default App

