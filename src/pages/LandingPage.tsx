import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const howItWorksSteps = [
  {
    id: 1,
    title: "Collects Data",
    description: "Pulls solar, terrain, and infrastructure data.",
    imageClass: "bg-[url(/images/data.png)]",
  },
  {
    id: 2,
    title: "Optimizes",
    description: "Weighs each factor using a real-time scoring model.",
    imageClass: "bg-[url(/images/optimization.png)]",
  },
  {
    id: 3,
    title: "Visualizes",
    description: "Displays interactive maps and top site recommendations",
    imageClass: "bg-[url(/images/visualization.png)]",
  },
]

export const LandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
       <header className="fixed w-full top-0 left-0 h-[109px] flex justify-between items-center px-4 lg:px-20 z-50" style={{background: 'linear-gradient(135deg, rgba(255, 251, 240, 0.7) 0%, rgba(255, 228, 179, 0.7) 50%, rgba(255, 179, 71, 0.7) 100%)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'}}>
        <img
          className="w-[172px] h-[69px] aspect-[2.5] object-cover"
          alt="Solarize logo"
          src="/images/solarize-logo.png"
        />

        <nav className="flex items-center gap-2">
          <Link to="/">
            <button className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg shadow-lg transition-colors ${
              location.pathname === '/' 
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
              location.pathname === '/map' 
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
              location.pathname === '/analysis' 
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

        {/* Hero Section */}
        <section 
          className="pt-[200px] pb-20 px-8 lg:px-32 relative overflow-hidden transition-opacity duration-300 bg-white"
          style={{ 
            opacity: Math.max(0, 1 - (scrollY - 0) / 200),
            transform: `translateY(${Math.min(0, (scrollY - 0) * 0.3)}px)`
          }}
        >
        {/* Solar Ray Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            className="absolute right-0 top-[-109px] w-[388px] h-[339px] opacity-60"
            alt="Solar ray"
            src="/images/solar-ray-2.svg"
          />
           <img
             className="absolute right-0 top-[-109px] w-[729px] h-[716px] opacity-100 z-20"
             alt="Solar ray"
             src="/images/solar-ray-1.svg"
           />
          <img
            className="absolute right-1/2 top-0 w-[175px] h-[198px] opacity-50"
            alt="Solar ray"
            src="/images/solar-ray-3.svg"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-start gap-10">
            <div className="flex flex-col items-start gap-6 w-full">
               <h1 className="font-bold text-black text-3xl lg:text-5xl tracking-[-1.28px] leading-[normal] max-w-4xl">
                 Welcome to Solarize
               </h1>

               <p className="font-medium text-[#000000bf] text-lg tracking-normal leading-normal max-w-2xl">
                 Find the brightest spots for solar panels.
               </p>

            </div>

             <Link to="/map">
               <button className="inline-flex items-center gap-1 px-4 py-2.5 bg-[#6d4c3d] rounded-lg shadow-lg hover:bg-[#5a3f32] transition-colors">
                 <span className="font-medium text-white text-lg tracking-[0] leading-7 whitespace-nowrap">
                   Head to Map
                 </span>
               </button>
             </Link>
          </div>
        </div>
      </section>

        {/* Rebranding Energy Section */}
        <section 
          className="py-20 px-8 lg:px-32 bg-white transition-opacity duration-300"
          style={{ 
            opacity: Math.max(0, Math.min(1, (scrollY - 200) / 200)),
            transform: `translateY(${Math.max(-50, (scrollY - 200) * 0.2)}px)`
          }}
        >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
             {/* Left side with mini logo and content */}
             <div className="flex-1">
               <div className="flex items-center gap-4 mb-6">
                 <img
                   className="w-24 h-24 aspect-[1] object-contain flex-shrink-0"
                   alt="Solar panel icon"
                   src="/images/solarize-mini-logo.png"
                 />
                 <h2 className="font-semibold text-black text-3xl lg:text-4xl tracking-[-0.96px] leading-[normal] text-left">
                   REBRANDING ENERGY
                 </h2>
               </div>

               <div className="space-y-8">
                 <p className="font-medium text-[#000000bf] text-lg tracking-normal leading-normal text-left">
                   Automating land surveys for optimal solar panel locations using open-source data from NASA, NREL, and OpenStreetMap (OSM).
                 </p>

                 <div className="space-y-4">
                   <h3 className="font-medium text-black text-xl tracking-[0] leading-9">
                     What Solarize Does:
                   </h3>
                   <p className="font-medium text-[#000000bf] text-lg tracking-normal leading-normal max-w-md">
                     Solarize analyzes solar irradiance and terrain to provide areas with highest energy output.
                   </p>
                 </div>

                 <div className="space-y-4">
                   <h3 className="font-medium text-black text-xl tracking-[0] leading-9">
                     Goals
                   </h3>
                   <ul className="list-disc list-inside font-medium text-[#000000bf] text-lg tracking-normal leading-normal space-y-2">
                     <li>Maximize energy output</li>
                     <li>Reduce costs and risks</li>
                     <li>Increase accessibility to sustainable living</li>
                   </ul>
                 </div>
               </div>
             </div>

            {/* Right side with image */}
            <div className="flex items-center justify-center w-full lg:w-auto">
              <img
                className="w-full max-w-[816px] h-auto aspect-[1.5] object-cover rounded-lg shadow-lg scale-110"
                alt="Image"
                src="/images/image-5.png"
              />
            </div>
          </div>
        </div>
      </section>

        {/* How It Works Section */}
        <section 
          className="py-20 px-8 lg:px-32 mb-16 transition-opacity duration-300 bg-white"
          style={{ 
            opacity: Math.max(0, Math.min(1, (scrollY - 500) / 200)),
            transform: `translateY(${Math.max(-50, (scrollY - 500) * 0.2)}px)`
          }}
        >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-semibold text-black text-3xl lg:text-4xl tracking-[-0.96px] leading-[normal] mb-4">
              How It Works
            </h2>
            <p className="font-semibold text-[#828282] text-xl tracking-[0] leading-9">
              Solarize....
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step) => (
              <article 
                key={step.id} 
                className="flex flex-col items-center text-center space-y-6 transition-opacity duration-1000"
                style={{
                  opacity: Math.max(0, Math.min(1, (scrollY - 500) / 200))
                }}
              >
                <div
                  className={`w-full h-[270px] rounded-lg ${step.imageClass} bg-cover bg-[50%_50%] shadow-lg`}
                />
                <div className="space-y-2 max-w-xs mx-auto">
                  <h3 className="font-medium text-black text-xl tracking-[0] leading-9">
                    {step.title}
                  </h3>
                  <p className="font-normal text-[#828282] text-base tracking-[0] leading-6">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

        {/* Footer container */}
        <div className="relative">
          {/* CTA Section - positioned on top of footer */}
          <section 
            className="absolute top-[-40px] left-0 w-full py-[30px] px-8 lg:px-32 bg-gray-100 transition-opacity duration-300 z-10"
            style={{ 
              opacity: Math.max(0, Math.min(1, (scrollY - 800) / 200)),
              transform: `translateY(${Math.max(-50, (scrollY - 800) * 0.2)}px)`
            }}
          >
         <div className="max-w-7xl mx-auto">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
             <h2 className="font-semibold text-black text-2xl lg:text-3xl tracking-[-0.96px] leading-[normal] text-center sm:text-left">
               Check Out Solarize
             </h2>
             <Link to="/map">
               <button className="inline-flex items-center gap-1 px-4 py-2.5 bg-[#6d4c3d] rounded-lg shadow-lg hover:bg-[#5a3f32] transition-colors">
                 <span className="font-medium text-white text-lg tracking-[0] leading-7 whitespace-nowrap">
                   Launch Map
                 </span>
               </button>
             </Link>
           </div>
         </div>
          </section>

          {/* Footer */}
          <footer 
            className="py-8 px-8 lg:px-32 pt-32"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 251, 240, 1) 0%, rgba(255, 228, 179, 1) 50%, rgba(255, 179, 71, 1) 100%)',
              opacity: Math.max(0, Math.min(1, (scrollY - 1000) / 200)),
              transform: `translateY(${Math.max(-50, (scrollY - 1000) * 0.2)}px)`
            }}
          >
           <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
               <div className="flex flex-col items-center lg:items-start space-y-4">
                 <img
                   className="w-[172px] h-[69px] aspect-[2.5] object-cover"
                   alt="Solarize logo"
                   src="/images/solarize-logo.png"
                 />
                 <p className="font-medium text-[#000000bf] text-lg tracking-normal leading-normal text-center lg:text-left">
                   Join Us in Building a Brighter World
                 </p>
               </div>

               <div className="flex justify-center lg:justify-end">
                 <p className="font-medium text-[#444444] text-sm tracking-normal leading-normal">
                   Made By Iris, Liam &amp; Alec
                 </p>
               </div>
             </div>
           </div>
         </footer>
        </div>
    </div>
  )
}
