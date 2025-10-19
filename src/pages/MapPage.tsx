import React from 'react'
import { SolarMap } from '../components/map/SolarMap'
import { RadiusControl } from '../components/map/RadiusControl'
import { AnalysisPanel } from '../components/AnalysisPanel'
import { Card } from '../components/ui/Card'
import { Link } from 'react-router-dom'

export const MapPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-[#f6fff4] via-[#e8f5e8] to-[#d4f1d4] min-h-screen">
      {/* Header */}
      <header className="fixed w-full top-0 left-0 h-[109px] flex items-center px-4 lg:px-20 z-50 bg-[#f6fff4]/95 backdrop-blur-sm">
        <Link to="/">
          <img
            className="w-[172px] h-[69px] aspect-[2.5] object-cover"
            alt="Solarize logo"
            src="/images/solarize-logo.png"
          />
        </Link>

        <div className="flex-1" />

        <nav className="flex items-center">
          <Link to="/">
            <button className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#6d4c3d] rounded-lg shadow-lg hover:bg-[#5a3f32] transition-colors">
              <span className="font-medium text-white text-sm tracking-normal leading-normal whitespace-nowrap">
                Home
              </span>
            </button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="pt-[145px] pb-20 px-8 lg:px-32">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="font-bold text-black text-4xl lg:text-5xl tracking-[-1.28px] leading-[normal] mb-4">
              Solar Analysis Map
            </h1>
            <p className="font-medium text-[#000000bf] text-lg tracking-normal leading-normal">
              Select a location and analyze solar potential for optimal panel placement
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Map Section */}
            <div className="lg:col-span-3 space-y-6">
              {/* Map */}
              <Card className="p-0 overflow-hidden shadow-lg rounded-xl h-[480px]">
                <SolarMap />
              </Card>
              
              {/* Radius Control */}
              <RadiusControl />
            </div>
            
            {/* Right Column - Analysis Section */}
            <div className="lg:col-span-2">
              <AnalysisPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
