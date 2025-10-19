import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SunLogo from './SunLogo'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isAnalysisPage = location.pathname === '/analysis'

  return (
    <div className="min-h-screen bg-sun-gradient">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-warm border-b border-sun-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <SunLogo size="md" className="group-hover:animate-sun-glow transition-all duration-300" />
                  <div className="absolute inset-0 bg-sun-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-sun-600 to-sun-800 bg-clip-text text-transparent">
                  Solarized
                </span>
              </Link>
            </div>
            
            <nav className="flex space-x-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                  !isAnalysisPage
                    ? 'bg-sun-500 text-white shadow-warm'
                    : 'text-neutral-600 hover:text-sun-600 hover:bg-sun-100 hover:shadow-soft'
                }`}
              >
                Map
              </Link>
              <Link
                to="/analysis"
                className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                  isAnalysisPage
                    ? 'bg-sun-500 text-white shadow-warm'
                    : 'text-neutral-600 hover:text-sun-600 hover:bg-sun-100 hover:shadow-soft'
                }`}
              >
                Analysis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
