import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const Hero = () => {
  const heroRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (heroRef.current && glowRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        // Calculate mouse position relative to the hero section
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        // Constrain glow within hero section boundaries
        const glowWidth = 500; // As defined in style
        const glowHeight = 500;
        const maxX = rect.width - glowWidth;
        const maxY = rect.height - glowHeight;

        // Clamp mouse coordinates to keep glow inside hero section
        mouseX = Math.max(-glowWidth / 2, Math.min(mouseX, rect.width - glowWidth / 2));
        mouseY = Math.max(-glowHeight / 2, Math.min(mouseY, rect.height - glowHeight / 2));

        gsap.to(glowRef.current, {
          x: mouseX,
          y: mouseY,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: true,
        });
      }
    };

    const setInitialGlowPosition = () => {
      if (heroRef.current && glowRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        gsap.set(glowRef.current, {
          x: rect.width / 2 - 250, // Center of hero section
          y: rect.height / 2 - 250,
        });
      }
    };

    setInitialGlowPosition();
    window.addEventListener('resize', setInitialGlowPosition);
    // Only listen for mouse move within the hero section
    heroRef.current?.addEventListener('mousemove', handleMouseMove);

    return () => {
      heroRef.current?.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', setInitialGlowPosition);
      gsap.killTweensOf(glowRef.current);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative py-20 px-4 text-center min-h-screen flex items-center justify-center
                 bg-gray-50 dark:bg-transparent  rounded-2xl transition-colors duration-500 overflow-hidden"
    >
      {/* Radial Gradient Glow */}
      <div
        ref={glowRef}
        className="absolute z-0 rounded-full pointer-events-none
                   bg-gradient-to-r from-orange-400 to-amber-400 blur-[100px]
                   opacity-30 dark:opacity-20"
        style={{ width: '500px', height: '500px' }}
      ></div>

      <div className="relative max-w-4xl mx-auto z-10">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight animate-fade-in-up
                     text-charcoal dark:text-white"
        >
          Unlock Your Academic Potential
        </h1>
        <p
          className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200
                     text-charcoal/90 dark:text-gray-300 dark:opacity-90"
        >
          Seamlessly discover, contribute, and organize a wealth of study materials – from notes to past papers, all in one place, absolutely free!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
          <Link
            to="upload"
            className="flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-lg shadow-xl cursor-pointer
                       transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl
                       bg-amber-400 text-charcoal dark:bg-white dark:text-blue-600
                       hover:bg-amber-300 dark:hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" /> Upload Your Resources
          </Link>
          <Link
            to="resources"
            className="flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-lg cursor-pointer
                       transition-all duration-300 ease-in-out transform hover:scale-105
                       bg-transparent text-charcoal border-2 border-charcoal
                       dark:text-white dark:border-white
                       hover:bg-charcoal hover:text-white
                       dark:hover:bg-white dark:hover:text-blue-600"
          >
            <FontAwesomeIcon icon={faSearch} className="text-xl" /> Explore Study Materials
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;