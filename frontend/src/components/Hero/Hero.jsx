import React, { useState, useEffect, useRef } from 'react';

const Hero = () => {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const raysRef = useRef(null);
  const particlesRef = useRef([]);
  const lastMouseUpdate = useRef(0);

  useEffect(() => {
    // Throttled mouse movement (60fps max instead of unlimited)
    const handleMouseMove = (event) => {
      const now = Date.now();
      if (now - lastMouseUpdate.current < 16) return; // ~60fps throttle
      lastMouseUpdate.current = now;

      if (heroRef.current && glowRef.current && raysRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        const glowSize = 800; // Back to original size
        
        mouseX = mouseX - glowSize / 2;
        mouseY = mouseY - glowSize / 2;

        // Use CSS transforms instead of GSAP for better performance
        glowRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        raysRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    };

    const setInitialGlowPosition = () => {
      if (heroRef.current && glowRef.current && raysRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const centerX = rect.width / 2 - 400; // Adjusted for original 800px glow
        const centerY = rect.height / 2 - 400;
        
        glowRef.current.style.transform = `translate(${centerX}px, ${centerY}px)`;
        raysRef.current.style.transform = `translate(${centerX}px, ${centerY}px)`;
      }
    };

    // Simplified particle animation with CSS animations instead of JS
    const createSimpleParticles = () => {
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          // Use CSS animations instead of GSAP
          particle.style.animationDelay = `${index * 0.1}s`;
          particle.classList.add('particle-float');
        }
      });
    };

    setInitialGlowPosition();
    createSimpleParticles();
    
    const handleResize = () => {
      setInitialGlowPosition();
    };

    window.addEventListener('resize', handleResize);
    heroRef.current?.addEventListener('mousemove', handleMouseMove);

    return () => {
      heroRef.current?.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reduced particles from 50 to 15
  const particles = Array.from({ length: 15 }, (_, index) => {
    const size = Math.random() * 3 + 2;
    const delay = Math.random() * 10;
    
    return (
      <div
        key={index}
        ref={(el) => (particlesRef.current[index] = el)}
        className="absolute pointer-events-none particle opacity-60"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'rgba(251, 146, 60, 0.6)',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <style jsx>{`
        .particle-float {
          animation: floatParticle 8s infinite ease-in-out;
        }
        
        @keyframes floatParticle {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-20px) translateX(10px); 
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-10px) translateX(-15px); 
            opacity: 1;
          }
          75% { 
            transform: translateY(-30px) translateX(5px); 
            opacity: 0.6;
          }
        }
        
        .glow-element {
          transition: transform 0.3s ease-out;
        }
      `}</style>
      
      <section
        ref={heroRef}
        className="relative py-20 px-4 text-center min-h-screen flex items-center justify-center
                   bg-gray-50 dark:bg-transparent rounded-2xl transition-colors duration-500 overflow-hidden"
      >
        {/* Radial Rays - keeping original blur intensity */}
        <div
          ref={raysRef}
          className="absolute z-0 rounded-full pointer-events-none glow-element"
          style={{ 
            width: '800px', 
            height: '800px',
            background: `
              radial-gradient(circle at center, 
                rgba(251, 146, 60, 0.15) 0%,
                rgba(245, 158, 11, 0.12) 20%,
                rgba(217, 119, 6, 0.08) 40%,
                rgba(180, 83, 9, 0.05) 60%,
                rgba(120, 53, 15, 0.02) 80%,
                transparent 100%
              )
            `,
            filter: 'blur(60px)', // Original intensity
          }}
        ></div>

        {/* Main Glow - original complexity */}
        <div
          ref={glowRef}
          className="absolute z-1 rounded-full pointer-events-none glow-element"
          style={{ 
            width: '800px', 
            height: '800px',
            background: `
              radial-gradient(circle at center, 
                rgba(251, 146, 60, 0.3) 0%,
                rgba(245, 158, 11, 0.25) 15%,
                rgba(217, 119, 6, 0.15) 35%,
                rgba(180, 83, 9, 0.08) 55%,
                rgba(120, 53, 15, 0.03) 75%,
                transparent 100%
              )
            `,
            filter: 'blur(120px)', // Original intensity
          }}
        ></div>

        {/* Intense Center Glow */}
        <div
          className="absolute z-2 rounded-full pointer-events-none"
          style={{ 
            width: '400px', 
            height: '400px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `
              radial-gradient(circle at center, 
                rgba(251, 146, 60, 0.4) 0%,
                rgba(245, 158, 11, 0.2) 30%,
                transparent 70%
              )
            `,
            filter: 'blur(80px)',
          }}
        ></div>

        {/* Simplified Particles */}
        {particles}

        <div className="relative max-w-4xl mx-auto z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold mb-4 sm:mb-5 leading-tight text-white">
            Unlock Your{' '}
            <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
              Academic Potential
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto text-gray-300">
            Seamlessly discover, contribute, and organize a wealth of study materials – from notes to past papers, all in one place, absolutely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
            <button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-lg shadow-lg cursor-pointer
                       transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5
                       bg-gradient-to-r from-orange-500 to-yellow-500 text-white
                       hover:from-orange-600 hover:to-yellow-600 text-sm sm:text-base">
              <span>📤</span>
              <span>Upload Your Resources</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-lg cursor-pointer
                       transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5
                       bg-transparent text-orange-400 border-2 border-orange-500
                       hover:bg-orange-500 hover:text-white hover:border-orange-500 text-sm sm:text-base">
              <span>🔍</span>
              <span>Explore Study Materials</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;