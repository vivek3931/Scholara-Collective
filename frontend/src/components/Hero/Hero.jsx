import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt, faSearch } from "@fortawesome/free-solid-svg-icons";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

const Hero = () => {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const raysRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(MotionPathPlugin);
    // Enhanced glow effect with smooth cursor following
    const handleMouseMove = (event) => {
      if (heroRef.current && glowRef.current && raysRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        const glowSize = 800;

        // Center the glow on the cursor
        mouseX = mouseX - glowSize / 2;
        mouseY = mouseY - glowSize / 2;

        // Animate main glow with smooth delay
        gsap.to(glowRef.current, {
          x: mouseX,
          y: mouseY,
          duration: 1.5,
          ease: "power2.out",
          overwrite: true,
        });

        // Animate rays with slightly more delay for layered effect
        gsap.to(raysRef.current, {
          x: mouseX,
          y: mouseY,
          duration: 2,
          ease: "power3.out",
          overwrite: true,
        });
      }
    };

    const setInitialGlowPosition = () => {
      if (heroRef.current && glowRef.current && raysRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const centerX = rect.width / 2 - 400;
        const centerY = rect.height / 2 - 400;

        gsap.set([glowRef.current, raysRef.current], {
          x: centerX,
          y: centerY,
        });
      }
    };

    // Enhanced particle animation with multiple types and behaviors
    const createParticleAnimation = () => {
      if (heroRef.current && particlesRef.current.length > 0) {
        const rect = heroRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        particlesRef.current.forEach((particle, index) => {
          // Randomly determine particle type (0: small dot, 1: medium glow, 2: large spark)
          const particleType = Math.floor(Math.random() * 3);

          // Set initial properties based on type
          const size =
            particleType === 0
              ? gsap.utils.random(2, 4)
              : particleType === 1
              ? gsap.utils.random(4, 6)
              : gsap.utils.random(6, 10);

          const opacity =
            particleType === 0
              ? gsap.utils.random(0.3, 0.6)
              : particleType === 1
              ? gsap.utils.random(0.4, 0.8)
              : gsap.utils.random(0.6, 1);

          const blur = particleType === 0 ? 0 : particleType === 1 ? 2 : 4;

          // Generate random angle for radial distribution with some variation
          const baseAngle = (index / particlesRef.current.length) * Math.PI * 2;
          const angle = baseAngle + gsap.utils.random(-0.5, 0.5);

          // Different behaviors based on particle type
          if (particleType === 0) {
            // Small dots - fast and linear movement
            animateParticle(particle, {
              centerX,
              centerY,
              angle,
              minDistance: 100,
              maxDistance: Math.max(rect.width, rect.height) * 0.6,
              duration: gsap.utils.random(3, 5),
              size,
              opacity,
              blur,
              delay: index * 0.1,
              ease: "none",
              shape: "circle",
            });
          } else if (particleType === 1) {
            // Medium glows - slower with easing
            animateParticle(particle, {
              centerX,
              centerY,
              angle,
              minDistance: 150,
              maxDistance: Math.max(rect.width, rect.height) * 0.7,
              duration: gsap.utils.random(5, 8),
              size,
              opacity,
              blur,
              delay: index * 0.15,
              ease: "sine.out",
              shape: "circle",
            });
          } else {
            // Large sparks - irregular movement with rotation
            animateParticle(particle, {
              centerX,
              centerY,
              angle,
              minDistance: 200,
              maxDistance: Math.max(rect.width, rect.height) * 0.8,
              duration: gsap.utils.random(7, 10),
              size,
              opacity,
              blur,
              delay: index * 0.2,
              ease: "power2.inOut",
              shape: Math.random() > 0.5 ? "circle" : "rectangle",
              rotation: gsap.utils.random(0, 360),
            });
          }
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
        blur,
        delay,
        ease,
        shape,
        rotation = 0,
      }
    ) => {
      // Calculate random distance from center
      const distance = gsap.utils.random(minDistance, maxDistance);

      // Calculate end position based on angle and distance
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      // Random path variation for more organic movement
      const midX =
        centerX + Math.cos(angle) * distance * gsap.utils.random(0.3, 0.7);
      const midY =
        centerY + Math.sin(angle) * distance * gsap.utils.random(0.3, 0.7);

      // Set initial properties
      gsap.set(particle, {
        x: centerX,
        y: centerY,
        opacity: 0,
        scale: 0,
        rotation: rotation,
        width: size,
        height: size,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
      });

      // Create motion path for more interesting movement
      const path = [
        { x: centerX, y: centerY },
        { x: midX, y: midY },
        { x: endX, y: endY },
      ];

      // Animate along the path
      gsap.to(particle, {
        motionPath: {
          path: path,
          autoRotate: shape === "rectangle",
          align: shape === "rectangle" ? "self" : "none",
        },
        opacity: opacity,
        scale: 1,
        duration: duration,
        ease: ease,
        delay: delay,
        onComplete: () => {
          // Fade out and restart
          gsap.to(particle, {
            opacity: 0,
            scale: 0,
            duration: 1.5,
            ease: "power2.in",
            onComplete: () => {
              // Slightly modify parameters for variation
              const newAngle = angle + gsap.utils.random(-0.3, 0.3);
              const newDistance = gsap.utils.random(
                minDistance * 0.8,
                maxDistance * 1.2
              );
              animateParticle(particle, {
                centerX,
                centerY,
                angle: newAngle,
                minDistance,
                maxDistance: newDistance,
                duration: duration * gsap.utils.random(0.8, 1.2),
                size,
                opacity,
                blur,
                delay: 0,
                ease,
                shape,
                rotation,
              });
            },
          });
        },
      });
    };

    setInitialGlowPosition();
    createParticleAnimation();

    const handleResize = () => {
      setInitialGlowPosition();
      createParticleAnimation();
    };

    window.addEventListener("resize", handleResize);
    heroRef.current?.addEventListener("mousemove", handleMouseMove);

    return () => {
      heroRef.current?.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      gsap.killTweensOf([glowRef.current, raysRef.current]);
      particlesRef.current.forEach((particle) => gsap.killTweensOf(particle));
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
          transform: "translate(-50%, -50%)",
          opacity: 0, // Start invisible (animation will handle opacity)
        }}
      />
    );
  });

  return (
    <section
      ref={heroRef}
      className="relative py-20 px-4 text-center min-h-screen flex items-center justify-center
                 bg-gray-50 dark:bg-transparent rounded-2xl transition-colors duration-500 overflow-hidden"
    >
      {/* Enhanced Radial Rays - Outer layer */}
      <div
        ref={raysRef}
        className="absolute z-0 rounded-full pointer-events-none"
        style={{
          width: "800px",
          height: "800px",
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
          width: "800px",
          height: "800px",
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
          width: "400px",
          height: "400px",
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
          className="text-3xl sm:text-4xl lg:text-6xl font-extrabold mb-4 sm:mb-5 leading-tight animate-fade-in-up
                   text-gray-900 dark:text-white"
        >
          Unlock Your{" "}
          <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
            Academic Potential
          </span>
        </h1>
        <p
          className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200
                   text-gray-700 dark:text-gray-300"
        >
          Seamlessly discover, contribute, and organize a wealth of study
          materials – from notes to past papers, all in one place, absolutely
          free!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400 max-w-lg sm:max-w-none mx-auto">
          <Link
            to="upload"
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-lg shadow-glow-sm cursor-pointer
                     transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-glow-sm
                     bg-gradient-to-r from-orange-500 to-yellow-500 text-white
                     hover:from-orange-600 hover:to-yellow-600 text-sm sm:text-base"
          >
            <FontAwesomeIcon
              icon={faCloudUploadAlt}
              className="text-lg sm:text-xl"
            />
            <span>Upload Your Resources</span>
          </Link>
          <Link
            to="resources"
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-lg cursor-pointer
                     transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5
                     bg-transparent text-orange-600 border-2 border-orange-500
                     dark:text-orange-400 dark:border-orange-500
                     hover:bg-orange-500 hover:text-white hover:border-orange-500
                     dark:hover:bg-orange-500 dark:hover:text-white text-sm sm:text-base"
          >
            <FontAwesomeIcon icon={faSearch} className="text-lg sm:text-xl" />
            <span>Explore Study Materials</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
