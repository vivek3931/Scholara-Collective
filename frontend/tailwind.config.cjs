// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Configure dark mode to be activated manually by adding 'dark' class to html or body
  darkMode: 'class',

  // Specify files to scan for Tailwind CSS classes
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust this based on your project structure
    './public/index.html',
  ],

  // Extend the default Tailwind CSS theme
  theme: {
    extend: {
      // Custom height utilities for consistent sizing
      height: {
        '18': '4.5rem', // 72px
        '20': '5rem',   // 80px
      },

      // Custom color palette for your theme
      colors: {
        // Main dark colors
        onyx: '#1A1A1D',      // A deep, rich black/grey for backgrounds
        charcoal: '#333333',  // Slightly lighter dark for cards/sections
        midnight: '#0C0C0C',  // Even darker, potentially for very deep shadows or outlines
        
        // Light mode colors (or accents in dark mode)
        platinum: '#E0E0E0',  // Light grey for text/elements in light mode or subtle contrast
        
        // Brand/Accent colors (used for gradients and highlights)
        // These are examples based on our discussion, adjust as needed
        'blue-500': '#3B82F6', // Standard Tailwind blue, useful for CTA
        'blue-600': '#2563EB', // Standard Tailwind blue, useful for CTA
        'orange-400': '#FB923C', // Warm orange for gradients
        'amber-500': '#F59E0B',  // Amber for gradients
        'yellow-500': '#FBBF24', // Yellow for gradients
      },

      // Custom font families
      fontFamily: {
        // Use Poppins as a primary font. Ensure you've imported it (e.g., via Google Fonts in index.html)
        poppins: ['Poppins', 'sans-serif'],
      },

      // Custom box shadows for the "backlight glow" effect
      boxShadow: {
        // Subtle glow for smaller interactive elements
        'glow-sm': '0 0 8px rgba(251, 191, 36, 0.4), 0 0 12px rgba(245, 158, 11, 0.3)',
        // More prominent glow for larger sections or focus elements
        'glow-md': '0 0 15px rgba(251, 191, 36, 0.5), 0 0 25px rgba(245, 158, 11, 0.4), 0 0 40px rgba(234, 88, 12, 0.3)',
      },

      // Custom backdrop blur utilities (if you need blurred overlays)
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '24px',
      },

      // Custom keyframes for animations
      keyframes: {
        // A subtle pulsing effect for background glows
        'subtle-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.05)', opacity: '0.6' },
        },
        // Simple fade-in animation, useful for elements appearing dynamically
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1'},
        },
      },

      // Custom animation utilities, mapping keyframes to CSS animation properties
      animation: {
        'subtle-pulse': 'subtle-pulse 4s infinite ease-in-out',
        'fade-in': 'fade-in 0.5s ease-out forwards', // 'forwards' keeps the end state
      },
    },
  },

  // Add any Tailwind CSS plugins here (e.g., for forms, typography)
  // Example: require('@tailwindcss/forms') if you are using form styling
  plugins: [],
};