import React, { useState, useEffect, useRef } from "react";
import { CloudUpload, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const raysRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    // Enhanced glow effect with smooth cursor following
    const handleMouseMove = (event) => {
      if (heroRef.current && glowRef.current && raysRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        const glowSize = Math.min(800, rect.width * 0.8, rect.height * 0.8);

        // Center the glow on the cursor
        mouseX = mouseX - glowSize / 2;
        mouseY = mouseY - glowSize / 2;

        // Animate main glow with smooth delay using CSS transitions
        if (glowRef.current) {
          glowRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
          glowRef.current.style.transition = 'transform 1.5s ease-out';
        }

        // Animate rays with slightly more delay for layered effect
        if (raysRef.current) {
          raysRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
          raysRef.current.style.transition = 'transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
      }
    };

    const setInitialGlowPosition = () => {
      if (heroRef.current && glowRef.current && raysRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const glowSize = Math.min(800, rect.width * 0.8, rect.height * 0.8);
        const centerX = rect.width / 2 - glowSize / 2;
        const centerY = rect.height / 2 - glowSize / 2;

        glowRef.current.style.transform = `translate(${centerX}px, ${centerY}px)`;
        raysRef.current.style.transform = `translate(${centerX}px, ${centerY}px)`;
      }
    };

    // Enhanced particle animation with responsive positioning
    const createParticleAnimation = () => {
      if (heroRef.current && particlesRef.current.length > 0) {
        const rect = heroRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Responsive particle count based on screen size
        const isMobile = rect.width < 768;
        const activeParticles = isMobile ? 25 : 50;

        particlesRef.current.forEach((particle, index) => {
          // Hide extra particles on mobile
          if (index >= activeParticles) {
            if (particle) {
              particle.style.opacity = '0';
              particle.style.display = 'none';
            }
            return;
          } else {
            if (particle) {
              particle.style.display = 'block';
            }
          }

          // Randomly determine particle type (0: small dot, 1: medium glow, 2: large spark)
          const particleType = Math.floor(Math.random() * 3);

          // Responsive sizing
          const baseSize = isMobile ? 0.7 : 1;
          const size =
            particleType === 0
              ? (Math.random() * 2 + 2) * baseSize
              : particleType === 1
              ? (Math.random() * 4 + 3) * baseSize
              : (Math.random() * 6 + 4) * baseSize;

          const opacity =
            particleType === 0
              ? Math.random() * 0.3 + 0.3
              : particleType === 1
              ? Math.random() * 0.4 + 0.4
              : Math.random() * 0.4 + 0.6;

          // Generate random angle for radial distribution with some variation
          const baseAngle = (index / activeParticles) * Math.PI * 2;
          const angle = baseAngle + (Math.random() - 0.5);

          // Responsive distance calculations
          const minDistance = isMobile ? 50 : 100;
          const maxDistance = Math.min(rect.width, rect.height) * (isMobile ? 0.35 : 0.6);

          animateParticle(particle, {
            centerX,
            centerY,
            angle,
            minDistance,
            maxDistance: maxDistance * (particleType === 0 ? 0.8 : particleType === 1 ? 0.9 : 1),
            duration: particleType === 0 ? Math.random() * 2 + 3 : particleType === 1 ? Math.random() * 3 + 5 : Math.random() * 3 + 7,
            size,
            opacity,
            delay: index * (particleType === 0 ? 0.1 : particleType === 1 ? 0.15 : 0.2),
            containerWidth: rect.width,
            containerHeight: rect.height,
          });
        });
      }
    };

    const animateParticle = (
      particle,
      {
        centerX,
        centerY,
        angle,
        minDistance,
        maxDistance,
        duration,
        size,
        opacity,
        delay,
        containerWidth,
        containerHeight,
      }
    ) => {
      if (!particle) return;

      // Calculate random distance from center
      const distance = Math.random() * (maxDistance - minDistance) + minDistance;

      // Calculate end position based on angle and distance
      let endX = centerX + Math.cos(angle) * distance;
      let endY = centerY + Math.sin(angle) * distance;

      // Ensure particles stay within container bounds with padding
      const padding = 50;
      endX = Math.max(padding, Math.min(containerWidth - padding, endX));
      endY = Math.max(padding, Math.min(containerHeight - padding, endY));

      // Set initial properties
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.opacity = '0';
      particle.style.transform = 'translate(-50%, -50%) scale(0)';

      // Animate the particle
      setTimeout(() => {
        if (particle) {
          particle.style.transition = `all ${duration}s ease-out`;
          particle.style.left = endX + 'px';
          particle.style.top = endY + 'px';
          particle.style.opacity = opacity;
          particle.style.transform = 'translate(-50%, -50%) scale(1)';

          // Restart animation after completion
          setTimeout(() => {
            if (particle) {
              particle.style.transition = `all 1.5s ease-in`;
              particle.style.opacity = '0';
              particle.style.transform = 'translate(-50%, -50%) scale(0)';

              // Restart with new parameters
              setTimeout(() => {
                const newAngle = angle + (Math.random() - 0.5) * 0.6;
                const newDistance = Math.random() * (maxDistance * 1.2 - minDistance * 0.8) + minDistance * 0.8;
                animateParticle(particle, {
                  centerX,
                  centerY,
                  angle: newAngle,
                  minDistance,
                  maxDistance: Math.min(newDistance, containerWidth * 0.4, containerHeight * 0.4),
                  duration: duration * (Math.random() * 0.4 + 0.8),
                  size,
                  opacity,
                  delay: 0,
                  containerWidth,
                  containerHeight,
                });
              }, 1500);
            }
          }, duration * 1000);
        }
      }, delay * 1000);
    };

    setInitialGlowPosition();
    
    // Add a small delay for initial load to ensure proper measurements
    const initTimeout = setTimeout(() => {
      setInitialGlowPosition();
      createParticleAnimation();
    }, 100);

    const handleResize = () => {
      setInitialGlowPosition();
      createParticleAnimation();
    };

    window.addEventListener("resize", handleResize);
    if (heroRef.current) {
      heroRef.current.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      clearTimeout(initTimeout);
      if (heroRef.current) {
        heroRef.current.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Generate particles with enhanced visual properties and different types
  const particles = Array.from({ length: 50 }, (_, index) => {
    // Randomly determine particle type for initial styling
    const type = Math.floor(Math.random() * 3);
    const size =
      type === 0
        ? Math.random() * 2 + 2
        : type === 1
        ? Math.random() * 4 + 3
        : Math.random() * 6 + 4;

    const isRectangle = type === 2 && Math.random() > 0.5;
    const borderRadius = isRectangle ? "10%" : "50%";

    const colors = [
      "rgba(251, 146, 60, 0.8)", // orange-400
      "rgba(245, 158, 11, 0.7)", // amber-400
      "rgba(234, 88, 12, 0.6)", // orange-600
      "rgba(249, 115, 22, 0.7)", // orange-500
      "rgba(253, 186, 116, 0.8)", // orange-300
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];

    return (
      <div
        key={index}
        ref={(el) => (particlesRef.current[index] = el)}
        className="absolute pointer-events-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: borderRadius,
          background:
            type === 1
              ? `radial-gradient(circle, ${color}, transparent 70%)`
              : color,
          boxShadow:
            type === 2
              ? `0 0 ${size * 1.5}px ${color}`
              : `0 0 ${size}px ${color}`,
          zIndex: 8,
          opacity: 0, // Start invisible (animation will handle opacity)
        }}
      />
    );
  });

  return (
    <section
      ref={heroRef}
      className="relative py-20 px-4 text-center min-h-[90vh] flex items-center justify-center
                   rounded-2xl transition-colors duration-500 overflow-hidden"
    >
      {/* Enhanced Radial Rays - Outer layer */}
      <div
        ref={raysRef}
        className="absolute z-0 rounded-full pointer-events-none"
        style={{
          width: "min(800px, 80vw, 80vh)",
          height: "min(800px, 80vw, 80vh)",
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
          filter: "blur(60px)",
        }}
      ></div>

      {/* Main Glow - Inner layer */}
      <div
        ref={glowRef}
        className="absolute z-1 rounded-full pointer-events-none"
        style={{
          width: "min(800px, 80vw, 80vh)",
          height: "min(800px, 80vw, 80vh)",
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
          filter: "blur(120px)",
        }}
      ></div>

      {/* Intense Center Glow */}
      <div
        className="absolute z-2 rounded-full pointer-events-none"
        style={{
          width: "min(400px, 40vw, 40vh)",
          height: "min(400px, 40vw, 40vh)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: `
            radial-gradient(circle at center, 
              rgba(251, 146, 60, 0.4) 0%,
              rgba(245, 158, 11, 0.2) 30%,
              transparent 70%
            )
          `,
          filter: "blur(80px)",
        }}
      ></div>

      {/* Enhanced Particles */}
      {particles}

      <div className="relative max-w-4xl mx-auto z-10">
        <h1
          className="text-3xl sm:text-4xl lg:text-6xl font-extrabold mb-4 sm:mb-5 leading-tight
                     text-gray-900 dark:text-white"
        >
          Unlock Your{" "}
          <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
            Academic Potential
          </span>
        </h1>
        <p
          className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto
                     text-gray-700 dark:text-gray-300"
        >
          Seamlessly discover, contribute, and organize a wealth of study
          materials – from notes to past papers, all in one place, absolutely
          free!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
          <Link to={'/upload'}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-lg cursor-pointer
                       transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5
                       bg-gradient-to-r from-orange-500 to-yellow-500 text-white
                       hover:from-orange-600 hover:to-yellow-600 text-sm sm:text-base
                       shadow-lg hover:shadow-xl"
          >
            <CloudUpload className="w-5 h-5" />
            <span>Upload Your Resources</span>
          </Link>
          <Link to={'/resources'}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-lg cursor-pointer
                       transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5
                       bg-transparent text-orange-600 border-2 border-orange-500
                       dark:text-orange-400 dark:border-orange-500
                       hover:bg-orange-500 hover:text-white hover:border-orange-500
                       dark:hover:bg-orange-500 dark:hover:text-white text-sm sm:text-base"
          >
            <Search className="w-5 h-5" />
            <span>Explore Study Materials</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
