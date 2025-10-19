import { ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isAnalysisPage = location.pathname === '/analysis'
  const isMapPage = location.pathname === '/map'
  const isHomePage = location.pathname === '/'

  // Disable scrolling on map page
  useEffect(() => {
    if (isMapPage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to restore scrolling when component unmounts or route changes
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMapPage])

  return (
    <div className="min-h-screen bg-sun-gradient">
      {/* Header - don't show on landing page as it has its own */}
      {!isHomePage && (
        <header className="fixed w-full top-0 left-0 h-[109px] flex justify-between items-center px-4 lg:px-20 z-50" style={{background: 'linear-gradient(135deg, rgba(255, 251, 240, 0.7) 0%, rgba(255, 228, 179, 0.7) 50%, rgba(255, 179, 71, 0.7) 100%)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'}}>
          <img
            className="w-[172px] h-[69px] aspect-[2.5] object-cover"
            alt="Solarize logo"
            src="/images/solarize-logo.png"
          />

          <nav className="flex items-center gap-2">
            <Link to="/">
              <button className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg shadow-lg transition-colors ${
                isHomePage 
                  ? 'bg-[#6d4c3d] text-white' 
                  : 'text-black hover:bg-gray-200'
              }`}>
                <span className="font-medium text-sm tracking-normal leading-normal whitespace-nowrap">
                  Home
                </span>
              </button>
            </Link>
            <Link to="/map">
              <button className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg shadow-lg transition-colors ${
                isMapPage 
                  ? 'bg-[#6d4c3d] text-white' 
                  : 'text-black hover:bg-gray-200'
              }`}>
                <span className="font-medium text-sm tracking-normal leading-normal whitespace-nowrap">
                  Map
                </span>
              </button>
            </Link>
            <Link to="/analysis">
              <button className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg shadow-lg transition-colors ${
                isAnalysisPage 
                  ? 'bg-[#6d4c3d] text-white' 
                  : 'text-black hover:bg-gray-200'
              }`}>
                <span className="font-medium text-sm tracking-normal leading-normal whitespace-nowrap">
                  Analysis
                </span>
              </button>
            </Link>
          </nav>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
