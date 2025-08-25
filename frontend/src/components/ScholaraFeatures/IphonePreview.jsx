import React, { useState } from 'react';
import { Power } from 'lucide-react';
import FeatureShowcaseMobile from './FeatureShowcaseMobile';

export default function IphonePreview() {
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isVolumePressed, setIsVolumePressed] = useState({ up: false, down: false });

  const handlePowerToggle = () => {
    setIsPoweredOn(!isPoweredOn);
  };

  const handleVolumePress = (type, pressed) => {
    setIsVolumePressed(prev => ({
      ...prev,
      [type]: pressed
    }));
  };

  // Dimensions for Dynamic Island based on Tailwind classes
  const dynamicIslandWidthSmall = 85; // w-[85px]
  const dynamicIslandHeightSmall = 20; // h-5 (1rem = 16px, so 5 = 20px)
  const dynamicIslandRadiusSmall = dynamicIslandHeightSmall / 2; // For rounded-full, radius is half of height (10)

  const dynamicIslandWidthLarge = 100; // lg:w-[100px]
  const dynamicIslandHeightLarge = 24; // lg:h-6 (1.5rem = 24px)
  const dynamicIslandRadiusLarge = dynamicIslandHeightLarge / 2; // For rounded-full, radius is half of height (12)

  /**
   * Generates an SVG path string for a horizontal capsule (pill) shape.
   * A capsule shape is essentially two semicircles joined by two straight lines.
   * @param {number} width The total width of the capsule.
   * @param {number} height The total height of the capsule.
   * @param {number} radius The radius of the rounded ends (should be height / 2).
   * @returns {string} The SVG path data string.
   */
  const getCapsulePath = (width, height, radius) => {
    // Start at the top-left point of the top horizontal line segment (after the curve)
    // M (radius, 0)
    // H (width - radius) -> Draw top horizontal line to (width - radius, 0)
    // A (radius, radius) 0 0 1 (width - radius, height) -> Draw the right semicircle
    // H (radius) -> Draw bottom horizontal line to (radius, height)
    // A (radius, radius) 0 0 1 (radius, 0) -> Draw the left semicircle and close the path
    return `
      M ${radius} 0
      H ${width - radius}
      A ${radius} ${radius} 0 0 1 ${width - radius} ${height}
      H ${radius}
      A ${radius} ${radius} 0 0 1 ${radius} 0
      Z
    `;
  };

  // Calculate paths for both small and large dynamic islands
  const pathSmall = getCapsulePath(dynamicIslandWidthSmall, dynamicIslandHeightSmall, dynamicIslandRadiusSmall);
  const pathLarge = getCapsulePath(dynamicIslandWidthLarge, dynamicIslandHeightLarge, dynamicIslandRadiusLarge);

  return (
    <>
      <style jsx>{`
        /* Keyframe for drawing text characters */
        @keyframes draw {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        
        /* Keyframe for a glowing effect */
        @keyframes glow {
          from {
            filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.8));
          }
          to {
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 1)) drop-shadow(0 0 16px rgba(245, 158, 11, 0.6));
          }
        }

        /* Keyframe for the dynamic island outline animation */
        @keyframes movePillOutline {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1; } /* Moves the dash one full path length */
        }

        /* Class for text drawing animation with glow */
        .animate-draw-letter {
          stroke-dasharray: 1; /* Full path length as dash, no gap initially */
          stroke-dashoffset: 1; /* Offset by one full path length */
          animation: draw 0.8s ease-out forwards, glow 2s ease-in-out infinite alternate;
        }

        /* Class for the dynamic island outline animation with glow */
        .animate-pill-outline {
          stroke-dasharray: 0.1 1; /* Creates a dash 10% of path length, and a gap of 90% */
          stroke-dashoffset: 0; /* Starting offset */
          animation: movePillOutline 3s linear infinite, glow 2s ease-in-out infinite alternate;
          fill: none; /* Ensure the SVG path is an outline only */
        }
      `}</style>
      
      {/* Main container for the iPhone preview */}
      <div className="flex justify-center items-center min-h-screen bg-transparent p-4">
        {/* iPhone frame */}
        <div className="relative w-64 h-[500px] md:w-[330px] md:h-[600px] rounded-[3rem] shadow-glow-sm border-[14px] border-black bg-black overflow-visible">
          
          {/* Power Button */}
          <button
            onClick={handlePowerToggle}
            className="absolute -right-[18px] top-20 w-1 h-12 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 rounded-r-sm shadow-md border-r border-gray-600 focus:outline-none"
            style={{ 
              boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3), 1px 0 1px rgba(255,255,255,0.1)' 
            }}
            aria-label="Power button"
          />

          {/* Volume Up Button */}
          <button
            onMouseDown={() => handleVolumePress('up', true)}
            onMouseUp={() => handleVolumePress('up', false)}
            onMouseLeave={() => handleVolumePress('up', false)}
            className={`absolute -left-[18px] top-24 w-1 h-8 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 rounded-l-sm shadow-md border-l border-gray-600 focus:outline-none ${
              isVolumePressed.up ? 'bg-gray-600' : ''
            }`}
            style={{ 
              boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3), -1px 0 1px rgba(255,255,255,0.1)' 
            }}
            aria-label="Volume up"
          />

          {/* Volume Down Button */}
          <button
            onMouseDown={() => handleVolumePress('down', true)}
            onMouseUp={() => handleVolumePress('down', false)}
            onMouseLeave={() => handleVolumePress('down', false)}
            className={`absolute -left-[18px] top-36 w-1 h-8 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 rounded-l-sm shadow-md border-l border-gray-600 focus:outline-none ${
              isVolumePressed.down ? 'bg-gray-600' : ''
            }`}
            style={{ 
              boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3), -1px 0 1px rgba(255,255,255,0.1)' 
            }}
            aria-label="Volume down"
          />

          {/* Mute Switch */}
          <div className="absolute -left-[16px] top-16 w-0.5 h-4 bg-gray-800 rounded-l-sm shadow-sm border-l border-gray-700" />

          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85px] lg:w-[100px] lg:h-6 h-5 rounded-full bg-black shadow-md border border-gray-800 z-30 overflow-visible">
            {!isPoweredOn && (
              <>
                {/* SVG for Dynamic Island Outline (Small Screens) */}
                <svg className="absolute inset-0 w-full h-full lg:hidden" viewBox={`0 0 ${dynamicIslandWidthSmall} ${dynamicIslandHeightSmall}`} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Gradient for the glowing dynamic island outline */}
                        <linearGradient id="dynamicIslandGradientSmall" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="25%" stopColor="#f59e0b" /> {/* Amber-400 */}
                            <stop offset="75%" stopColor="#ea580c" /> {/* Orange-600 */}
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path
                        d={pathSmall}
                        className="animate-pill-outline"
                        strokeWidth="2"
                        pathLength="1"
                        style={{
                            stroke: 'url(#dynamicIslandGradientSmall)',
                        }}
                    />
                </svg>

                {/* SVG for Dynamic Island Outline (Large Screens) */}
                <svg className="hidden lg:block absolute inset-0 w-full h-full" viewBox={`0 0 ${dynamicIslandWidthLarge} ${dynamicIslandHeightLarge}`} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Gradient for the glowing dynamic island outline */}
                        <linearGradient id="dynamicIslandGradientLarge" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="25%" stopColor="#f59e0b" /> {/* Amber-400 */}
                            <stop offset="75%" stopColor="#ea580c" /> {/* Orange-600 */}
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path
                        d={pathLarge}
                        className="animate-pill-outline"
                        strokeWidth="2"
                        pathLength="1"
                        style={{
                            stroke: 'url(#dynamicIslandGradientLarge)',
                        }}
                    />
                </svg>
              </>
            )}
          </div>

          {/* Screen area */}
          <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
            {isPoweredOn ? (
              <>
                {/* Active Screen Content */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  <div className="h-full overflow-y-auto mobile-scroll-container">
                    <FeatureShowcaseMobile />
                  </div>
                  
                  {/* Home Indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 lg:w-28 h-1.5 rounded-full dark:bg-white bg-black" />
                </div>
              </>
            ) : (
              <>
                {/* Powered Off Screen - Shows animated text and power icon */}
                <div className="w-full h-full bg-black rounded-[2.5rem] flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="mb-8">
                      <svg
                        // Adjusted viewBox to provide more horizontal padding
                        viewBox="-30 0 450 80" // Increased width to 450 and shifted x-origin to -30
                        className="max-w-full w-full h-16 md:w-96 md:h-20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Scholara text with drawing animation */}
                        {/* S */}
                        <path
                          d="M25 50 Q20 45 25 40 Q30 35 35 40 Q30 45 25 50 Q20 55 25 60 Q30 65 35 60"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '0.2s' }}
                          pathLength="1"
                        />
                        {/* C */}
                        <path
                          d="M50 40 Q45 35 40 40 Q35 45 35 50 Q35 55 40 60 Q45 65 50 60"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '0.4s' }}
                          pathLength="1"
                        />
                        {/* H */}
                        <path
                          d="M60 40 L60 60 M60 50 L70 50 M70 40 L70 60"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '0.6s' }}
                          pathLength="1"
                        />
                        {/* O */}
                        <path
                          d="M85 40 Q80 35 75 40 Q70 45 70 50 Q70 55 75 60 Q80 65 85 60 Q90 55 90 50 Q90 45 85 40 Z"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '0.8s' }}
                          pathLength="1"
                        />
                        {/* L */}
                        <path
                          d="M100 40 L100 60 L110 60"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '1s' }}
                          pathLength="1"
                        />
                        {/* A */}
                        <path
                          d="M120 60 L125 40 L130 60 M122 52 L128 52"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '1.2s' }}
                          pathLength="1"
                        />
                        {/* R */}
                        <path
                          d="M140 40 L140 60 M140 40 Q150 35 150 45 Q150 50 140 50 L150 60"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '1.4s' }}
                          pathLength="1"
                        />
                        {/* A */}
                        <path
                          d="M160 60 L165 40 L170 60 M162 52 L168 52"
                          stroke="url(#gradient1)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '1.6s' }}
                          pathLength="1"
                        />

                        {/* Collective text */}
                        {/* C */}
                        <path
                          d="M210 40 Q205 35 200 40 Q195 45 195 50 Q195 55 200 60 Q205 65 210 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '2s' }}
                          pathLength="1"
                        />
                        {/* O */}
                        <path
                          d="M225 40 Q220 35 215 40 Q210 45 210 50 Q210 55 215 60 Q220 65 225 60 Q230 55 230 50 Q230 45 225 40 Z"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '2.2s' }}
                          pathLength="1"
                        />
                        {/* L */}
                        <path
                          d="M240 40 L240 60 L250 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '2.4s' }}
                          pathLength="1"
                        />
                        {/* L */}
                        <path
                          d="M260 40 L260 60 L270 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '2.6s' }}
                          pathLength="1"
                        />
                        {/* E */}
                        <path
                          d="M280 40 L280 60 M280 40 L290 40 M280 50 L288 50 M280 60 L290 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '2.8s' }}
                          pathLength="1"
                        />
                        {/* C */}
                        <path
                          d="M305 40 Q300 35 295 40 Q290 45 290 50 Q290 55 295 60 Q300 65 305 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '3s' }}
                          pathLength="1"
                        />
                        {/* T */}
                        <path
                          d="M310 40 L330 40 M320 40 L320 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '3.2s' }}
                          pathLength="1"
                        />
                        {/* I */}
                        <path
                          d="M335 40 L345 40 M340 40 L340 60 M335 60 L345 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '3.4s' }}
                          pathLength="1"
                        />
                        {/* V */}
                        <path
                          d="M350 40 L355 60 L360 40"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '3.6s' }}
                          pathLength="1"
                        />
                        {/* E */}
                        <path
                          d="M370 40 L370 60 M370 40 L380 40 M370 50 L378 50 M370 60 L380 60"
                          stroke="url(#gradient2)"
                          strokeWidth="2"
                          fill="none"
                          className="animate-draw-letter"
                          style={{ animationDelay: '3.8s' }}
                          pathLength="1"
                        />

                        {/* Gradients for text animation */}
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#ea580c" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ea580c" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ea580c" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    
                    {/* Subtle power off indicator icon */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-30">
                      <Power size={20} className="text-white" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Subtle lighting effects on buttons when pressed (for visual feedback) */}
          {isVolumePressed.up && (
            <div className="absolute -left-[18px] top-24 w-1 h-8 bg-blue-400 opacity-20 rounded-l-sm pointer-events-none" />
          )}
          {isVolumePressed.down && (
            <div className="absolute -left-[18px] top-36 w-1 h-8 bg-blue-400 opacity-20 rounded-l-sm pointer-events-none" />
          )}
        </div>
      </div>
    </>
  );
}
