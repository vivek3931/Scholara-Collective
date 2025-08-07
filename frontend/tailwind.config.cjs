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
        // Dark mode colors
        onyx: '#1A1A1D',      // A deep, rich black/grey for backgrounds
        charcoal: '#333333',  // Slightly lighter dark for cards/sections
        midnight: '#0C0C0C',  // Even darker, potentially for very deep shadows or outlines
        
        // Light mode colors - sophisticated and modern
        // Primary backgrounds and surfaces
        pearl: '#FAFAFA',     // Ultra-light warm white for main backgrounds
        ivory: '#F8F9FA',     // Slightly warmer white for cards/sections
        cream: '#F5F5F7',     // Subtle cream for elevated surfaces
        silver: '#E8E9EA',    // Light border and divider color
        
        // Text colors for light mode
        slate: '#2D3748',     // Primary text color - dark but not harsh black
        graphite: '#4A5568',  // Secondary text color
        steel: '#718096',     // Tertiary text color for subtle elements
        
        // Neutral grays that work in both modes
        platinum: '#E0E0E0',  // Light grey for text/elements
        ash: '#9CA3AF',       // Medium grey for borders and subtle elements
        
        // Enhanced brand/accent colors with light mode variants
        // Warm oranges and ambers (your existing palette)
        'orange-50': '#FFF7ED',   // Very light orange for light mode backgrounds
        'orange-100': '#FFEDD5',  // Light orange for hover states
        'orange-200': '#FED7AA',  // Soft orange for subtle highlights
        'orange-300': '#FDBA74',  // Medium orange
        'orange-400': '#FB923C',  // Your existing orange-400
        'orange-500': '#F97316',  // Vibrant orange for primary actions
        'orange-600': '#EA580C',  // Darker orange for active states
        
        'amber-50': '#FFFBEB',    // Very light amber
        'amber-100': '#FEF3C7',   // Light amber
        'amber-200': '#FDE68A',   // Soft amber
        'amber-300': '#FCD34D',   // Medium amber
        'amber-400': '#FBBF24',   // Bright amber
        'amber-500': '#F59E0B',   // Your existing amber-500
        'amber-600': '#D97706',   // Darker amber
        
        'yellow-50': '#FEFCE8',   // Very light yellow
        'yellow-100': '#FEF9C3',  // Light yellow
        'yellow-200': '#FEF08A',  // Soft yellow
        'yellow-300': '#FDE047',  // Medium yellow
        'yellow-400': '#FACC15',  // Bright yellow
        'yellow-500': '#FBBF24',  // Your existing yellow-500
        'yellow-600': '#CA8A04',  // Darker yellow
        
        // Cool accents for balance (blues and teals)
        'blue-50': '#EFF6FF',     // Very light blue
        'blue-100': '#DBEAFE',    // Light blue
        'blue-200': '#BFDBFE',    // Soft blue
        'blue-300': '#93C5FD',    // Medium blue
        'blue-400': '#60A5FA',    // Bright blue
        'blue-500': '#3B82F6',    // Your existing blue-500
        'blue-600': '#2563EB',    // Your existing blue-600
        'blue-700': '#1D4ED8',    // Darker blue
        
        'teal-50': '#F0FDFA',     // Very light teal
        'teal-100': '#CCFBF1',    // Light teal
        'teal-200': '#99F6E4',    // Soft teal
        'teal-300': '#5EEAD4',    // Medium teal
        'teal-400': '#2DD4BF',    // Bright teal
        'teal-500': '#14B8A6',    // Vibrant teal
        'teal-600': '#0D9488',    // Darker teal
      },
      
      // Custom font families
      fontFamily: {
        // Use Poppins as a primary font
        poppins: ['Poppins', 'sans-serif'],
        // Add Inter as a secondary option for better readability
        inter: ['Inter', 'sans-serif'],
      },
      
      // Enhanced box shadows for both light and dark modes
      boxShadow: {
        // Existing glow effects (perfect for dark mode)
        'glow-sm': '0 0 8px rgba(251, 191, 36, 0.4), 0 0 12px rgba(245, 158, 11, 0.3)',
        'glow-md': '0 0 15px rgba(251, 191, 36, 0.5), 0 0 25px rgba(245, 158, 11, 0.4), 0 0 40px rgba(234, 88, 12, 0.3)',
        
        // Light mode shadows - elegant and modern
        'soft-xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'soft-sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'soft-xl': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        
        // Colored shadows for accent elements
        'orange-sm': '0 2px 8px rgba(251, 146, 60, 0.15)',
        'orange-md': '0 4px 12px rgba(251, 146, 60, 0.2)',
        'blue-sm': '0 2px 8px rgba(59, 130, 246, 0.15)',
        'blue-md': '0 4px 12px rgba(59, 130, 246, 0.2)',
        
        // Inner shadows for input fields
        'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
        'inner-md': 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
      },
      
      // Custom backdrop blur utilities
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '24px',
        '2xl': '40px',
      },
      
      // Enhanced keyframes for animations
      keyframes: {
        // Existing animations
        'subtle-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.05)', opacity: '0.6' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1'},
        },
        
        // New animations for enhanced UX
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(251, 146, 60, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(251, 146, 60, 0.8), 0 0 30px rgba(245, 158, 11, 0.6)' },
        },
      },
      
      // Enhanced animation utilities
      animation: {
        // Existing animations
        'subtle-pulse': 'subtle-pulse 4s infinite ease-in-out',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        
        // New animations
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'bounce-gentle': 'bounce-gentle 2s infinite ease-in-out',
        'glow-pulse': 'glow-pulse 3s infinite ease-in-out',
      },
      
      // Custom gradient backgrounds
      backgroundImage: {
        // Light mode gradients
        'light-warm': 'linear-gradient(135deg, #FAFAFA 0%, #F8F9FA 100%)',
        'light-subtle': 'linear-gradient(135deg, #F8F9FA 0%, #F5F5F7 100%)',
        
        // Brand gradients (work in both modes)
        'warm-sunset': 'linear-gradient(135deg, #FB923C 0%, #F59E0B 50%, #FBBF24 100%)',
        'warm-glow': 'linear-gradient(135deg, #FED7AA 0%, #FDBA74 50%, #FB923C 100%)',
        'cool-breeze': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 50%, #93C5FD 100%)',
        
        // Radial gradients for hero sections
        'hero-light': 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.1) 0%, rgba(248, 249, 250, 0.8) 70%)',
        'hero-dark': 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.2) 0%, rgba(26, 26, 29, 0.9) 70%)',
      },
    },
  },
  
  // Add any Tailwind CSS plugins here
  plugins: [],
};